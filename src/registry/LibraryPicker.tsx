import { useState } from "react";
import type { Workspace } from "../components/stakebridge/model";
import type { Registry, RegistryEntry } from "./schema";
import { standardStageName } from "../journey";

export function LibraryPicker({
  registry,
  error,
  workspace,
  stageId,
  onChoose,
}: {
  registry: Registry | null;
  error: string;
  workspace: Workspace;
  stageId: string;
  onChoose: (entry: RegistryEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [field, setField] = useState("");
  const [limit, setLimit] = useState(8);
  const entries =
    registry?.entries.filter((entry) => entry.kind !== "pathway") || [];
  const roles = [
    ...new Set(entries.flatMap((entry) => entry.roleTags || [])),
  ].sort();
  const fields = [...new Set(entries.map((entry) => entry.domain))].sort();
  const stageName = standardStageName(
    workspace.stages.find((stage) => stage.id === stageId)?.name || "",
  ).toLocaleLowerCase();
  const matchesStage = (entry: RegistryEntry) =>
    entry.stages.some(
      (name) => standardStageName(name).toLocaleLowerCase() === stageName,
    );
  const results = entries
    .filter(
      (entry) =>
        (!role || entry.roleTags?.includes(role)) &&
        (!field || entry.domain === field) &&
        [
          entry.title,
          entry.role,
          entry.organisation,
          entry.summary,
          entry.domain,
          ...entry.tags,
          ...(entry.roleTags || []),
          ...entry.stages,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => Number(matchesStage(b)) - Number(matchesStage(a)));
  if (error)
    return (
      <p role="alert">
        The library couldn’t be loaded. <a href="#registry">Open library →</a>
      </p>
    );
  if (!registry) return <p role="status">Loading the library…</p>;
  return (
    <div className="library-picker">
      <div className="picker-tools">
        <label className="picker-search">
          <span className="sb-sr-only">Search library</span>
          <input
            type="search"
            value={query}
            placeholder="Search people, organisations or topics"
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(8);
            }}
          />
        </label>
        <label>
          <span className="sb-sr-only">Library role</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setLimit(8);
            }}
          >
            <option value="">All roles</option>
            {roles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sb-sr-only">Library project field</span>
          <select
            value={field}
            onChange={(event) => {
              setField(event.target.value);
              setLimit(8);
            }}
          >
            <option value="">All fields</option>
            {fields.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="picker-count" role="status">
        {results.length} record{results.length === 1 ? "" : "s"}
      </p>
      <div className="picker-grid">
        {results.slice(0, limit).map((entry) => {
          const existing = workspace.stakeholders.find(
            (record) =>
              record.source?.entryId === entry.id && record.stageId === stageId,
          );
          return (
            <article className="picker-card" key={entry.id}>
              <span className="stage-tag">{entry.stages.join(" · ")}</span>
              <h3>{entry.title}</h3>
              <p>
                {entry.role}
                {entry.organisation ? ` · ${entry.organisation}` : ""}
              </p>
              <div>
                <a
                  href={`#registry/${entry.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View record ↗
                </a>
                <button
                  type="button"
                  className="sb-button sb-button-primary"
                  onClick={() => onChoose(entry)}
                  aria-label={`${existing ? "Open" : "Add"} ${entry.title}`}
                >
                  {existing ? "Open record" : "Add to this stage"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!results.length && (
        <div className="directory-empty">
          <h3>No matching records</h3>
          <button
            type="button"
            className="sb-button sb-button-outline"
            onClick={() => {
              setQuery("");
              setRole("");
              setField("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {results.length > limit && (
        <button
          type="button"
          className="sb-button sb-button-outline picker-more"
          onClick={() => setLimit((previous) => previous + 8)}
        >
          Show more
        </button>
      )}
    </div>
  );
}
