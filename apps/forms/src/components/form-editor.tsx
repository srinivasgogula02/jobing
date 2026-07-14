"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { EditableForm } from "@/lib/forms-store";
import type { FormDefinition } from "@/lib/form-definition";
import { createField, duplicateField, fieldLabels, keyFromLabel, moveField, type FormField } from "@/lib/builder-utils";
import { publishFormAction, saveFormAction } from "@/app/app/actions";

type Panel = "fields" | "design" | "success" | "access";
type SaveState = "saved" | "dirty" | "saving" | "error";

const palette: FormField["type"][] = ["text", "email", "tel", "number", "textarea", "select", "checkbox", "radio", "date", "file", "consent", "url"];

function PreviewControl({ field }: { field: FormField }) {
  if (field.type === "textarea") return <textarea disabled placeholder={field.placeholder || "Type your answer"} />;
  if (field.type === "select") return <select disabled defaultValue=""><option value="">Choose one</option>{field.options?.map((option) => <option key={option.value}>{option.label}</option>)}</select>;
  if (field.type === "radio" || field.type === "checkbox") return <div className="preview-choices">{field.options?.map((option) => <span key={option.value}><i />{option.label}</span>)}</div>;
  if (field.type === "consent") return <div className="preview-choices"><span><i />{field.label}</span></div>;
  if (field.type === "file") return <div className="preview-file">Choose a file <small>Up to {field.validation?.maxFileSizeMb ?? 2} MB</small></div>;
  return <input disabled type={field.type === "tel" ? "tel" : field.type} placeholder={field.placeholder || "Type your answer"} />;
}

export function FormEditor({ form }: { form: EditableForm }) {
  const [name, setName] = useState(form.name);
  const [definition, setDefinition] = useState<FormDefinition>(form.definition);
  const [revision, setRevision] = useState(form.revision);
  const [status, setStatus] = useState(form.status);
  const [selectedId, setSelectedId] = useState(form.definition.fields[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>("fields");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPublishing, startPublishing] = useTransition();
  const revisionRef = useRef(revision);
  const latestRef = useRef({ name, definition });
  const saveInFlight = useRef(false);

  useEffect(() => { latestRef.current = { name, definition }; }, [name, definition]);

  const markDirty = () => {
    setSaveState("dirty");
    setError("");
  };

  const changeDefinition = (next: FormDefinition | ((current: FormDefinition) => FormDefinition)) => {
    setDefinition(next);
    markDirty();
  };

  const save = async () => {
    if (saveInFlight.current) return false;
    saveInFlight.current = true;
    setSaveState("saving");
    const current = latestRef.current;
    const result = await saveFormAction({
      formId: form.id,
      expectedRevision: revisionRef.current,
      name: current.name,
      description: current.definition.description,
      definition: current.definition,
    });
    saveInFlight.current = false;
    if (!result.ok) {
      setSaveState("error");
      setError(result.error);
      return false;
    }
    revisionRef.current = result.revision;
    setRevision(result.revision);
    setStatus(result.status);
    setSaveState("saved");
    return true;
  };

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => { void save(); }, 900);
    return () => window.clearTimeout(timer);
    // save deliberately reads latestRef and revisionRef to avoid stale autosaves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState, name, definition]);

  const selectedIndex = definition.fields.findIndex((field) => field.id === selectedId);
  const selected = definition.fields[selectedIndex];

  const updateSelected = (patch: Partial<FormField>) => {
    if (!selected) return;
    changeDefinition((current) => ({
      ...current,
      fields: current.fields.map((field) => field.id === selected.id ? { ...field, ...patch } as FormField : field),
    }));
  };

  const addField = (type: FormField["type"]) => {
    const field = createField(type, definition.fields);
    changeDefinition((current) => ({ ...current, fields: [...current.fields, field] }));
    setSelectedId(field.id);
    setPanel("fields");
  };

  const publish = () => startPublishing(async () => {
    setError("");
    if (saveState !== "saved" && !await save()) return;
    const result = await publishFormAction({ formId: form.id, expectedRevision: revisionRef.current });
    if (!result.ok) {
      setError(result.error);
      if (result.upgradeUrl) window.location.href = result.upgradeUrl;
      return;
    }
    setStatus("published");
  });

  return (
    <div className="builder">
      <div className="builder-toolbar">
        <div>
          <label className="sr-only" htmlFor="form-name">Form name</label>
          <input id="form-name" className="builder-name" value={name} maxLength={200} onChange={(event) => { setName(event.target.value); markDirty(); }} />
          <span className={`save-indicator save-indicator--${saveState}`} role="status">
            {saveState === "saving" ? "Saving" : saveState === "dirty" ? "Unsaved" : saveState === "error" ? "Save failed" : `Saved · revision ${revision}`}
          </span>
        </div>
        <div className="builder-toolbar__actions">
          <span className={`status-chip status-chip--${status}`}>{status}</span>
          <button className="button" type="button" onClick={() => void save()} disabled={saveState === "saving"}>Save</button>
          <button className="button button--primary" type="button" onClick={publish} disabled={isPublishing || saveState === "saving"}>{isPublishing ? "Publishing" : status === "published" ? "Publish changes" : "Publish form"}</button>
        </div>
      </div>
      {error ? <div className="builder-error" role="alert">{error}</div> : null}
      <div className="builder-tabs" role="tablist" aria-label="Builder controls">
        {(["fields", "design", "success", "access"] as Panel[]).map((item) => <button key={item} type="button" role="tab" aria-selected={panel === item} onClick={() => setPanel(item)}>{item === "success" ? "After submit" : item === "access" ? "Domains" : item}</button>)}
      </div>
      <div className="builder-grid">
        <aside className="builder-controls" aria-label="Form controls">
          {panel === "fields" ? <>
            <section className="control-section">
              <div className="control-heading"><h2>Fields</h2><span>{definition.fields.length}/100</span></div>
              <div className="field-palette">{palette.map((type) => <button type="button" key={type} onClick={() => addField(type)}><span aria-hidden="true">+</span>{fieldLabels[type]}</button>)}</div>
            </section>
            <section className="control-section">
              <h2>Order and edit</h2>
              <div className="field-list">
                {definition.fields.map((field, index) => <div
                  key={field.id}
                  className={`field-row${selectedId === field.id ? " field-row--selected" : ""}${field.hidden ? " field-row--hidden" : ""}`}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => { if (dragIndex !== null) changeDefinition((current) => ({ ...current, fields: moveField(current.fields, dragIndex, index) })); setDragIndex(null); }}
                >
                  <button className="field-row__select" type="button" onClick={() => setSelectedId(field.id)} aria-pressed={selectedId === field.id}><span className="drag-mark" aria-hidden="true">⋮⋮</span><span><strong>{field.label}</strong><small>{fieldLabels[field.type]} · {field.key}</small></span></button>
                  <div className="field-row__moves">
                    <button type="button" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => changeDefinition((current) => ({ ...current, fields: moveField(current.fields, index, index - 1) }))}>↑</button>
                    <button type="button" aria-label={`Move ${field.label} down`} disabled={index === definition.fields.length - 1} onClick={() => changeDefinition((current) => ({ ...current, fields: moveField(current.fields, index, index + 1) }))}>↓</button>
                  </div>
                </div>)}
              </div>
            </section>
            {selected ? <section className="control-section field-settings">
              <h2>Edit field</h2>
              <label>Label<input value={selected.label} onChange={(event) => updateSelected({ label: event.target.value, key: keyFromLabel(event.target.value, definition.fields, selected.id) })} /></label>
              <label>Field key<input value={selected.key} pattern="[a-z][a-z0-9_]*" onChange={(event) => updateSelected({ key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/gu, "") })} /></label>
              {!(["consent", "file"] as FormField["type"][]).includes(selected.type) ? <label>Placeholder<input value={selected.placeholder ?? ""} onChange={(event) => updateSelected({ placeholder: event.target.value || undefined })} /></label> : null}
              <label>Help text<textarea rows={2} value={selected.description ?? ""} onChange={(event) => updateSelected({ description: event.target.value || undefined })} /></label>
              <div className="toggle-row"><label><input type="checkbox" checked={selected.required} onChange={(event) => updateSelected({ required: event.target.checked })} />Required</label><label><input type="checkbox" checked={selected.hidden} onChange={(event) => updateSelected({ hidden: event.target.checked })} />Hidden</label></div>
              {selected.options ? <label>Options <small>One label per line</small><textarea rows={5} value={selected.options.map((option) => option.label).join("\n")} onChange={(event) => {
                const labels = event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 100);
                updateSelected({ options: (labels.length ? labels : ["Option 1"]).map((label, index) => ({ label, value: keyFromLabel(label, []).slice(0, 110) || `option_${index + 1}` })) });
              }} /></label> : null}
              {selected.type === "text" || selected.type === "textarea" ? <div className="two-columns"><label>Min length<input type="number" min="0" value={selected.validation?.minLength ?? ""} onChange={(event) => updateSelected({ validation: { ...selected.validation, minLength: event.target.value ? Number(event.target.value) : undefined } })} /></label><label>Max length<input type="number" min="1" value={selected.validation?.maxLength ?? ""} onChange={(event) => updateSelected({ validation: { ...selected.validation, maxLength: event.target.value ? Number(event.target.value) : undefined } })} /></label></div> : null}
              {selected.type === "number" ? <div className="two-columns"><label>Minimum<input type="number" value={selected.validation?.min ?? ""} onChange={(event) => updateSelected({ validation: { ...selected.validation, min: event.target.value ? Number(event.target.value) : undefined } })} /></label><label>Maximum<input type="number" value={selected.validation?.max ?? ""} onChange={(event) => updateSelected({ validation: { ...selected.validation, max: event.target.value ? Number(event.target.value) : undefined } })} /></label></div> : null}
              {selected.type === "file" ? <><label>Allowed types <small>Comma separated, for example .pdf,image/*</small><input value={selected.validation?.acceptedFileTypes?.join(",") ?? ""} onChange={(event) => updateSelected({ validation: { ...selected.validation, acceptedFileTypes: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } })} /></label><label>Maximum size<select value={selected.validation?.maxFileSizeMb ?? 2} onChange={(event) => updateSelected({ validation: { ...selected.validation, maxFileSizeMb: Number(event.target.value) as 1 | 2 } })}><option value="1">1 MB</option><option value="2">2 MB</option></select></label></> : null}
              <div className="field-actions"><button type="button" onClick={() => {
                const copy = duplicateField(selected, definition.fields);
                changeDefinition((current) => ({ ...current, fields: [...current.fields.slice(0, selectedIndex + 1), copy, ...current.fields.slice(selectedIndex + 1)] }));
                setSelectedId(copy.id);
              }}>Duplicate</button><button type="button" className="danger-link" disabled={definition.fields.length === 1} onClick={() => {
                const next = definition.fields.filter((field) => field.id !== selected.id);
                changeDefinition((current) => ({ ...current, fields: next }));
                setSelectedId(next[Math.max(0, selectedIndex - 1)]?.id ?? "");
              }}>Delete</button></div>
            </section> : null}
          </> : null}

          {panel === "design" ? <section className="control-section field-settings"><h2>Appearance</h2>
            <div className="two-columns"><label>Accent<input type="color" value={definition.presentation.accentColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, accentColor: event.target.value } }))} /></label><label>Background<input type="color" value={definition.presentation.backgroundColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, backgroundColor: event.target.value } }))} /></label></div>
            <label>Text color<input type="color" value={definition.presentation.textColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, textColor: event.target.value } }))} /></label>
            <label>Font<select value={definition.presentation.fontFamily} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, fontFamily: event.target.value as FormDefinition["presentation"]["fontFamily"] } }))}><option value="sans">Clean sans</option><option value="serif">Editorial serif</option><option value="mono">Technical mono</option></select></label>
            <label>Spacing<select value={definition.presentation.spacing} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, spacing: event.target.value as FormDefinition["presentation"]["spacing"] } }))}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option></select></label>
            <label>Button<select value={definition.presentation.buttonStyle} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, buttonStyle: event.target.value as FormDefinition["presentation"]["buttonStyle"] } }))}><option value="solid">Solid</option><option value="outline">Outline</option></select></label>
          </section> : null}

          {panel === "success" ? <section className="control-section field-settings"><h2>After submit</h2>
            <label>Thank-you title<input value={definition.confirmation.title} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, title: event.target.value } }))} /></label>
            <label>Message<textarea rows={4} value={definition.confirmation.message} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, message: event.target.value } }))} /></label>
            <label>Redirect URL <small>Optional HTTPS page</small><input type="url" placeholder="https://example.com/thanks" value={definition.confirmation.redirectUrl ?? ""} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, redirectUrl: event.target.value || undefined } }))} /></label>
          </section> : null}

          {panel === "access" ? <section className="control-section field-settings"><h2>Allowed websites</h2><p className="control-copy">Leave this empty to accept submissions from any website. Add domains to restrict the endpoint.</p><label>Allowed domains <small>One HTTPS origin per line</small><textarea rows={7} placeholder="https://www.example.com" value={definition.settings.allowedOrigins.join("\n")} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { allowedOrigins: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 20) } }))} /></label></section> : null}
        </aside>

        <section className="builder-preview" aria-label="Live form preview">
          <div className="preview-toolbar"><div><span>Private draft preview</span><small>Visitors only see the last published version</small></div><div role="group" aria-label="Preview size"><button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</button><button type="button" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Mobile</button></div></div>
          <div className={`preview-stage preview-stage--${device}`}>
            <div className={`form-preview form-preview--${definition.presentation.spacing}`} style={{ backgroundColor: definition.presentation.backgroundColor, color: definition.presentation.textColor, fontFamily: definition.presentation.fontFamily === "serif" ? "Georgia, serif" : definition.presentation.fontFamily === "mono" ? "var(--font-mono), monospace" : "var(--font-sans), sans-serif" }}>
              <p className="preview-eyebrow" style={{ color: definition.presentation.accentColor }}>Secure response</p>
              <input className="preview-title-input" aria-label="Form title" value={definition.title} onChange={(event) => changeDefinition((current) => ({ ...current, title: event.target.value }))} />
              <textarea className="preview-description-input" aria-label="Form description" rows={2} value={definition.description ?? ""} placeholder="Add a short description" onChange={(event) => changeDefinition((current) => ({ ...current, description: event.target.value || undefined }))} />
              <div className="preview-fields">{definition.fields.filter((field) => !field.hidden).map((field, index) => <div className="preview-field" key={field.id} onClick={() => { setPanel("fields"); setSelectedId(field.id); }}><span>{String(index + 1).padStart(2, "0")}</span><div><label>{field.label}{field.required ? " *" : ""}</label>{field.description ? <p>{field.description}</p> : null}<PreviewControl field={field} /></div></div>)}</div>
              <button className={`preview-submit preview-submit--${definition.presentation.buttonStyle}`} style={{ background: definition.presentation.buttonStyle === "solid" ? definition.presentation.accentColor : "transparent", color: definition.presentation.buttonStyle === "solid" ? "#0b0e14" : definition.presentation.accentColor, borderColor: definition.presentation.accentColor }} type="button">Send response</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
