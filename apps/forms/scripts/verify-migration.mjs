import pg from "pg";

const migrationConnectionString = process.env.DATABASE_MIGRATION_URL;
const runtimeConnectionString = process.env.DATABASE_URL;
if (!migrationConnectionString) {
  throw new Error("DATABASE_MIGRATION_URL is required for migration verification.");
}
if (!runtimeConnectionString) {
  throw new Error("DATABASE_URL is required to verify the actual runtime credential.");
}

const migrationClient = new pg.Client({
  connectionString: migrationConnectionString,
  connectionTimeoutMillis: 5_000,
  application_name: "jobing-forms-migration-verifier",
});
const runtimeClient = new pg.Client({
  connectionString: runtimeConnectionString,
  connectionTimeoutMillis: 5_000,
  application_name: "jobing-forms-runtime-verifier",
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertPermissionDenied(client, statement, description) {
  try {
    await client.query(statement);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "42501") return;
    throw error;
  }
  throw new Error(`${description} unexpectedly succeeded.`);
}

try {
  await migrationClient.connect();
  await runtimeClient.connect();

  const history = await migrationClient.query(
    "select name from public.jobing_forms_schema_migrations order by version",
  );
  assert(history.rowCount === 12, `Expected 12 migrations, found ${history.rowCount}.`);

  const privileges = await migrationClient.query(`
    select
      has_function_privilege(
        'jobing_forms_control',
        'forms_api.create_form_draft(text,text,uuid,text,text,text,text,jsonb)',
        'EXECUTE'
      ) as control_can_create,
      has_function_privilege(
        'jobing_forms_control',
        'forms_api.publish_form(text,uuid,bigint,text,text,text,uuid)',
        'EXECUTE'
      ) as control_can_publish,
      has_function_privilege(
        'jobing_forms_sync',
        'forms_api.apply_workspace_projection(text,text,jsonb,jsonb,jsonb,text)',
        'EXECUTE'
      ) as sync_can_project,
      has_function_privilege('jobing_forms_ingest','forms_api.accept_submission(text,text,jsonb,text,text)','EXECUTE') as ingest_can_submit,
      has_table_privilege('jobing_forms_control', 'forms.forms', 'SELECT') as control_can_read_tables,
      pg_has_role('jobing_forms_control', 'jobing_forms_owner', 'MEMBER') as control_is_owner,
      pg_has_role('jobing_forms_sync', 'jobing_forms_owner', 'MEMBER') as sync_is_owner
  `);
  const proof = privileges.rows[0];
  assert(proof.control_can_create === true, "Control role cannot create form drafts.");
  assert(proof.control_can_publish === true, "Control role cannot publish forms.");
  assert(proof.sync_can_project === true, "Sync role cannot apply workspace projections.");
  assert(proof.ingest_can_submit === true, "Ingest role cannot accept submissions.");
  assert(proof.control_can_read_tables === false, "Control role unexpectedly has base-table access.");
  assert(proof.control_is_owner === false && proof.sync_is_owner === false, "Runtime role inherits owner privileges.");

  const rls = await migrationClient.query(`
    select count(*)::integer as unforced
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname in ('forms', 'forms_audit', 'forms_private')
      and relation.relkind = 'r'
      and (not relation.relrowsecurity or not relation.relforcerowsecurity)
  `);
  assert(rls.rows[0].unforced === 0, `${rls.rows[0].unforced} application tables do not force RLS.`);

  const functionAclSafety = await migrationClient.query(`
    select
      (select count(*)::integer
       from pg_proc as procedure
       join pg_namespace as namespace on namespace.oid = procedure.pronamespace
       where namespace.nspname in ('forms', 'forms_private', 'forms_audit', 'forms_api')
         and has_function_privilege('public', procedure.oid, 'EXECUTE')) as public_executables,
      (select count(*)::integer
       from pg_default_acl as defaults
       where defaults.defaclrole = 'jobing_forms_owner'::regrole
         and defaults.defaclnamespace = 0
         and defaults.defaclobjtype = 'f'
         and not exists (
           select 1
           from aclexplode(defaults.defaclacl) as privilege
           where privilege.grantee = 0 and privilege.privilege_type = 'EXECUTE'
         )) as safe_global_defaults
  `);
  const aclSafety = functionAclSafety.rows[0];
  assert(aclSafety.public_executables === 0, "PUBLIC can execute Forms application functions.");
  assert(aclSafety.safe_global_defaults === 1,
    "The Forms owner default ACL does not revoke PUBLIC function execution globally.");

  const runtimeRole = await runtimeClient.query(`
    select
      current_user as role_name,
      roles.rolsuper,
      roles.rolcreatedb,
      roles.rolcreaterole,
      roles.rolreplication,
      roles.rolbypassrls,
      pg_has_role(current_user, 'jobing_forms_owner', 'MEMBER') as is_owner_member,
      pg_has_role(current_user, 'jobing_forms_control', 'MEMBER') as is_control_member,
      pg_has_role(current_user, 'jobing_forms_sync', 'MEMBER') as is_sync_member,
      pg_has_role(current_user, 'jobing_forms_ingest', 'MEMBER') as is_ingest_member,
      (select pg_get_userbyid(datdba) = current_user from pg_database where datname = current_database())
        as owns_database
    from pg_roles as roles
    where roles.rolname = current_user
  `);
  const runtime = runtimeRole.rows[0];
  assert(runtime, "The runtime login is not visible in pg_roles.");
  assert(runtime.role_name !== "jobing_forms_owner", "DATABASE_URL uses the Forms object-owner role.");
  assert(runtime.rolsuper === false, "DATABASE_URL uses a superuser login.");
  assert(runtime.rolcreatedb === false, "DATABASE_URL can create databases.");
  assert(runtime.rolcreaterole === false, "DATABASE_URL can create roles.");
  assert(runtime.rolreplication === false, "DATABASE_URL has replication privilege.");
  assert(runtime.rolbypassrls === false, "DATABASE_URL can bypass row-level security.");
  assert(runtime.is_owner_member === false, "DATABASE_URL inherits the Forms owner role.");
  assert(runtime.is_control_member === true, "DATABASE_URL is missing the control role.");
  assert(runtime.is_sync_member === true, "DATABASE_URL is missing the sync role.");
  assert(runtime.is_ingest_member === true, "DATABASE_URL is missing the ingest role.");
  assert(runtime.owns_database === false, "DATABASE_URL owns the database.");

  const ownedObjects = await runtimeClient.query(`
    select
      (select count(*)::integer
       from pg_namespace
       where nspname in ('forms', 'forms_private', 'forms_audit', 'forms_api')
         and nspowner = (select oid from pg_roles where rolname = current_user)) as schemas,
      (select count(*)::integer
       from pg_class as relation
       join pg_namespace as namespace on namespace.oid = relation.relnamespace
       where namespace.nspname in ('forms', 'forms_private', 'forms_audit', 'forms_api')
         and relation.relowner = (select oid from pg_roles where rolname = current_user)) as relations,
      (select count(*)::integer
       from pg_proc as procedure
       join pg_namespace as namespace on namespace.oid = procedure.pronamespace
       where namespace.nspname in ('forms', 'forms_private', 'forms_audit', 'forms_api')
         and procedure.proowner = (select oid from pg_roles where rolname = current_user)) as functions
  `);
  const owned = ownedObjects.rows[0];
  assert(owned.schemas === 0 && owned.relations === 0 && owned.functions === 0,
    "DATABASE_URL owns Forms application objects.");

  const directPrivileges = await runtimeClient.query(`
    select count(*)::integer as privileged
    from pg_class as relation
    join pg_namespace as namespace on namespace.oid = relation.relnamespace
    where namespace.nspname in ('forms', 'forms_private', 'forms_audit')
      and relation.relkind in ('r', 'p', 'S')
      and (
        has_table_privilege(current_user, relation.oid, 'SELECT')
        or has_table_privilege(current_user, relation.oid, 'INSERT')
        or has_table_privilege(current_user, relation.oid, 'UPDATE')
        or has_table_privilege(current_user, relation.oid, 'DELETE')
        or has_table_privilege(current_user, relation.oid, 'TRUNCATE')
        or has_table_privilege(current_user, relation.oid, 'REFERENCES')
        or has_table_privilege(current_user, relation.oid, 'TRIGGER')
      )
  `);
  assert(directPrivileges.rows[0].privileged === 0, "DATABASE_URL has direct base-table privileges.");

  const executableFunctions = await runtimeClient.query(`
    select procedure.proname
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'forms_api'
      and has_function_privilege(current_user, procedure.oid, 'EXECUTE')
    order by procedure.proname
  `);
  const executableNames = executableFunctions.rows.map((row) => row.proname);
  const expectedNames = [
    "accept_submission",
    "accept_submission_v2",
    "apply_workspace_projection",
    "claim_request_nonce",
    "create_dashboard_form",
    "create_form_draft",
    "duplicate_dashboard_form",
    "get_submission_file",
    "get_public_form",
    "get_submission",
    "list_blocked_submissions",
    "list_forms",
    "list_submission_files",
    "list_submissions",
    "list_submissions_v2",
    "publish_dashboard_form",
    "publish_form",
    "record_blocked_submission",
    "set_submission_review_state",
    "update_dashboard_form",
  ];
  assert(
    JSON.stringify(executableNames) === JSON.stringify(expectedNames),
    `DATABASE_URL has the wrong Forms API surface: ${executableNames.join(", ") || "none"}.`,
  );

  await assertPermissionDenied(
    runtimeClient,
    "select id from forms.forms limit 1",
    "A direct base-table read through DATABASE_URL",
  );

  process.stdout.write("Forms migration and runtime-role verification passed.\n");
} finally {
  await Promise.allSettled([migrationClient.end(), runtimeClient.end()]);
}
