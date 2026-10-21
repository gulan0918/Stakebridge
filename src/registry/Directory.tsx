import { useState } from "react";
import {
  openToContact,
  REPOSITORY,
  type Registry,
  type RegistryEntry,
} from "./schema";
import type { Workspace } from "../components/stakebridge/model";
import { JOURNEY_STAGES, standardStageName } from "../journey";

const stageOrder = JOURNEY_STAGES;

function PublicContacts({ entry }: { entry: RegistryEntry }) {
  const contacts = entry.publicContacts || [];
  return (
    <div className="directory-contact">
      <h3>Contact</h3>
      {contacts.length ? (
        contacts.map((channel) => (
          <div
            className="public-channel"
            key={`${channel.kind}-${channel.value}`}
          >
            <span>{channel.label}</span>
            <a
              href={channel.url}
              target={channel.kind === "website" ? "_blank" : undefined}
              rel="noreferrer"
            >
              {channel.value}
              {channel.kind === "website" ? " ↗" : ""}
            </a>
          </div>
        ))
      ) : (
        <p>
          {entry.contactReview?.status === "not_sought"
            ? "Patient contacts are not published."
            : entry.contactReview?.status === "identity_uncertain"
              ? "Identity needs verification."
              : "No verified public contact."}
        </p>
      )}
      {entry.contactReview?.note &&
        contacts.length > 0 &&
        !entry.contactReview.note.startsWith("No matching") && (
          <p className="contact-note">{entry.contactReview.note}</p>
        )}
      <div className="contact-status">
        <span>New interviews</span>
        <b>
          {openToContact(entry)
            ? "Open to enquiries"
            : entry.contact.availability === "closed"
              ? "Unavailable"
              : "Unconfirmed"}
        </b>
      </div>
      {openToContact(entry) && (
        <a
          className="app-button"
          href={entry.contact.channel}
          target="_blank"
          rel="noreferrer"
        >
          Interview contact ↗
        </a>
      )}
      {contacts.length > 0 && (
        <details className="contact-sources">
          <summary>Sources & verification</summary>
          {contacts.map((channel) => (
            <p key={channel.url}>
              <a href={channel.source} target="_blank" rel="noreferrer">
                {channel.label} ↗
              </a>
              <span>Checked {channel.checkedOn}</span>
            </p>
          ))}
          <a href="#handbook/interview">Contact and participation →</a>
        </details>
      )}
    </div>
  );
}

export function RegistryView({
  registry,
  entryId,
  workspace,
  onAdd,
  onPathway,
}: {
  registry: Registry;
  entryId?: string;
  workspace: Workspace | null;
  onAdd: (entry: RegistryEntry, stageId: string) => void;
  onPathway: (entry: RegistryEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [contactFilter, setContactFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [order, setOrder] = useState("source");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("documentation");
  const [targetStage, setTargetStage] = useState("");
  const entry = registry.entries.find((item) => item.id === entryId);
  const stages = [
    ...new Set([
      ...stageOrder,
      ...registry.entries.flatMap((item) => item.stages),
    ]),
  ].filter((name) =>
    registry.entries.some((item) => item.stages.includes(name)),
  );
  const roles = [
    ...new Set(registry.entries.flatMap((item) => item.roleTags || [])),
  ].sort();
  const fields = [
    ...new Set(registry.entries.map((item) => item.domain)),
  ].sort();
  function changeFilter(action: () => void) {
    action();
    setPage(1);
  }
  const results = registry.entries.filter(
    (item) =>
      (!stage || item.stages.includes(stage)) &&
      (!roleFilter || item.roleTags?.includes(roleFilter)) &&
      (!fieldFilter || item.domain === fieldFilter) &&
      (!contactFilter ||
        (contactFilter === "public"
          ? !!item.publicContacts?.length
          : openToContact(item))) &&
      [
        item.id,
        item.title,
        item.topic,
        item.role,
        item.domain,
        ...(item.roleTags || []),
        item.organisation,
        item.summary,
        item.rationale,
        item.interview,
        item.integration,
        ...item.tags,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  if (order === "name") results.sort((a, b) => a.title.localeCompare(b.title));
  if (order === "stage")
    results.sort(
      (a, b) =>
        stages.indexOf(a.stages[0]) - stages.indexOf(b.stages[0]) ||
        a.title.localeCompare(b.title),
    );
  const pages = Math.max(1, Math.ceil(results.length / 12));
  const currentPage = Math.min(page, pages);
  const visible = results.slice((currentPage - 1) * 12, currentPage * 12);

  if (entryId && !entry)
    return (
      <div className="directory">
        <h1>Record not found</h1>
        <p>No published record has this ID.</p>
        <a href="#registry">Return to registry</a>
      </div>
    );
  if (entry) {
    const defaultStage =
      workspace?.stages.find((item) =>
        entry.stages.some(
          (name) =>
            standardStageName(name).toLocaleLowerCase() ===
            standardStageName(item.name).toLocaleLowerCase(),
        ),
      )?.id ||
      workspace?.stages[0].id ||
      "";
    const materials = entry.materials || [];
    return (
      <div className="directory record-page">
        <nav className="directory-breadcrumb" aria-label="Breadcrumb">
          <a href="#registry">Library</a>
          <span>/</span>
          <span>{entry.title}</span>
        </nav>
        <header className="record-header">
          <div>
            <div className="record-code">
              {entry.id} <span>Version {entry.revision}</span>
            </div>
            <h1>{entry.title}</h1>
            <p>{entry.topic || entry.summary}</p>
          </div>
          <a
            className="record-source"
            href={entry.source}
            target="_blank"
            rel="noreferrer"
          >
            Original IHP ↗
          </a>
        </header>
        <dl className="record-metadata">
          <div>
            <dt>Role</dt>
            <dd>{entry.role}</dd>
          </div>
          <div>
            <dt>Organisation</dt>
            <dd>{entry.organisation || "Not separately listed"}</dd>
          </div>
          <div>
            <dt>Project stage</dt>
            <dd>{entry.stages.join(" / ")}</dd>
          </div>
          <div>
            <dt>Interview date</dt>
            <dd>{entry.interviewDate || "See source"}</dd>
          </div>
          <div>
            <dt>Contributing team</dt>
            <dd>{entry.contributor}</dd>
          </div>
        </dl>
        <nav className="record-tabs" aria-label="Record sections">
          {[
            ["documentation", "Interview record"],
            ["materials", `Materials (${materials.length})`],
            ["experience", `Experience (${entry.experiences.length})`],
            ["history", "Source & history"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={tab === key ? "active" : ""}
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="record-layout">
          <article className="record-document">
            {tab === "documentation" && (
              <>
                <div className="record-summary">
                  <p>{entry.summary}</p>
                </div>
                <section id="record-rationale">
                  <h2>Rationale</h2>
                  <p>{entry.rationale}</p>
                </section>
                <section id="record-interview">
                  <h2>Stakeholder interview</h2>
                  {entry.interview ? (
                    <p>{entry.interview}</p>
                  ) : (
                    <ol>
                      {entry.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  )}
                </section>
                <section id="record-integration">
                  <h2>Integration</h2>
                  <p>{entry.integration}</p>
                </section>
                {entry.members.length > 0 && (
                  <section>
                    <h2>Related records</h2>
                    <ul>
                      {entry.members.map((id) => (
                        <li key={id}>
                          <a href={`#registry/${id}`}>
                            {registry.entries.find((item) => item.id === id)
                              ?.title || id}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
            {tab === "materials" && (
              <>
                <h2>Interview materials</h2>

                {materials.length ? (
                  materials.map((material) => (
                    <figure
                      className={`record-material ${material.kind}`}
                      key={material.url}
                    >
                      {material.kind === "photo" && (
                        <a href={material.url} target="_blank" rel="noreferrer">
                          <img
                            src={material.url}
                            alt={`${entry.title}: ${material.label}`}
                            loading="lazy"
                          />
                        </a>
                      )}
                      <figcaption>
                        <a href={material.url} target="_blank" rel="noreferrer">
                          {material.label} ↗
                        </a>
                        <span>
                          {material.kind === "photo"
                            ? "Published IHP photograph"
                            : material.kind === "document"
                              ? "Source document"
                              : "Related IHP page"}
                        </span>
                      </figcaption>
                    </figure>
                  ))
                ) : (
                  <div className="directory-empty">
                    No separate material is linked for this record. The full
                    conversation account is available under Documentation.
                  </div>
                )}
              </>
            )}
            {tab === "experience" && (
              <>
                <h2>Team experience</h2>
                {entry.experiences.map((experience, index) => (
                  <section className="record-experience" key={index}>
                    <h3>
                      {experience.team} <span>{experience.year}</span>
                    </h3>
                    <p>{experience.summary}</p>
                    <a
                      href={experience.source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source documentation ↗
                    </a>
                  </section>
                ))}
                <a
                  className="app-button"
                  href={`${REPOSITORY}/issues/new?template=experience.yml&title=${encodeURIComponent(`[Experience] ${entry.id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Add your team’s experience
                </a>
                <p className="directory-footnote">
                  Submissions are reviewed before they appear in the registry.
                </p>
              </>
            )}
            {tab === "history" && (
              <>
                <h2>Source and version</h2>
                <dl className="source-facts">
                  <dt>Record</dt>
                  <dd>{entry.id}</dd>
                  <dt>Version</dt>
                  <dd>{entry.revision}</dd>
                  {entry.sourceStage && (
                    <>
                      <dt>IHP category</dt>
                      <dd>{entry.sourceStage}</dd>
                    </>
                  )}
                  <dt>Updated</dt>
                  <dd>{entry.updated}</dd>
                  <dt>Interview content</dt>
                  <dd>
                    <a href={entry.source} target="_blank" rel="noreferrer">
                      Original IHP source at the imported revision ↗
                    </a>
                  </dd>
                  <dt>Field</dt>
                  <dd>{entry.domain}</dd>
                  <dt>Role tags</dt>
                  <dd>{entry.roleTags?.join(" · ") || entry.role}</dd>
                  <dt>Keywords</dt>
                  <dd>{entry.tags.join(" · ")}</dd>
                  <dt>Context</dt>
                  <dd>{entry.limitations}</dd>
                </dl>
                <div className="button-row">
                  <a
                    className="app-button secondary"
                    href={`${REPOSITORY}/commits/main/public/registry/entries.json`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Version history
                  </a>
                  <a
                    className="app-button secondary"
                    href={`${REPOSITORY}/issues/new?template=correction.yml&title=${encodeURIComponent(`[Correction] ${entry.id}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Request a correction
                  </a>
                </div>
              </>
            )}
          </article>
          <aside className="record-sidebar">
            <PublicContacts entry={entry} />
            <div className="directory-plan">
              <h3>Your project</h3>

              {entry.kind === "pathway" ? (
                <button className="app-button" onClick={() => onPathway(entry)}>
                  Use pathway
                </button>
              ) : workspace ? (
                <>
                  <label htmlFor="registry-target-stage">
                    Project stage
                    <select
                      id="registry-target-stage"
                      value={targetStage || defaultStage}
                      onChange={(event) => setTargetStage(event.target.value)}
                    >
                      {workspace.stages.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="app-button"
                    onClick={() => onAdd(entry, targetStage || defaultStage)}
                  >
                    Add to workspace
                  </button>
                </>
              ) : (
                <a href="#workspace" className="app-button">
                  Create workspace
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="directory">
      <header className="library-hero">
        <div>
          <span className="library-collection">
            Community library · {registry.entries.length} records
          </span>
          <h1>
            Stakeholder
            <br />
            <span>library.</span>
          </h1>
          <p>People, perspectives and project experience.</p>
          <div className="button-row">
            <a className="app-button" href="#workspace">
              Open workspace →
            </a>
            <a className="app-button text-button" href="#handbook">
              Read the handbook
            </a>
          </div>
        </div>
        <div className="library-journey" aria-label="Project journey">
          <span>From research to practice</span>
          <div>
            {stageOrder.map((name, index) => (
              <button
                key={name}
                type="button"
                aria-pressed={stage === name}
                onClick={() => changeFilter(() => setStage(name))}
              >
                <span className="journey-dot">{index + 1}</span>
                <b>{name}</b>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <section className="library-catalogue" aria-label="Stakeholder library">
        <div className="catalogue-heading">
          <h2>Explore the library</h2>
          <a href="#contribute">Contribute a record ↗</a>
        </div>
        <div className="directory-tools">
          <label className="directory-search">
            <span className="sr-only">Search stakeholder records</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              type="search"
              value={query}
              placeholder="Search people, organisations or topics"
              onChange={(event) =>
                changeFilter(() => setQuery(event.target.value))
              }
            />
          </label>
          <label>
            <span className="sr-only">Stakeholder role filter</span>
            <select
              value={roleFilter}
              onChange={(event) =>
                changeFilter(() => setRoleFilter(event.target.value))
              }
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Project field filter</span>
            <select
              value={fieldFilter}
              onChange={(event) =>
                changeFilter(() => setFieldFilter(event.target.value))
              }
            >
              <option value="">All fields</option>
              {fields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Contact filter</span>
            <select
              value={contactFilter}
              onChange={(event) =>
                changeFilter(() => setContactFilter(event.target.value))
              }
            >
              <option value="">All contacts</option>
              <option value="public">Public contact available</option>
              <option value="open">Open to interviews</option>
            </select>
          </label>
        </div>
        <nav className="stage-filters" aria-label="Project stage">
          <button
            aria-pressed={!stage}
            onClick={() => changeFilter(() => setStage(""))}
          >
            All stages
          </button>
          {stages.map((name) => (
            <button
              key={name}
              aria-pressed={stage === name}
              onClick={() => changeFilter(() => setStage(name))}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="results-toolbar">
          <span>
            {results.length} record{results.length === 1 ? "" : "s"}
            {stage ? ` · ${stage}` : ""}
          </span>
          <label>
            <span className="sr-only">Sort by</span>
            <select
              value={order}
              onChange={(event) =>
                changeFilter(() => setOrder(event.target.value))
              }
            >
              <option value="source">IHP order</option>
              <option value="name">Name A–Z</option>
              <option value="stage">Project stage</option>
            </select>
          </label>
        </div>
        {visible.length ? (
          <>
            <div className="library-grid">
              {visible.map((item) => (
                <a
                  className="library-card"
                  key={item.id}
                  href={`#registry/${item.id}`}
                >
                  <span className="stage-tag">{item.stages[0]}</span>
                  <h3>{item.title}</h3>
                  <p className="library-organisation">
                    {item.organisation || item.role}
                  </p>
                  <p className="library-topic">{item.topic || item.summary}</p>
                  <div className="library-card-bottom">
                    <span>
                      {item.publicContacts?.length
                        ? "Public contact"
                        : item.interviewDate || "Interview record"}
                    </span>
                    <span className="card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </a>
              ))}
            </div>
            <nav
              className="directory-pagination"
              aria-label="Results pagination"
            >
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                ← Previous
              </button>
              <span>
                {currentPage} / {pages}
              </span>
              <button
                disabled={currentPage >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next →
              </button>
            </nav>
          </>
        ) : (
          <div className="directory-empty">
            <h3>No matching records</h3>
            <p>
              {contactFilter === "open"
                ? "No confirmed interview availability in these results."
                : "Try another search or stage."}
            </p>
            <button
              className="app-button secondary"
              onClick={() => {
                setQuery("");
                setStage("");
                setContactFilter("");
                setRoleFilter("");
                setFieldFilter("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
