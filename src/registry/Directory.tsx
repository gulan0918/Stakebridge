import { useState } from "react";
import {
  openToContact,
  REPOSITORY,
  type Registry,
  type RegistryEntry,
} from "./schema";
import type { Workspace } from "../components/stakebridge/model";

const stageOrder = [
  "Patient",
  "R&D",
  "Manufacturing",
  "Market access",
  "Treatment",
  "Rehabilitation",
];

function PublicContacts({ entry }: { entry: RegistryEntry }) {
  const contacts = entry.publicContacts || [];
  return (
    <div className="directory-contact">
      <h3>Public contact</h3>
      {contacts.length ? (
        <>
          {contacts.map((channel) => (
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
              </a>
              <small>
                <a href={channel.source} target="_blank" rel="noreferrer">
                  Official source ↗
                </a>{" "}
                · checked {channel.checkedOn}
              </small>
            </div>
          ))}
          {entry.contactReview?.note &&
            !entry.contactReview.note.startsWith("No matching") && (
              <p>{entry.contactReview.note}</p>
            )}
        </>
      ) : (
        <p>
          {entry.contactReview?.status === "not_sought"
            ? "Patient contact details are not published."
            : entry.contactReview?.note ||
              "No public professional contact confirmed."}
        </p>
      )}
      <div className="contact-status">
        <b>Interview availability</b>
        <span>
          {openToContact(entry)
            ? "Open to new enquiries"
            : entry.contact.availability === "closed"
              ? "Currently unavailable"
              : "Not separately recorded"}
        </span>
      </div>
      <p className="directory-footnote">
        A public contact address does not establish willingness to take part in
        a new interview.
      </p>
      {openToContact(entry) && (
        <a href={entry.contact.channel} target="_blank" rel="noreferrer">
          Authorised interview channel ↗
        </a>
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
  function changeFilter(action: () => void) {
    action();
    setPage(1);
  }
  const results = registry.entries.filter(
    (item) =>
      (!stage || item.stages.includes(stage)) &&
      (!contactFilter ||
        (contactFilter === "public"
          ? !!item.publicContacts?.length
          : openToContact(item))) &&
      [
        item.id,
        item.title,
        item.topic,
        item.role,
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
          (name) => name.toLocaleLowerCase() === item.name.toLocaleLowerCase(),
        ),
      )?.id ||
      workspace?.stages[0].id ||
      "";
    const materials = entry.materials || [];
    return (
      <div className="directory record-page">
        <nav className="directory-breadcrumb" aria-label="Breadcrumb">
          <a href="#registry">Stakeholder registry</a>
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
            Original IHP record ↗
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
            <dt>Product stage</dt>
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
            ["documentation", "Documentation"],
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
                  <h2>Overview</h2>
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
                <p className="directory-footnote">
                  Source:{" "}
                  <a href={entry.source} target="_blank" rel="noreferrer">
                    ZJU-China IHP documentation
                  </a>
                  . {entry.limitations}
                </p>
              </>
            )}
            {tab === "materials" && (
              <>
                <h2>Interview materials</h2>
                <p className="directory-description">
                  Materials already linked in the IHP record. Files open at
                  their original source.
                </p>
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
                  <dt>Updated</dt>
                  <dd>{entry.updated}</dd>
                  <dt>Interview content</dt>
                  <dd>
                    <a href={entry.source} target="_blank" rel="noreferrer">
                      Original IHP source at the imported revision ↗
                    </a>
                  </dd>
                  <dt>Contact information</dt>
                  <dd>
                    Sources and verification dates are listed alongside each
                    public channel.
                  </dd>
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
              <h3>Add to your project</h3>
              <p>
                Create a planning draft with this record’s source. Your
                interview notes and project changes remain your own.
              </p>
              {entry.kind === "pathway" ? (
                <button className="app-button" onClick={() => onPathway(entry)}>
                  Use pathway
                </button>
              ) : workspace ? (
                <>
                  <label htmlFor="registry-target-stage">
                    Product stage
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
                    Add planning draft
                  </button>
                </>
              ) : (
                <a href="#workspace" className="app-button">
                  Create a workspace
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
      <header className="directory-heading">
        <div>
          <h1>Stakeholder registry</h1>
          <p>
            ZJU-China’s documented stakeholder engagement, organised by the
            product journey.
          </p>
        </div>
        <a className="app-button" href="#contribute">
          Submit a record
        </a>
      </header>
      <div className="directory-tools">
        <label className="directory-search">
          <span className="sr-only">Search stakeholder records</span>
          <input
            type="search"
            value={query}
            placeholder="Search names, organisations, topics or interview content"
            onChange={(event) =>
              changeFilter(() => setQuery(event.target.value))
            }
          />
        </label>
        <label>
          <span className="sr-only">Contact filter</span>
          <select
            value={contactFilter}
            onChange={(event) =>
              changeFilter(() => setContactFilter(event.target.value))
            }
          >
            <option value="">All contact statuses</option>
            <option value="public">Public contact available</option>
            <option value="open">Open to new interviews</option>
          </select>
        </label>
      </div>
      <div className="directory-layout">
        <aside className="directory-filters">
          <h2>Product stage</h2>
          <button
            className={!stage ? "active" : ""}
            aria-pressed={!stage}
            onClick={() => changeFilter(() => setStage(""))}
          >
            <span>All records</span>
            <b>{registry.entries.length}</b>
          </button>
          {stages.map((name) => (
            <button
              key={name}
              className={stage === name ? "active" : ""}
              aria-pressed={stage === name}
              onClick={() => changeFilter(() => setStage(name))}
            >
              <span>{name}</span>
              <b>
                {
                  registry.entries.filter((item) => item.stages.includes(name))
                    .length
                }
              </b>
            </button>
          ))}
          <div className="directory-filter-info">
            <b>Collection</b>
            <span>ZJU-China 2026</span>
            <a
              href="https://2026.igem.wiki/zju-china/human-practices#stakeholder-engagement"
              target="_blank"
              rel="noreferrer"
            >
              View IHP page ↗
            </a>
            <span>Updated {registry.updated}</span>
          </div>
        </aside>
        <section className="directory-results" aria-label="Registry results">
          <div className="results-toolbar">
            <span>
              {results.length
                ? `${(currentPage - 1) * 12 + 1}–${Math.min(currentPage * 12, results.length)}`
                : "0"}{" "}
              of {results.length} records{stage ? ` · ${stage}` : ""}
            </span>
            <label>
              Sort by
              <select
                value={order}
                onChange={(event) =>
                  changeFilter(() => setOrder(event.target.value))
                }
              >
                <option value="source">IHP source order</option>
                <option value="name">Name</option>
                <option value="stage">Product stage</option>
              </select>
            </label>
          </div>
          {visible.length ? (
            <>
              <div className="directory-table-wrap">
                <table className="directory-table">
                  <thead>
                    <tr>
                      <th scope="col">Stakeholder / organisation</th>
                      <th scope="col">Stage</th>
                      <th scope="col">Interview focus</th>
                      <th scope="col">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <a
                            className="directory-name"
                            href={`#registry/${item.id}`}
                          >
                            {item.title}
                          </a>
                          <span className="directory-affiliation">
                            {item.organisation || item.role}
                          </span>
                          <span className="directory-record-id">
                            {item.id} · {item.interviewDate || "IHP record"}
                          </span>
                        </td>
                        <td>
                          <span className="stage-tag">{item.stages[0]}</span>
                        </td>
                        <td>
                          <a
                            className="directory-topic"
                            href={`#registry/${item.id}`}
                          >
                            {item.topic || item.summary}
                          </a>
                          <span className="directory-material-count">
                            {item.materials?.length || 0} linked material
                            {item.materials?.length === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`public-status ${item.publicContacts?.length ? "available" : ""}`}
                          >
                            {item.publicContacts?.some(
                              (channel) => channel.kind === "email",
                            )
                              ? "Public email"
                              : item.publicContacts?.length
                                ? "Public website"
                                : item.contactReview?.status === "not_sought"
                                  ? "Not published"
                                  : "Not confirmed"}
                          </span>
                          <a
                            className="directory-details"
                            href={`#registry/${item.id}`}
                          >
                            View record →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav
                className="directory-pagination"
                aria-label="Results pagination"
              >
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {pages}
                </span>
                <button
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          ) : (
            <div className="directory-empty">
              <h2>No matching records</h2>
              <p>
                {contactFilter === "open"
                  ? "No record currently has separately documented permission for new interviews matching these filters."
                  : "Try another name, topic or product stage."}
              </p>
              <button
                className="app-button secondary"
                onClick={() => {
                  setQuery("");
                  setStage("");
                  setContactFilter("");
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          <p className="directory-footnote">
            Each record preserves the team’s Rationale, Interview and
            Integration account. Public contact details are checked against
            their cited sources; availability for new interviews is recorded
            separately.
          </p>
        </section>
      </div>
    </div>
  );
}
