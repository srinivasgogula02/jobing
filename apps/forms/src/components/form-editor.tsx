"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Globe2,
  GripVertical,
  Palette,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { publishFormAction, saveFormAction } from "@/app/app/actions";
import type { EditableForm } from "@/lib/forms-store";
import type { FormDefinition } from "@/lib/form-definition";
import { createField, duplicateField, fieldLabels, keyFromLabel, moveField, type FormField } from "@/lib/builder-utils";

type Panel = "questions" | "design" | "success" | "access";
type SaveState = "saved" | "dirty" | "saving" | "error";
type DeletedQuestion = { field: FormField; index: number };

const palette: FormField["type"][] = ["text", "textarea", "email", "tel", "number", "select", "radio", "checkbox", "yes_no", "rating", "date", "time", "file", "consent", "url"];
const optionTypes: FormField["type"][] = ["select", "radio", "checkbox"];

function localDateTime(value: string) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function PreviewControl({ field }: { field: FormField }) {
  if (field.type === "textarea") return <textarea disabled placeholder={field.placeholder || "Long answer text"} />;
  if (field.type === "select") return <select disabled defaultValue=""><option value="">Choose</option>{field.options?.map((option) => <option key={option.value}>{option.label}</option>)}</select>;
  if (field.type === "radio" || field.type === "checkbox") return <div className="answer-choices">{field.options?.map((option) => <span key={option.value}><i data-shape={field.type} />{option.label}</span>)}</div>;
  if (field.type === "consent") return <div className="answer-choices"><span><i data-shape="checkbox" />I agree</span></div>;
  if (field.type === "yes_no") return <div className="answer-choices answer-choices--inline"><span><i data-shape="radio" />Yes</span><span><i data-shape="radio" />No</span></div>;
  if (field.type === "rating") return <div className="answer-rating">{[1, 2, 3, 4, 5].map((value) => <span key={value}>{value}</span>)}</div>;
  if (field.type === "file") return <button className="answer-file" type="button" disabled><Plus size={15} /> Add file <small>Maximum {field.validation?.maxFileSizeMb ?? 2} MB</small></button>;
  return <input disabled type={field.type === "tel" ? "tel" : field.type} placeholder={field.placeholder || "Short answer text"} />;
}

function panelLabel(panel: Panel) {
  if (panel === "success") return "After submit";
  if (panel === "access") return "Behavior";
  return panel.charAt(0).toUpperCase() + panel.slice(1);
}

export function FormEditor({ form }: { form: EditableForm }) {
  const [name, setName] = useState(form.name);
  const [definition, setDefinition] = useState<FormDefinition>(form.definition);
  const [revision, setRevision] = useState(form.revision);
  const [status, setStatus] = useState(form.status);
  const [selectedId, setSelectedId] = useState(form.definition.fields[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>("questions");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [deletedQuestion, setDeletedQuestion] = useState<DeletedQuestion | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isPublishing, startPublishing] = useTransition();
  const revisionRef = useRef(revision);
  const changeVersionRef = useRef(0);
  const latestRef = useRef({ name, definition });
  const saveInFlight = useRef(false);

  useEffect(() => { latestRef.current = { name, definition }; }, [name, definition]);
  useEffect(() => {
    if (!deletedQuestion) return;
    const timer = window.setTimeout(() => setDeletedQuestion(null), 7000);
    return () => window.clearTimeout(timer);
  }, [deletedQuestion]);

  const markDirty = () => {
    changeVersionRef.current += 1;
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
    const savingVersion = changeVersionRef.current;
    const current = latestRef.current;
    let result: Awaited<ReturnType<typeof saveFormAction>>;
    try {
      result = await saveFormAction({
        formId: form.id,
        expectedRevision: revisionRef.current,
        name: current.name,
        description: current.definition.description,
        definition: current.definition,
      });
    } catch {
      saveInFlight.current = false;
      setSaveState("error");
      setError("Your changes are still on this screen, but they could not be saved. Check your connection and try again.");
      return false;
    }
    saveInFlight.current = false;
    if (!result.ok) {
      setSaveState("error");
      setError(result.error);
      return false;
    }
    revisionRef.current = result.revision;
    setRevision(result.revision);
    setStatus(result.status);
    if (changeVersionRef.current !== savingVersion) {
      setSaveState("dirty");
      window.setTimeout(() => { void save(); }, 80);
    } else {
      setSaveState("saved");
    }
    return true;
  };

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = window.setTimeout(() => { void save(); }, 900);
    return () => window.clearTimeout(timer);
    // save reads refs so edits made during the debounce cannot be lost.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState, name, definition]);

  const selectedIndex = definition.fields.findIndex((field) => field.id === selectedId);
  const selected = definition.fields[selectedIndex];
  const conditionSources = definition.fields.slice(0, Math.max(0, selectedIndex)).filter((field) => !field.hidden);

  const updateSelected = (patch: Partial<FormField>) => {
    if (!selected) return;
    changeDefinition((current) => ({
      ...current,
      fields: current.fields.map((field) => field.id === selected.id ? { ...field, ...patch } as FormField : field),
    }));
  };

  const changeFieldType = (type: FormField["type"]) => {
    if (!selected) return;
    const next = { ...selected, type } as FormField;
    if (optionTypes.includes(type)) next.options = selected.options?.length ? selected.options : [{ value: "option_1", label: "Option 1" }, { value: "option_2", label: "Option 2" }];
    else delete next.options;
    if (type === "file") next.validation = { maxFileSizeMb: 2 };
    else if (selected.type === "file") delete next.validation;
    updateSelected(next);
  };

  const addField = (type: FormField["type"]) => {
    if (definition.fields.length >= 100) return;
    const field = createField(type, definition.fields);
    changeDefinition((current) => {
      const index = current.fields.findIndex((item) => item.id === selectedId);
      const insertAt = index < 0 ? current.fields.length : index + 1;
      return { ...current, fields: [...current.fields.slice(0, insertAt), field, ...current.fields.slice(insertAt)] };
    });
    setSelectedId(field.id);
    setDeletedQuestion(null);
    setPanel("questions");
    setAddMenuOpen(false);
  };

  const publish = () => startPublishing(async () => {
    setError("");
    if (saveState !== "saved" && !await save()) return;
    let result: Awaited<ReturnType<typeof publishFormAction>>;
    try {
      result = await publishFormAction({ formId: form.id, expectedRevision: revisionRef.current });
    } catch {
      setError("The form could not be published. Check your connection and try again.");
      return;
    }
    if (!result.ok) {
      setError(result.error);
      if (result.upgradeUrl) window.location.href = result.upgradeUrl;
      return;
    }
    revisionRef.current = result.revision;
    setRevision(result.revision);
    setStatus("published");
    setSaveState("saved");
  });

  const removeSelected = () => {
    if (!selected || definition.fields.length === 1) return;
    setDeletedQuestion({ field: selected, index: selectedIndex });
    const next = definition.fields.filter((field) => field.id !== selected.id);
    changeDefinition((current) => ({ ...current, fields: next }));
    setSelectedId(next[Math.max(0, selectedIndex - 1)]?.id ?? "");
  };

  const duplicateSelected = () => {
    if (!selected || definition.fields.length >= 100) return;
    const copy = duplicateField(selected, definition.fields);
    changeDefinition((current) => ({ ...current, fields: [...current.fields.slice(0, selectedIndex + 1), copy, ...current.fields.slice(selectedIndex + 1)] }));
    setSelectedId(copy.id);
    setDeletedQuestion(null);
  };

  const undoDelete = () => {
    if (!deletedQuestion || definition.fields.length >= 100) return;
    const { field, index } = deletedQuestion;
    changeDefinition((current) => ({ ...current, fields: [...current.fields.slice(0, index), field, ...current.fields.slice(index)] }));
    setSelectedId(field.id);
    setDeletedQuestion(null);
  };

  return (
    <div className="forms-builder">
      <header className="forms-builder-toolbar">
        <div className="forms-builder-identity">
          <label className="sr-only" htmlFor="form-name">Form name</label>
          <input id="form-name" value={name} maxLength={200} onChange={(event) => { setName(event.target.value); markDirty(); }} />
          <button className={`autosave-state autosave-state--${saveState}`} type="button" onClick={() => saveState === "error" && void save()} aria-label={saveState === "error" ? "Try saving again" : undefined}>
            {saveState === "saved" ? <Check size={13} /> : null}
            {saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Saving soon…" : saveState === "error" ? "Save failed · try again" : `Saved · version ${revision}`}
          </button>
        </div>
        <div className="forms-builder-actions">
          <span className={`status-chip status-chip--${status}`}>{status}</span>
          <button className="button button--primary" type="button" onClick={publish} disabled={isPublishing || saveState === "saving"}>{isPublishing ? "Publishing…" : status === "published" ? "Publish changes" : "Publish"}</button>
        </div>
      </header>

      {error ? <div className="builder-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")}>Dismiss</button></div> : null}

      <nav className="editor-mode-tabs" aria-label="Form editor settings">
        {(["questions", "design", "success", "access"] as Panel[]).map((item) => (
          <button key={item} type="button" aria-current={panel === item ? "page" : undefined} onClick={() => setPanel(item)}>
            {item === "questions" ? <FileText size={16} /> : item === "design" ? <Palette size={16} /> : item === "access" ? <Globe2 size={16} /> : <Settings2 size={16} />}
            {panelLabel(item)}
          </button>
        ))}
      </nav>

      {panel === "questions" ? (
        <div className="question-builder-canvas">
          <div className="question-builder-column">
            <section className="form-intro-card" style={{ borderTopColor: definition.presentation.accentColor }}>
              <input aria-label="Form title" value={definition.title} maxLength={200} placeholder="Untitled form" onChange={(event) => changeDefinition((current) => ({ ...current, title: event.target.value }))} />
              <textarea aria-label="Form description" rows={2} value={definition.description ?? ""} maxLength={2000} placeholder="Form description" onChange={(event) => changeDefinition((current) => ({ ...current, description: event.target.value || undefined }))} />
            </section>

            <div className="question-list">
              {definition.fields.map((field, index) => {
                const active = field.id === selectedId;
                return (
                  <article
                    className={`question-card${active ? " question-card--active" : ""}${field.hidden ? " question-card--hidden" : ""}`}
                    draggable
                    key={field.id}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => { if (dragIndex !== null) changeDefinition((current) => ({ ...current, fields: moveField(current.fields, dragIndex, index) })); setDragIndex(null); }}
                  >
                    <button className="question-drag" type="button" aria-label={`Drag ${field.label}`}><GripVertical size={18} /></button>
                    {active ? (
                      <div className="question-card-edit">
                        <div className="question-edit-head">
                          <input aria-label="Question" value={field.label} maxLength={200} onChange={(event) => updateSelected({ label: event.target.value, key: keyFromLabel(event.target.value, definition.fields, field.id) })} />
                          <select aria-label="Question type" value={field.type} onChange={(event) => changeFieldType(event.target.value as FormField["type"])}>{palette.map((type) => <option key={type} value={type}>{fieldLabels[type]}</option>)}</select>
                        </div>
                        <input className="question-help-input" aria-label="Question help text" value={field.description ?? ""} maxLength={500} placeholder="Add a description (optional)" onChange={(event) => updateSelected({ description: event.target.value || undefined })} />
                        <div className="answer-preview"><PreviewControl field={field} /></div>

                        {field.options ? <div className="option-editor">{field.options.map((option, optionIndex) => <div key={`${field.id}-${optionIndex}`}><i data-shape={field.type} /><input aria-label={`Option ${optionIndex + 1}`} value={option.label} onChange={(event) => {
                          const options = [...(field.options ?? [])];
                          const label = event.target.value;
                          options[optionIndex] = { label, value: keyFromLabel(label, []).slice(0, 110) || `option_${optionIndex + 1}` };
                          updateSelected({ options });
                        }} maxLength={160} /><button type="button" aria-label={`Remove option ${optionIndex + 1}`} disabled={field.options?.length === 1} onClick={() => updateSelected({ options: field.options?.filter((_, itemIndex) => itemIndex !== optionIndex) })}>×</button></div>)}<button type="button" disabled={(field.options?.length ?? 0) >= 100} onClick={() => updateSelected({ options: [...(field.options ?? []), { label: `Option ${(field.options?.length ?? 0) + 1}`, value: `option_${(field.options?.length ?? 0) + 1}` }] })}><Plus size={14} /> Add option</button></div> : null}

                        <details className="advanced-settings">
                          <summary>Response validation and advanced settings</summary>
                          <div className="advanced-settings-grid">
                            <label>Response name<input value={field.key} pattern="[a-z][a-z0-9_]*" onChange={(event) => updateSelected({ key: event.target.value.toLowerCase().replace(/[^a-z0-9_]/gu, "") })} /></label>
                            {!(["consent", "file"] as FormField["type"][]).includes(field.type) ? <label>Placeholder<input value={field.placeholder ?? ""} maxLength={200} onChange={(event) => updateSelected({ placeholder: event.target.value || undefined })} /></label> : null}
                            {field.type === "text" || field.type === "textarea" ? <><label>Minimum length<input type="number" min="0" value={field.validation?.minLength ?? ""} onChange={(event) => updateSelected({ validation: { ...field.validation, minLength: event.target.value ? Number(event.target.value) : undefined } })} /></label><label>Maximum length<input type="number" min="1" value={field.validation?.maxLength ?? ""} onChange={(event) => updateSelected({ validation: { ...field.validation, maxLength: event.target.value ? Number(event.target.value) : undefined } })} /></label></> : null}
                            {field.type === "number" ? <><label>Minimum<input type="number" value={field.validation?.min ?? ""} onChange={(event) => updateSelected({ validation: { ...field.validation, min: event.target.value ? Number(event.target.value) : undefined } })} /></label><label>Maximum<input type="number" value={field.validation?.max ?? ""} onChange={(event) => updateSelected({ validation: { ...field.validation, max: event.target.value ? Number(event.target.value) : undefined } })} /></label></> : null}
                            {field.type === "file" ? <><label>Allowed file types<input placeholder=".pdf,image/*" value={field.validation?.acceptedFileTypes?.join(",") ?? ""} onChange={(event) => updateSelected({ validation: { ...field.validation, acceptedFileTypes: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) } })} /></label><label>Maximum file size<select value={field.validation?.maxFileSizeMb ?? 2} onChange={(event) => updateSelected({ validation: { ...field.validation, maxFileSizeMb: Number(event.target.value) as 1 | 2 } })}><option value="1">1 MB</option><option value="2">2 MB</option></select></label></> : null}
                            {conditionSources.length ? <>
                              <label className="advanced-checkbox"><input type="checkbox" checked={Boolean(field.condition)} onChange={(event) => updateSelected({ condition: event.target.checked ? { fieldKey: conditionSources[0].key, operator: "is_not_empty" } : undefined })} /> Show only when…</label>
                              {field.condition ? <div className="condition-settings">
                                <label>Earlier question<select value={field.condition.fieldKey} onChange={(event) => updateSelected({ condition: { ...field.condition!, fieldKey: event.target.value } })}>{conditionSources.map((source) => <option value={source.key} key={source.id}>{source.label}</option>)}</select></label>
                                <label>Rule<select value={field.condition.operator} onChange={(event) => updateSelected({ condition: { ...field.condition!, operator: event.target.value as NonNullable<FormField["condition"]>["operator"] } })}><option value="equals">is</option><option value="not_equals">is not</option><option value="contains">contains</option><option value="not_contains">does not contain</option><option value="is_empty">is unanswered</option><option value="is_not_empty">is answered</option><option value="greater_than">is greater than</option><option value="less_than">is less than</option></select></label>
                                {!(["is_empty", "is_not_empty"] as string[]).includes(field.condition.operator) ? <label>Value<input value={field.condition.value ?? ""} onChange={(event) => updateSelected({ condition: { ...field.condition!, value: event.target.value } })} placeholder="Answer to match" /></label> : null}
                              </div> : null}
                            </> : null}
                            <label className="advanced-checkbox"><input type="checkbox" checked={field.hidden} onChange={(event) => updateSelected({ hidden: event.target.checked, ...(!event.target.checked ? { defaultValue: undefined } : {}) })} /> Use as hidden context</label>
                            {field.hidden ? <label>Hidden context value <small>Saved with each response. Visitors do not see it.</small><input value={field.defaultValue ?? ""} maxLength={2000} placeholder="For example: summer_campaign" onChange={(event) => updateSelected({ defaultValue: event.target.value || undefined })} /></label> : null}
                          </div>
                        </details>

                        <footer className="question-actions">
                          <div><button type="button" aria-label="Move question up" disabled={index === 0} onClick={() => changeDefinition((current) => ({ ...current, fields: moveField(current.fields, index, index - 1) }))}><ChevronUp size={18} /></button><button type="button" aria-label="Move question down" disabled={index === definition.fields.length - 1} onClick={() => changeDefinition((current) => ({ ...current, fields: moveField(current.fields, index, index + 1) }))}><ChevronDown size={18} /></button></div>
                          <div><button type="button" aria-label="Duplicate question" disabled={definition.fields.length >= 100} onClick={duplicateSelected}><Copy size={17} /></button><button type="button" aria-label="Delete question" disabled={definition.fields.length === 1} onClick={removeSelected}><Trash2 size={17} /></button><span /><label className="required-toggle">Required<input type="checkbox" checked={field.required} onChange={(event) => updateSelected({ required: event.target.checked })} /><i /></label></div>
                        </footer>
                      </div>
                    ) : (
                      <button className="question-card-summary" type="button" onClick={() => setSelectedId(field.id)}>
                        <span><b>{field.label || "Untitled question"}{field.required ? <em>*</em> : null}</b><small>{fieldLabels[field.type]}{field.hidden ? " · Hidden" : ""}</small></span>
                        <div className="answer-preview"><PreviewControl field={field} /></div>
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="add-question-dock" aria-label="Add a question">
            <button className="add-question-button" type="button" disabled={definition.fields.length >= 100} aria-expanded={addMenuOpen} onClick={() => setAddMenuOpen((current) => !current)}><Plus size={22} /><span>{definition.fields.length >= 100 ? "Question limit reached" : "Add question"}</span></button>
            {addMenuOpen ? <div className="question-type-menu"><header><b>Add question</b><button type="button" onClick={() => setAddMenuOpen(false)}>×</button></header>{palette.map((type) => <button type="button" key={type} onClick={() => addField(type)}><Plus size={14} />{fieldLabels[type]}</button>)}</div> : null}
          </aside>
          {deletedQuestion ? <div className="question-undo" role="status"><span>Question deleted</span><button type="button" onClick={undoDelete}>Undo</button></div> : null}
        </div>
      ) : null}

      {panel === "design" ? <div className="settings-canvas"><section className="settings-card"><p>APPEARANCE</p><h2>Make it feel like your website.</h2><div className="color-settings"><label>Accent<input type="color" value={definition.presentation.accentColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, accentColor: event.target.value } }))} /></label><label>Background<input type="color" value={definition.presentation.backgroundColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, backgroundColor: event.target.value } }))} /></label><label>Text<input type="color" value={definition.presentation.textColor} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, textColor: event.target.value } }))} /></label></div><div className="settings-fields"><label>Font<select value={definition.presentation.fontFamily} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, fontFamily: event.target.value as FormDefinition["presentation"]["fontFamily"] } }))}><option value="sans">Clean sans</option><option value="serif">Editorial serif</option><option value="mono">Technical mono</option></select></label><label>Question spacing<select value={definition.presentation.spacing} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, spacing: event.target.value as FormDefinition["presentation"]["spacing"] } }))}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option></select></label><label>Button style<select value={definition.presentation.buttonStyle} onChange={(event) => changeDefinition((current) => ({ ...current, presentation: { ...current.presentation, buttonStyle: event.target.value as FormDefinition["presentation"]["buttonStyle"] } }))}><option value="solid">Solid</option><option value="outline">Outline</option></select></label></div></section><div className="appearance-preview" style={{ backgroundColor: definition.presentation.backgroundColor, color: definition.presentation.textColor }}><span style={{ color: definition.presentation.accentColor }}>LIVE PREVIEW</span><h3>{definition.title}</h3><p>{definition.fields[0]?.label}</p><i /><button style={{ background: definition.presentation.buttonStyle === "solid" ? definition.presentation.accentColor : "transparent", borderColor: definition.presentation.accentColor, color: definition.presentation.buttonStyle === "solid" ? "#151914" : definition.presentation.accentColor }}>Send response</button></div></div> : null}

      {panel === "success" ? <div className="settings-canvas settings-canvas--single"><section className="settings-card"><p>AFTER SOMEONE SUBMITS</p><h2>Show a clear next step.</h2><div className="settings-fields"><label>Thank-you title<input value={definition.confirmation.title} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, title: event.target.value } }))} /></label><label>Message<textarea rows={4} value={definition.confirmation.message} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, message: event.target.value } }))} /></label><label>Send them to another page <small>Optional HTTPS URL</small><input type="url" placeholder="https://example.com/thanks" value={definition.confirmation.redirectUrl ?? ""} onChange={(event) => changeDefinition((current) => ({ ...current, confirmation: { ...current.confirmation, redirectUrl: event.target.value || undefined } }))} /></label></div><div className="confirmation-preview"><Check size={19} /><div><b>{definition.confirmation.title}</b><p>{definition.confirmation.message}</p></div></div></section></div> : null}

      {panel === "access" ? <div className="settings-canvas settings-canvas--single"><section className="settings-card"><p>FORM BEHAVIOR</p><h2>Control when and how people respond.</h2><p className="settings-copy">Pause collection, schedule a window, stop at an exact number, or keep the form open without a cap.</p><div className="settings-fields">
        <label className="settings-check"><input type="checkbox" checked={definition.settings.acceptResponses} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, acceptResponses: event.target.checked } }))} /> Accept new responses</label>
        <label>Open on <small>Optional</small><input type="datetime-local" value={definition.settings.opensAt ? localDateTime(definition.settings.opensAt) : ""} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, opensAt: event.target.value ? new Date(event.target.value).toISOString() : undefined } }))} /></label>
        <label>Close on <small>Optional</small><input type="datetime-local" value={definition.settings.closesAt ? localDateTime(definition.settings.closesAt) : ""} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, closesAt: event.target.value ? new Date(event.target.value).toISOString() : undefined } }))} /></label>
        <label>Stop after <small>Optional total responses</small><input type="number" min="1" max="1000000" placeholder="No limit" value={definition.settings.responseLimit ?? ""} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, responseLimit: event.target.value ? Number(event.target.value) : undefined } }))} /></label>
        <label>Message when closed<textarea rows={3} value={definition.settings.closedMessage} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, closedMessage: event.target.value } }))} /></label>
        <label>Button text<input value={definition.settings.submitButtonLabel} maxLength={80} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, submitButtonLabel: event.target.value } }))} /></label>
        <label className="settings-check"><input type="checkbox" checked={definition.settings.showProgress} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, showProgress: event.target.checked } }))} /> Show completion progress</label>
        <label>Allowed websites <small>Leave empty to accept from any website. One full address per line.</small><textarea rows={5} placeholder={"https://www.example.com\nhttps://shop.example.com"} value={definition.settings.allowedOrigins.join("\n")} onChange={(event) => changeDefinition((current) => ({ ...current, settings: { ...current.settings, allowedOrigins: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 20) } }))} /></label>
      </div></section></div> : null}
    </div>
  );
}
