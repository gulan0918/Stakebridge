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
    const item = referenceDraft(entry, stageId);
    store.change((previous) => ({
      ...previous,
      stakeholders: [...previous.stakeholders, item],
    }));
    setRecordId(item.id);
    setMessage(
      `${entry.id} added as a planning draft. Record your own interview and project changes.`,
    );
    location.hash = "workspace";
  }
  function usePathway(entry: RegistryEntry) {
    if (!registry || store.loading || store.loadError) {
      setMessage("Wait for browser storage to open, then try again.");
      return;
    }
    const stages = store.workspace
      ? store.workspace.stages.map((item) => ({ ...item }))
      : [];
    for (const name of entry.stages) {
      if (
        !stages.some(
          (stage) =>
            stage.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        )
      )
        stages.push({ id: newId(), name });
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
                name.toLocaleLowerCase() === stage.name.toLocaleLowerCase(),
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
          <span>
            StakeBridge<span>Stakeholder engagement</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="#registry"
            aria-current={view === "registry" ? "page" : undefined}
          >
            Shared registry
          </a>
          <a
            href="#workspace"
            aria-current={view === "workspace" ? "page" : undefined}
          >
            My workspace
          </a>
          <a
            href="#contribute"
            aria-current={view === "contribute" ? "page" : undefined}
          >
            Contribute <span>↗</span>
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
      <main id="main-content" tabIndex={-1}>
        {view === "workspace" ? (
          <div className="workspace-page">
            <div className="workspace-page-title">
              <div>
                <span className="entry-kicker">PERSONAL WORKSPACE</span>
                <h1>Project workspace</h1>
              </div>
              <a href="#registry">Browse the stakeholder registry ↗</a>
            </div>
            <StakeholderWorkspace
              store={store}
              openRecordId={recordId}
              starter={starter}
            />
          </div>
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
        <div>
          <b>StakeBridge</b>
          <span>A contribution to the iGEM community by ZJU-China</span>
        </div>
        <div>
          <a
            href={`${REPOSITORY}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            Contribution guide
          </a>
          <a
            href={`${REPOSITORY}/blob/main/docs/PRIVACY.md`}
            target="_blank"
            rel="noreferrer"
          >
            Data & permission
          </a>
          <a href="https://registry.igem.org/" target="_blank" rel="noreferrer">
            Design reference: iGEM Registry ↗
          </a>
        </div>
        <p>
          Independent community project. Personal drafts stay in your browser;
          reviewed registry entries are public.
        </p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
