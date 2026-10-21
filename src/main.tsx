import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StakeholderWorkspace } from "./components/StakeholderWorkspace";
import { useWorkspace } from "./components/stakebridge/useWorkspace";
import {
  newId,
  newStakeholder,
  type Stage,
  type Stakeholder,
} from "./components/stakebridge/model";
import { RegistryView } from "./registry/Directory";
import { Contribute } from "./registry/Contribute";
import { Handbook } from "./Handbook";
import { standardStageName } from "./journey";
import {
  REPOSITORY,
  validateRegistry,
  type Registry,
  type RegistryEntry,
} from "./registry/schema";
import "./ui.css";

function currentRoute() {
  return location.hash.replace(/^#\/?/, "") || "registry";
}
function App() {
  const store = useWorkspace();
  const [route, setRoute] = useState(currentRoute);
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [registryError, setRegistryError] = useState("");
  const [message, setMessage] = useState("");
  const [recordId, setRecordId] = useState<string>();
  const [starter, setStarter] = useState<{
    stages: Stage[];
    records: Stakeholder[];
  }>();
  useEffect(() => {
    const update = () => {
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}registry/entries.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Registry request failed (${response.status}).`);
        return response.json();
      })
      .then((data: unknown) => {
        validateRegistry(data);
        setRegistry(data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setRegistryError(
            error instanceof Error
              ? error.message
              : "The registry could not be loaded.",
          );
      });
    return () => controller.abort();
  }, []);
  const view = route.split("/")[0];
  function referenceDraft(entry: RegistryEntry, stageId: string): Stakeholder {
    return {
      ...newStakeholder(stageId),
      name: entry.title,
      role: [entry.role, entry.organisation].filter(Boolean).join(" · "),
      rationale: `Planning reference from ${entry.id}: ${entry.rationale}`,
      source: {
        entryId: entry.id,
        revision: entry.revision,
        url: `${REPOSITORY}/blob/main/public/registry/entries.json`,
      },
    };
  }
  function addEntry(entry: RegistryEntry, stageId: string) {
    const existing = store.workspace?.stakeholders.find(
      (item) => item.source?.entryId === entry.id && item.stageId === stageId,
    );
    if (existing) {
      setRecordId(existing.id);
      location.hash = "workspace";
      return existing.id;
    }
    const item = referenceDraft(entry, stageId);
    store.change((previous) => ({
      ...previous,
      stakeholders: [...previous.stakeholders, item],
    }));
    setRecordId(item.id);
    setMessage(`${entry.title} added to your drafts.`);
    location.hash = "workspace";
    return item.id;
  }
  function usePathway(entry: RegistryEntry) {
    if (!registry || store.loading || store.loadError) {
      setMessage("Your workspace is opening. Please try again in a moment.");
      return;
    }
    const stages = store.workspace
      ? store.workspace.stages.map((item) => ({ ...item }))
      : [];
    for (const name of entry.stages) {
      if (
        !stages.some(
          (stage) =>
            standardStageName(stage.name).toLocaleLowerCase() ===
            standardStageName(name).toLocaleLowerCase(),
        )
      )
        stages.push({ id: newId(), name: standardStageName(name) });
    }
    if (stages.length > 8) {
      setMessage(
        "This collection would exceed eight journey stages. Rename or combine stages in your workspace first; your current work has been preserved.",
      );
      return;
    }
    const records = entry.members
      .map((id) => registry.entries.find((item) => item.id === id)!)
      .map((member) =>
        referenceDraft(
          member,
          stages.find((stage) =>
            member.stages.some(
              (name) =>
                standardStageName(name).toLocaleLowerCase() ===
                standardStageName(stage.name).toLocaleLowerCase(),
            ),
          )?.id || stages[0].id,
        ),
      );
    if (store.workspace) {
      const existing = new Set(
        store.workspace.stakeholders.map((item) => item.source?.entryId),
      );
      const additions = records.filter(
        (item) => !existing.has(item.source?.entryId),
      );
      store.change((previous) => ({
        ...previous,
        stages,
        stakeholders: [...previous.stakeholders, ...additions],
      }));
      setMessage(
        `Pathway added: ${additions.length} new planning drafts. Existing records have been preserved.`,
      );
    } else {
      setStarter({ stages, records });
      setMessage(
        "Your pathway is ready. Give your team and project a name to create the workspace.",
      );
    }
    setRecordId(undefined);
    location.hash = "workspace";
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <a className="app-brand" href="#registry">
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            width="35"
            height="35"
            alt=""
          />
          <span>StakeBridge</span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#registry"
            aria-current={view === "registry" ? "page" : undefined}
          >
            Library
          </a>
          <a
            href="#workspace"
            aria-current={view === "workspace" ? "page" : undefined}
          >
            Workspace
          </a>
          <a
            href="#handbook"
            aria-current={view === "handbook" ? "page" : undefined}
          >
            Handbook
          </a>
          <a
            href="#contribute"
            aria-current={view === "contribute" ? "page" : undefined}
          >
            Contribute
          </a>
        </nav>
        <a
          className="repository-link"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>
      </header>
      {message && (
        <div className="app-message" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        onInvalidCapture={(event) => {
          const field = event.target;
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          ) {
            field.setCustomValidity(
              field.validity.valueMissing
                ? "Please complete this field."
                : field instanceof HTMLInputElement && field.type === "url"
                  ? "Enter a valid HTTPS link."
                  : "Please check this value.",
            );
          }
        }}
        onInputCapture={(event) => {
          const field = event.target;
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLTextAreaElement ||
            field instanceof HTMLSelectElement
          )
            field.setCustomValidity("");
        }}
      >
        {view === "workspace" ? (
          <div className="workspace-page">
            <div className="workspace-page-title">
              <div>
                <h1>Workspace</h1>
              </div>
              <a href="#registry">Browse library →</a>
            </div>
            <StakeholderWorkspace
              store={store}
              openRecordId={recordId}
              starter={starter}
              registry={registry}
              registryError={registryError}
              onAddFromLibrary={addEntry}
            />
          </div>
        ) : view === "handbook" ? (
          <Handbook key={route} slug={route.split("/")[1]} />
        ) : view === "contribute" ? (
          <Contribute />
        ) : view === "registry" ? (
          registry ? (
            <RegistryView
              key={route}
              registry={registry}
              entryId={route.split("/")[1]}
              workspace={store.workspace}
              onAdd={addEntry}
              onPathway={usePathway}
            />
          ) : (
            <div
              className="app-loading"
              role={registryError ? "alert" : "status"}
            >
              {registryError ? (
                <>
                  <h1>The registry could not be opened</h1>
                  <p>{registryError}</p>
                  <button
                    className="app-button"
                    onClick={() => location.reload()}
                  >
                    Retry
                  </button>
                </>
              ) : (
                "Opening the shared registry…"
              )}
            </div>
          )
        ) : (
          <div className="app-loading">
            <h1>Page not found</h1>
            <a href="#registry">Browse the registry</a>
          </div>
        )}
      </main>
      <footer className="app-footer">
        <span>StakeBridge · ZJU-China 2026</span>
        <div>
          <a href="#handbook">Handbook</a>
          <a href="#handbook/data">Data & credits</a>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
