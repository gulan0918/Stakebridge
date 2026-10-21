import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  canComplete,
  chronological,
  completion,
  defaultStages,
  displayDate,
  download,
  fileSize,
  newId,
  newStakeholder,
  safeFilename,
  SECTIONS,
  stageProblem,
  type SectionKey,
  type Stage,
  type Stakeholder,
  type Workspace,
} from "./stakebridge/model";
import { createBackup, readBackup } from "./stakebridge/storage";
import type { WorkspaceStore } from "./stakebridge/useWorkspace";
import { exportWord } from "./stakebridge/word";
import { InterviewDate } from "./stakebridge/InterviewDate";
import { LibraryPicker } from "../registry/LibraryPicker";
import type { Registry, RegistryEntry } from "../registry/schema";
import "./StakeholderWorkspace.css";

function Icon({
  name,
}: {
  name: "bridge" | "plus" | "arrow" | "file" | "download" | "search" | "check";
}) {
  const paths = {
    bridge: (
      <>
        <path d="M3 19V5m18 14V5M3 12c6 0 4-7 9-7s3 7 9 7M3 16h18M8 11v5m8-5v5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="m8 5 7 7-7 7" />,
    file: (
      <>
        <path d="M14 3H5v18h14V8zM14 3v6h5M8 13h8M8 17h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function StageFields({
  stages,
  onChange,
  occupied = new Set(),
}: {
  stages: Stage[];
  onChange: (stages: Stage[]) => void;
  occupied?: Set<string>;
}) {
  const prefix = useId();
  function move(index: number, direction: number) {
    const next = [...stages];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  return (
    <div className="sb-stage-fields">
      {stages.map((stage, index) => (
        <div className="sb-stage-row" key={stage.id}>
          <span className="sb-step-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <label className="sb-sr-only" htmlFor={`${prefix}-${stage.id}`}>
            Stage {index + 1} name
          </label>
          <input
            id={`${prefix}-${stage.id}`}
            value={stage.name}
            maxLength={70}
            required
            onChange={(event) =>
              onChange(
                stages.map((item) =>
                  item.id === stage.id
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              )
            }
          />
          <button
            type="button"
            className="sb-icon-button"
            aria-label={`Move stage ${index + 1} up`}
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className="sb-icon-button"
            aria-label={`Move stage ${index + 1} down`}
            disabled={index === stages.length - 1}
            onClick={() => move(index, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className="sb-icon-button sb-remove"
            aria-label={`Remove stage ${index + 1}`}
            disabled={stages.length <= 4 || occupied.has(stage.id)}
            title={
              occupied.has(stage.id)
                ? "Move this stage’s stakeholders before removing it."
                : "At least four stages are required."
            }
            onClick={() =>
              onChange(stages.filter((item) => item.id !== stage.id))
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="sb-button sb-button-outline"
        disabled={stages.length >= 8}
        onClick={() => onChange([...stages, { id: newId(), name: "" }])}
      >
        <Icon name="plus" /> Add a stage
      </button>
      <span className="sb-small">{stages.length} of 8 stages · minimum 4</span>
    </div>
  );
}

function Setup({
  onCreate,
  onRestore,
  initialStages,
}: {
  onCreate: (workspace: Workspace) => void;
  onRestore: () => void;
  initialStages?: Stage[];
}) {
  const prefix = useId();
  const [team, setTeam] = useState("");
  const [project, setProject] = useState("");
  const [stages, setStages] = useState(() => initialStages || defaultStages());
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    const problem = stageProblem(stages);
    if (problem) {
      setError(problem);
      return;
    }
    onCreate({
      version: 1,
      team: team.trim(),
      project: project.trim(),
      stages: stages.map((stage) => ({ ...stage, name: stage.name.trim() })),
      stakeholders: [],
    });
  }
  return (
    <div className="sb-setup">
      <div className="sb-setup-story">
        <div className="sb-display">
          Your project.
          <br />
          <em>Your stakeholders.</em>
        </div>
        <div className="sb-method">
          {SECTIONS.map((section, index) => (
            <div key={section.key}>
              <span>0{index + 1}</span>
              <div>
                <b>{section.title}</b>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form className="sb-setup-form" onSubmit={submit}>
        <div className="sb-setup-progress">
          <span className={step === 1 ? "is-active" : ""}>
            1 · Your project
          </span>
          <span className={step === 2 ? "is-active" : ""}>
            2 · Your journey
          </span>
        </div>
        <h2>{step === 1 ? "Start with your project" : "Define your stages"}</h2>
        {step === 2 && (
          <p>Choose 4–8 stages. Rename and reorder to fit your project.</p>
        )}
        {step === 1 ? (
          <div className="sb-fields">
            <label htmlFor={`${prefix}-team`}>
              Team name
              <input
                id={`${prefix}-team`}
                value={team}
                maxLength={120}
                required
                placeholder="e.g. ZJU-China"
                onChange={(event) => setTeam(event.target.value)}
                pattern=".*\S.*"
              />
            </label>
            <label htmlFor={`${prefix}-project`}>
              Project name
              <input
                id={`${prefix}-project`}
                value={project}
                maxLength={120}
                required
                placeholder="What are you building?"
                onChange={(event) => setProject(event.target.value)}
                pattern=".*\S.*"
              />
            </label>
          </div>
        ) : (
          <StageFields
            stages={stages}
            onChange={(value) => {
              setStages(value);
              setError("");
            }}
          />
        )}
        {error && (
          <p className="sb-error" role="alert">
            {error}
          </p>
        )}
        <div className="sb-actions">
          {step === 2 && (
            <button
              type="button"
              className="sb-button sb-button-outline"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          )}
          <button className="sb-button sb-button-primary" type="submit">
            {step === 1 ? "Continue" : "Open workspace"}
            <Icon name="arrow" />
          </button>
        </div>
        <button className="sb-text-button" type="button" onClick={onRestore}>
          Restore backup
        </button>
      </form>
    </div>
  );
}

function Panel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <section className="sb-panel" aria-label={title}>
      <div className="sb-panel-title">
        <h2>{title}</h2>
        <button
          className="sb-icon-button"
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </div>
      {children}
    </section>
  );
}

export function StakeholderWorkspace({
  store,
  openRecordId,
  starter,
  registry,
  registryError,
  onAddFromLibrary,
}: {
  store: WorkspaceStore;
  openRecordId?: string;
  starter?: { stages: Stage[]; records: Stakeholder[] };
  registry: Registry | null;
  registryError: string;
  onAddFromLibrary: (entry: RegistryEntry, stageId: string) => string;
}) {
  const { workspace, loading, loadError, saveState, change, flush, getFile } =
    store;
  const prefix = useId();
  const root = useRef<HTMLElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [selectedStage, setSelectedStage] = useState(
    () =>
      workspace?.stakeholders.find((item) => item.id === openRecordId)
        ?.stageId || "",
  );
  const [editingId, setEditingId] = useState<string | null>(
    openRecordId || null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [panel, setPanel] = useState<
    "journey" | "export" | "backup" | "library" | null
  >(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [teamName, setTeamName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [includeDrafts, setIncludeDrafts] = useState(true);
  const [deletePrompt, setDeletePrompt] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [restore, setRestore] = useState<Awaited<
    ReturnType<typeof readBackup>
  > | null>(null);
  const editing = workspace?.stakeholders.find((item) => item.id === editingId);
  const activeStage =
    workspace?.stages.find(
      (stage) => stage.id === (editing?.stageId || selectedStage),
    ) || workspace?.stages[0];

  function focusWorkspace() {
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      root.current?.focus({ preventScroll: true });
    });
  }
  function openEditor(id: string) {
    setEditingId(id);
    setDeletePrompt(false);
    setPanel(null);
    setError("");
    focusWorkspace();
  }
  function updateItem(
    update: Partial<Stakeholder>,
    files = new Map<string, Blob>(),
    deleted: string[] = [],
  ) {
    if (!editing) return;
    change(
      (previous) => ({
        ...previous,
        stakeholders: previous.stakeholders.map((item) => {
          if (item.id !== editing.id) return item;
          const next = { ...item, ...update };
          if (!canComplete(next)) next.status = "draft";
          return next;
        }),
      }),
      files,
      deleted,
    );
  }
  async function action(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "This action could not be completed. Please try again.",
      );
    } finally {
      setBusy("");
    }
  }
  async function attach(files: FileList | null, section: SectionKey) {
    if (!files?.length || !editing) return;
    const id = editing.id;
    const selected = [...files];
    await action("upload", async () => {
      const estimate = await navigator.storage?.estimate?.();
      const total = selected.reduce((sum, file) => sum + file.size, 0);
      if (selected.some((file) => file.size > 200 * 1024 * 1024))
        throw new Error("Each attachment must be 200 MB or smaller.");
      if (
        estimate?.quota &&
        estimate.quota - (estimate.usage || 0) < total * 1.1
      )
        throw new Error(
          "There is not enough browser storage for these files. Download a backup before freeing space.",
        );
      const metadata = selected.map((file) => ({
        id: newId(),
        name: file.name,
        type: file.type,
        size: file.size,
        section,
      }));
      change(
        (previous) => ({
          ...previous,
          stakeholders: previous.stakeholders.map((item) =>
            item.id === id
              ? { ...item, attachments: [...item.attachments, ...metadata] }
              : item,
          ),
        }),
        new Map(metadata.map((entry, index) => [entry.id, selected[index]])),
      );
      await flush();
      setNotice(
        `${selected.length} attachment${selected.length === 1 ? "" : "s"} saved.`,
      );
    });
  }
  function chooseStage(id: string) {
    setSelectedStage(id);
    setEditingId(null);
    setDeletePrompt(false);
    setQuery("");
    setFilter("all");
    setPanel(null);
  }
  function openPanel(value: "journey" | "export" | "backup" | "library") {
    setPanel(panel === value ? null : value);
    setEditingId(null);
    setError("");
    if (value === "journey" && workspace) {
      setStages(workspace.stages.map((stage) => ({ ...stage })));
      setTeamName(workspace.team);
      setProjectName(workspace.project);
    }
  }
  const readyCount =
    workspace?.stakeholders.filter((item) => item.status === "complete")
      .length || 0;
  const items = workspace
    ? chronological(
        workspace.stakeholders.filter(
          (item) =>
            item.stageId === activeStage?.id &&
            (filter === "all" || item.status === filter) &&
            [
              item.name,
              item.role,
              item.rationale,
              item.interview,
              item.integrate,
            ]
              .join(" ")
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
        ),
      )
    : [];

  return (
    <section
      className="sb-workspace"
      data-stakebridge=""
      ref={root}
      tabIndex={-1}
      aria-label="StakeBridge workspace"
      onKeyDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <header className="sb-header">
        <a href="#handbook" className="sb-help-link">
          Handbook ↗
        </a>
        <span className="sb-local-badge">
          <span className="sb-status-dot" /> Your workspace
        </span>
      </header>
      <input
        ref={importInput}
        className="sb-sr-only"
        tabIndex={-1}
        type="file"
        accept=".json,application/json"
        aria-label="Restore StakeBridge backup"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file)
            void action("import", async () => {
              setRestore(await readBackup(file));
            });
        }}
      />
      {error && (
        <div className="sb-alert sb-error" role="alert">
          {error}
          <button
            type="button"
            className="sb-text-button"
            onClick={() => setError("")}
          >
            Dismiss
          </button>
        </div>
      )}
      {notice && (
        <div className="sb-alert sb-notice" role="status">
          {notice}
        </div>
      )}
      {saveState === "error" && (
        <div className="sb-alert sb-error" role="alert">
          Changes have not been saved. Browser storage may be full or
          unavailable.{" "}
          <button
            type="button"
            className="sb-text-button"
            onClick={() => void action("retry", () => flush())}
          >
            Retry saving
          </button>
          <button
            type="button"
            className="sb-text-button"
            onClick={() => openPanel("backup")}
          >
            Back up current work
          </button>
        </div>
      )}
      {restore && (
        <Panel title="Restore this workspace?" onClose={() => setRestore(null)}>
          <p>
            <b>{restore.workspace.project}</b> · {restore.workspace.team}
            <br />
            {restore.workspace.stages.length} stages ·{" "}
            {restore.workspace.stakeholders.length} stakeholder records ·{" "}
            {restore.files.size} original files
          </p>
          {workspace && (
            <p>
              This replaces your current workspace. Download a backup of your
              current work first if you want to keep it.
            </p>
          )}
          <div className="sb-actions">
            {workspace && (
              <button
                type="button"
                className="sb-button sb-button-outline"
                disabled={!!busy}
                onClick={() =>
                  void action("backup", async () =>
                    download(
                      await createBackup(workspace, getFile),
                      `${safeFilename(workspace.project)}.stakebridge.json`,
                    ),
                  )
                }
              >
                Back up current workspace
              </button>
            )}
            <button
              type="button"
              className="sb-button sb-button-primary"
              disabled={!!busy}
              onClick={() =>
                void action("restore", async () => {
                  const next = restore;
                  const remove =
                    workspace?.stakeholders
                      .flatMap((item) =>
                        item.attachments.map((file) => file.id),
                      )
                      .filter((id) => !next.files.has(id)) || [];
                  change(next.workspace, next.files, remove);
                  await flush();
                  setRestore(null);
                  setPanel(null);
                  setEditingId(null);
                  setSelectedStage(next.workspace.stages[0].id);
                  setNotice("Workspace and original attachments restored.");
                })
              }
            >
              Restore workspace
            </button>
            <button
              type="button"
              className="sb-button sb-button-outline"
              onClick={() => setRestore(null)}
            >
              Cancel
            </button>
          </div>
        </Panel>
      )}
      {loading ? (
        <p className="sb-loading" role="status">
          Opening your workspace…
        </p>
      ) : loadError ? (
        <div className="sb-loading">
          <h2>Your workspace couldn’t be opened</h2>
          <p>{loadError}</p>
          <button
            type="button"
            className="sb-button sb-button-primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : !workspace ? (
        <Setup
          initialStages={starter?.stages}
          onCreate={(value) => {
            change({
              ...value,
              stakeholders:
                starter?.records.filter((record) =>
                  value.stages.some((stage) => stage.id === record.stageId),
                ) || [],
            });
            focusWorkspace();
          }}
          onRestore={() => importInput.current?.click()}
        />
      ) : (
        <>
          <div className="sb-project-bar">
            <div>
              <span className="sb-eyebrow">
                {workspace.team} / stakeholder journey
              </span>
              <h2>{workspace.project}</h2>
            </div>
            <div className="sb-toolbar">
              <span className="sb-save-state" role="status">
                {saveState === "saved"
                  ? "✓ Saved"
                  : saveState === "saving"
                    ? "Saving…"
                    : "Not saved"}
              </span>
              <button
                type="button"
                className="sb-button sb-button-outline"
                aria-expanded={panel === "backup"}
                onClick={() => openPanel("backup")}
              >
                Backup & restore
              </button>
              <button
                type="button"
                className="sb-button sb-button-primary"
                aria-expanded={panel === "export"}
                onClick={() => openPanel("export")}
              >
                <Icon name="download" /> Export Word
              </button>
            </div>
          </div>
          <div className="sb-journey-strip" aria-label="Your product journey">
            {workspace.stages.map((stage, index) => (
              <button
                type="button"
                key={stage.id}
                className={stage.id === activeStage?.id ? "is-active" : ""}
                aria-current={stage.id === activeStage?.id ? "step" : undefined}
                onClick={() => chooseStage(stage.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {stage.name}
                {index < workspace.stages.length - 1 && <Icon name="arrow" />}
              </button>
            ))}
          </div>
          {panel === "backup" && (
            <Panel title="Backup & restore" onClose={() => setPanel(null)}>
              <p>Includes all notes, stages and original attachments.</p>
              <div className="sb-actions">
                <button
                  type="button"
                  className="sb-button sb-button-primary"
                  disabled={!!busy}
                  onClick={() =>
                    void action("backup", async () => {
                      download(
                        await createBackup(workspace, getFile),
                        `${safeFilename(workspace.project)}.stakebridge.json`,
                      );
                      setNotice(
                        "Backup downloaded with all original attachments.",
                      );
                    })
                  }
                >
                  <Icon name="download" />
                  {busy === "backup"
                    ? "Preparing backup…"
                    : "Download full backup"}
                </button>
                <button
                  type="button"
                  className="sb-button sb-button-outline"
                  disabled={!!busy}
                  onClick={() => importInput.current?.click()}
                >
                  Restore a backup
                </button>
              </div>
              <p className="sb-small">
                Back up before clearing browser data or changing devices.
              </p>
            </Panel>
          )}
          {panel === "export" && (
            <Panel
              title="Export interview report"
              onClose={() => setPanel(null)}
            >
              <p>
                Stages → stakeholders by date → Rationale, Interview, Integrate.
              </p>
              <label className="sb-checkbox">
                <input
                  type="checkbox"
                  checked={includeDrafts}
                  onChange={(event) => setIncludeDrafts(event.target.checked)}
                />{" "}
                Include drafts, clearly marked in the report
              </label>
              <p className="sb-small">
                Original files are kept in the full backup.
              </p>
              <button
                type="button"
                className="sb-button sb-button-primary"
                disabled={
                  !!busy ||
                  !(includeDrafts ? workspace.stakeholders.length : readyCount)
                }
                onClick={() => {
                  try {
                    download(
                      exportWord(workspace, includeDrafts),
                      `${safeFilename(workspace.project)}-stakeholder-report.docx`,
                    );
                    setNotice("Word report downloaded.");
                  } catch {
                    setError(
                      "The Word report could not be created. Please try again.",
                    );
                  }
                }}
              >
                <Icon name="download" />
                Download .docx
              </button>
            </Panel>
          )}
          {panel === "journey" && (
            <Panel title="Project settings" onClose={() => setPanel(null)}>
              <div className="sb-fields sb-details-grid">
                <label htmlFor={`${prefix}-edit-team`}>
                  Team name
                  <input
                    id={`${prefix}-edit-team`}
                    value={teamName}
                    maxLength={120}
                    onChange={(event) => setTeamName(event.target.value)}
                  />
                </label>
                <label htmlFor={`${prefix}-edit-project`}>
                  Project name
                  <input
                    id={`${prefix}-edit-project`}
                    value={projectName}
                    maxLength={160}
                    onChange={(event) => setProjectName(event.target.value)}
                  />
                </label>
              </div>
              <p>Rename or reorder your stages.</p>
              <StageFields
                stages={stages}
                onChange={setStages}
                occupied={
                  new Set(workspace.stakeholders.map((item) => item.stageId))
                }
              />
              <div className="sb-actions">
                <button
                  type="button"
                  className="sb-button sb-button-primary"
                  onClick={() => {
                    const problem = stageProblem(stages);
                    if (problem) {
                      setError(problem);
                      return;
                    }
                    if (!teamName.trim() || !projectName.trim()) {
                      setError("Enter a team and project name.");
                      return;
                    }
                    change((previous) => ({
                      ...previous,
                      team: teamName.trim(),
                      project: projectName.trim(),
                      stages: stages.map((stage) => ({
                        ...stage,
                        name: stage.name.trim(),
                      })),
                    }));
                    setPanel(null);
                    setNotice("Project settings saved.");
                  }}
                >
                  Save settings
                </button>
                <button
                  type="button"
                  className="sb-button sb-button-outline"
                  onClick={() => setPanel(null)}
                >
                  Cancel
                </button>
              </div>
            </Panel>
          )}
          <div className="sb-body">
            <aside className="sb-sidebar" aria-label="Stakeholder stages">
              <span className="sb-eyebrow">Your journey</span>
              <nav>
                {workspace.stages.map((stage, index) => (
                  <button
                    type="button"
                    key={stage.id}
                    className={stage.id === activeStage?.id ? "is-active" : ""}
                    aria-current={
                      stage.id === activeStage?.id ? "page" : undefined
                    }
                    onClick={() => chooseStage(stage.id)}
                  >
                    <span className="sb-nav-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{stage.name}</span>
                    <span className="sb-count">
                      {
                        workspace.stakeholders.filter(
                          (item) => item.stageId === stage.id,
                        ).length
                      }
                    </span>
                  </button>
                ))}
              </nav>
              <button
                type="button"
                className="sb-text-button sb-edit-journey"
                onClick={() => openPanel("journey")}
              >
                Project settings ↗
              </button>
              <div className="sb-sidebar-summary">
                <b>
                  {workspace.stakeholders.length}
                  <span> stakeholder records</span>
                </b>
                <span>
                  {readyCount} complete ·{" "}
                  {workspace.stakeholders.length - readyCount} drafts
                </span>
                <div className="sb-progress">
                  <span
                    style={{
                      width: `${workspace.stakeholders.length ? (readyCount / workspace.stakeholders.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </aside>
            <div
              className="sb-main"
              role="region"
              aria-label="Stakeholder records"
            >
              {editing ? (
                <>
                  <div className="sb-editor-top">
                    <button
                      type="button"
                      className="sb-text-button"
                      onClick={() => {
                        setEditingId(null);
                        setDeletePrompt(false);
                      }}
                    >
                      ← All stakeholders
                    </button>
                    <span
                      className={`sb-pill ${editing.status === "complete" ? "is-complete" : ""}`}
                    >
                      {editing.status === "complete" ? "Complete" : "Draft"}
                    </span>
                  </div>
                  <h2 className="sb-editor-heading">
                    {editing.name.trim() || "New stakeholder record"}
                  </h2>
                  {editing.source && (
                    <div className="sb-source-note">
                      Library reference:{" "}
                      <a
                        href={editing.source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {editing.source.entryId}
                      </a>{" "}
                      · version {editing.source.revision}
                    </div>
                  )}
                  <div className="sb-fields sb-details-grid">
                    <label htmlFor={`${prefix}-name`}>
                      Stakeholder name
                      <input
                        id={`${prefix}-name`}
                        maxLength={160}
                        value={editing.name}
                        placeholder="Name or anonymised identifier"
                        onChange={(event) =>
                          updateItem({ name: event.target.value })
                        }
                      />
                    </label>
                    <label htmlFor={`${prefix}-role`}>
                      Role / organisation
                      <input
                        id={`${prefix}-role`}
                        maxLength={200}
                        value={editing.role}
                        placeholder="e.g. user representative · community group"
                        onChange={(event) =>
                          updateItem({ role: event.target.value })
                        }
                      />
                    </label>
                    <label htmlFor={`${prefix}-date`}>
                      Interview date
                      <InterviewDate
                        key={editing.id}
                        id={`${prefix}-date`}
                        value={editing.date}
                        onChange={(date) => updateItem({ date })}
                      />
                    </label>
                    <label htmlFor={`${prefix}-stage`}>
                      Journey stage
                      <select
                        id={`${prefix}-stage`}
                        value={editing.stageId}
                        onChange={(event) => {
                          updateItem({ stageId: event.target.value });
                          setSelectedStage(event.target.value);
                        }}
                      >
                        {workspace.stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div
                    className="sb-section-progress"
                    aria-label={`${completion(editing)} of 3 reflection sections started`}
                  >
                    {SECTIONS.map((section, index) => (
                      <span
                        key={section.key}
                        className={
                          editing[section.key].trim() ? "is-filled" : ""
                        }
                      >
                        <i>
                          {editing[section.key].trim() ? (
                            <Icon name="check" />
                          ) : (
                            `0${index + 1}`
                          )}
                        </i>
                        {section.title}
                      </span>
                    ))}
                  </div>
                  {SECTIONS.map((section, index) => (
                    <fieldset className="sb-reflection" key={section.key}>
                      <legend>
                        <span>0{index + 1}</span>
                        {section.title}
                      </legend>
                      <label htmlFor={`${prefix}-${section.key}`}>
                        {section.question}
                      </label>
                      <textarea
                        id={`${prefix}-${section.key}`}
                        rows={5}
                        value={editing[section.key]}
                        placeholder={section.prompt}
                        onChange={(event) =>
                          updateItem({ [section.key]: event.target.value })
                        }
                      />
                      <div className="sb-attachment-row">
                        <label
                          className={`sb-upload${busy ? " is-disabled" : ""}`}
                        >
                          <Icon name="plus" />
                          Add files
                          <input
                            className="sb-sr-only"
                            type="file"
                            multiple
                            disabled={!!busy}
                            accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.txt,.md,.rtf,.odt,.csv"
                            aria-label={`Add attachments to ${section.title}`}
                            onChange={(event) => {
                              void attach(event.target.files, section.key);
                              event.target.value = "";
                            }}
                          />
                        </label>
                        <span className="sb-small">Up to 200 MB per file</span>
                      </div>
                      {editing.attachments
                        .filter((file) => file.section === section.key)
                        .map((file) => (
                          <div className="sb-file" key={file.id}>
                            <Icon name="file" />
                            <div>
                              <b>{file.name}</b>
                              <small>
                                {file.type || "Document"} ·{" "}
                                {fileSize(file.size)}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="sb-icon-button"
                              disabled={!!busy}
                              aria-label={`Download ${file.name}`}
                              onClick={() =>
                                void action("download", async () =>
                                  download(await getFile(file.id), file.name),
                                )
                              }
                            >
                              <Icon name="download" />
                            </button>
                            <button
                              type="button"
                              className="sb-icon-button"
                              disabled={!!busy}
                              aria-label={`Remove ${file.name}`}
                              onClick={() =>
                                updateItem(
                                  {
                                    attachments: editing.attachments.filter(
                                      (item) => item.id !== file.id,
                                    ),
                                  },
                                  new Map(),
                                  [file.id],
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </fieldset>
                  ))}
                  <div className="sb-editor-footer">
                    <div>
                      <b>{completion(editing)} / 3 reflections started</b>
                      <p className="sb-small">
                        Complete the name, date and all three reflections to
                        mark this record complete.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="sb-button sb-button-primary"
                      disabled={!!busy || !canComplete(editing)}
                      onClick={() => {
                        updateItem({
                          status:
                            editing.status === "complete"
                              ? "draft"
                              : "complete",
                        });
                        setNotice(
                          editing.status === "complete"
                            ? "Record returned to draft."
                            : "Stakeholder record marked complete.",
                        );
                      }}
                    >
                      {editing.status === "complete"
                        ? "Return to draft"
                        : "Mark complete"}
                      <Icon name="check" />
                    </button>
                  </div>
                  {deletePrompt ? (
                    <div className="sb-delete-confirm">
                      <p>
                        Delete this stakeholder record and its original
                        attachments from this browser?
                      </p>
                      <div className="sb-actions">
                        <button
                          type="button"
                          className="sb-button sb-button-danger"
                          disabled={!!busy}
                          onClick={() => {
                            const id = editing.id;
                            change(
                              (previous) => ({
                                ...previous,
                                stakeholders: previous.stakeholders.filter(
                                  (item) => item.id !== id,
                                ),
                              }),
                              new Map(),
                              editing.attachments.map((file) => file.id),
                            );
                            setEditingId(null);
                            setDeletePrompt(false);
                            setNotice("Stakeholder record deleted.");
                          }}
                        >
                          Delete record
                        </button>
                        <button
                          type="button"
                          className="sb-button sb-button-outline"
                          onClick={() => setDeletePrompt(false)}
                        >
                          Keep record
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="sb-text-button sb-delete-button"
                      disabled={!!busy}
                      onClick={() => setDeletePrompt(true)}
                    >
                      Delete stakeholder record
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="sb-main-title">
                    <div>
                      <span className="sb-eyebrow">
                        Stage{" "}
                        {String(
                          workspace.stages.findIndex(
                            (stage) => stage.id === activeStage?.id,
                          ) + 1,
                        ).padStart(2, "0")}
                      </span>
                      <h2>{activeStage?.name}</h2>
                    </div>
                    <div className="sb-add-actions">
                      <button
                        type="button"
                        className="sb-button sb-button-outline"
                        aria-expanded={panel === "library"}
                        onClick={() => openPanel("library")}
                      >
                        <Icon name="search" /> Add from library
                      </button>
                      <button
                        type="button"
                        className="sb-button sb-button-primary"
                        onClick={() => {
                          if (!activeStage) return;
                          const item = newStakeholder(activeStage.id);
                          change((previous) => ({
                            ...previous,
                            stakeholders: [...previous.stakeholders, item],
                          }));
                          openEditor(item.id);
                        }}
                      >
                        <Icon name="plus" />
                        Add stakeholder
                      </button>
                    </div>
                  </div>
                  {panel === "library" && activeStage && (
                    <Panel
                      title={`Add to ${activeStage.name}`}
                      onClose={() => setPanel(null)}
                    >
                      <LibraryPicker
                        key={activeStage.id}
                        registry={registry}
                        error={registryError}
                        workspace={workspace}
                        stageId={activeStage.id}
                        onChoose={(entry) => {
                          const id = onAddFromLibrary(entry, activeStage.id);
                          setSelectedStage(activeStage.id);
                          openEditor(id);
                        }}
                      />
                    </Panel>
                  )}
                  <div className="sb-search-row">
                    <label className="sb-search">
                      <Icon name="search" />
                      <span className="sb-sr-only">
                        Search stakeholders in this stage
                      </span>
                      <input
                        type="search"
                        placeholder="Search people, roles or notes"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </label>
                    <label>
                      <span className="sb-sr-only">
                        Filter by record status
                      </span>
                      <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                      >
                        <option value="all">All records</option>
                        <option value="draft">Drafts</option>
                        <option value="complete">Complete</option>
                      </select>
                    </label>
                  </div>
                  {items.length ? (
                    <div className="sb-record-grid">
                      {items.map((item) => (
                        <button
                          type="button"
                          className="sb-record-card"
                          key={item.id}
                          onClick={() => openEditor(item.id)}
                        >
                          <div className="sb-card-top">
                            <span className="sb-avatar">
                              {item.name
                                .trim()
                                .slice(0, 1)
                                .toLocaleUpperCase() || "?"}
                            </span>
                            <span
                              className={`sb-pill ${item.status === "complete" ? "is-complete" : ""}`}
                            >
                              {item.status === "complete"
                                ? "Complete"
                                : "Draft"}
                            </span>
                          </div>
                          <b>{item.name.trim() || "Unnamed stakeholder"}</b>
                          <span className="sb-card-role">
                            {item.role || "Add a role or organisation"}
                          </span>
                          <span className="sb-card-date">
                            {displayDate(item.date)}
                          </span>
                          <div className="sb-card-sections">
                            {SECTIONS.map((section) => (
                              <span
                                key={section.key}
                                className={
                                  item[section.key].trim() ? "is-filled" : ""
                                }
                                title={section.title}
                              >
                                {item[section.key].trim() ? "✓" : "○"}{" "}
                                {section.title === "Stakeholder interview"
                                  ? "Interview"
                                  : section.title}
                              </span>
                            ))}
                          </div>
                          <div className="sb-card-bottom">
                            <span>
                              {item.attachments.length} attachment
                              {item.attachments.length === 1 ? "" : "s"}
                            </span>
                            <span>Open record ↗</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="sb-empty">
                      <span className="sb-empty-icon">
                        <Icon name="bridge" />
                      </span>
                      <h2>
                        {query || filter !== "all"
                          ? "No matching records"
                          : "No stakeholder records in this stage"}
                      </h2>
                      <p>
                        {query || filter !== "all"
                          ? "Try a different search or status filter."
                          : "Add your first stakeholder to get started."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <footer className="sb-footer">
            <span>
              <span className="sb-status-dot" /> Saved on this device
            </span>
            <a href="#handbook/export">Backup guide ↗</a>
          </footer>
        </>
      )}
    </section>
  );
}
