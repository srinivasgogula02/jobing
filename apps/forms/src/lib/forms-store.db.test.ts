import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

describe.skipIf(!databaseUrl)("forms database grant-scoped idempotency", () => {
  let pool: Pool | undefined;
  let client: PoolClient | undefined;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    client = await pool.connect();
    await client.query("begin");
  });

  afterAll(async () => {
    if (client) {
      await client.query("rollback");
      client.release();
    }
    await pool?.end();
  });

  it("does not replay create or publish operations across OAuth grants", async () => {
    if (!client) throw new Error("Test database client was not initialized.");

    const actorId = `grant_scope_test_${randomUUID()}`;
    const clientId = "grant_scope_test_client";
    const firstGrantId = randomUUID();
    const secondGrantId = randomUUID();
    const projectionOperationId = `projection-${randomUUID()}`;
    const createOperationId = `create-${randomUUID()}`;
    const publishOperationId = `publish-${randomUUID()}`;

    await client.query(
      "select forms_api.apply_workspace_projection($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6)",
      [
        projectionOperationId,
        `projection-hash-${randomUUID()}`,
        JSON.stringify({
          sourceWorkspaceId: `workspace_${randomUUID()}`,
          kind: "personal",
          displayName: "Grant scope test",
          status: "active",
          sourceVersion: 1,
        }),
        JSON.stringify({ actorId, role: "owner", status: "active", sourceVersion: 1 }),
        JSON.stringify({
          planKey: "test",
          status: "active",
          sourceVersion: 1,
          features: {},
          limits: { "forms.total": 10, "forms.published": 10 },
        }),
        actorId,
      ],
    );

    const definition = JSON.stringify({
      schemaVersion: 1,
      title: "Grant scope test",
      fields: [
        {
          id: randomUUID(),
          key: "email",
          type: "email",
          label: "Email",
          required: true,
        },
      ],
      confirmation: { message: "Thanks" },
    });
    const create = (grantId: string) =>
      client!.query<{ value: { id: string } }>(
        "select forms_api.create_form_draft($1, $2, $3::uuid, $4, $5, $6, $7, $8::jsonb) as value",
        [actorId, clientId, grantId, createOperationId, `create-hash-${grantId}`, "Grant scope test", null, definition],
      );

    const firstCreate = await create(firstGrantId);
    const secondCreate = await create(secondGrantId);

    expect(firstCreate.rows[0]?.value.id).not.toBe(secondCreate.rows[0]?.value.id);

    const createRecords = await client.query<{ records: number; scopes: number }>(
      `select count(*)::integer as records, count(distinct scope_hash)::integer as scopes
       from forms_private.idempotency_records
       where operation = 'form.create' and operation_id = $1`,
      [createOperationId],
    );
    expect(createRecords.rows[0]).toEqual({ records: 2, scopes: 2 });

    const formId = firstCreate.rows[0]!.value.id;
    const publish = (grantId: string) =>
      client!.query<{ value: { id: string; version: number } }>(
        "select forms_api.publish_form($1, $2::uuid, $3, $4, $5, $6, $7::uuid) as value",
        [actorId, formId, 1, publishOperationId, `publish-hash-${grantId}`, clientId, grantId],
      );

    const firstPublish = await publish(firstGrantId);
    const secondPublish = await publish(secondGrantId);

    expect(firstPublish.rows[0]?.value).toEqual(secondPublish.rows[0]?.value);

    const publishRecords = await client.query<{ records: number; scopes: number }>(
      `select count(*)::integer as records, count(distinct scope_hash)::integer as scopes
       from forms_private.idempotency_records
       where operation = 'form.publish' and operation_id = $1`,
      [publishOperationId],
    );
    expect(publishRecords.rows[0]).toEqual({ records: 2, scopes: 2 });
  });
});
