import { useState, type FormEvent } from "react";
import { download, safeFilename } from "../components/stakebridge/model";
import { REPOSITORY } from "./schema";
import { JOURNEY_STAGES } from "../journey";
import { ROLE_TAGS, PROJECT_FIELDS, splitTags } from "./taxonomy";

export function Contribute() {
  const [proposal, setProposal] = useState({
    title: "",
    kind: "stakeholder",
    role: "",
    organisation: "",
    stage: "",
    domain: "",
    contributor: "",
    summary: "",
    rationale: "",
    interview: "",
    interviewDate: "",
    materials: "",
    publicContact: "",
    contactSource: "",
    integration: "",
    limitations: "",
    source: "",
    tags: "",
    customRoles: "",
  });
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [generated, setGenerated] = useState(false);
  function update(key: keyof typeof proposal, value: string) {
    setProposal((previous) => ({ ...previous, [key]: value }));
    setGenerated(false);
    setError("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedStages.length && !splitTags(proposal.stage).length) {
      setError("Choose at least one project stage.");
      return;
    }
    if (!selectedRoles.length && !splitTags(proposal.customRoles).length) {
      setError("Choose at least one stakeholder role.");
      return;
    }
    if (consent) setGenerated(true);
  }
  const {
    stage: customStages,
    customRoles,
    tags: keywords,
    ...details
  } = proposal;
  const json = {
    format: "stakebridge-proposal",
    version: 1,
    ...details,
    stages: [...new Set([...selectedStages, ...splitTags(customStages)])],
    roleTags: [...new Set([...selectedRoles, ...splitTags(customRoles)])],
    tags: splitTags(keywords),
    contact: {
      availability: "unrecorded",
      channel: "",
      consentSource: "",
      expires: "",
    },
  };
  return (
    <div className="contribute-page">
      <h1>Contribute a record</h1>
      <p className="contribute-intro">
        Share your team’s stakeholder experience.
      </p>
      <div className="contribute-layout">
        <form className="contribute-form" onSubmit={submit}>
          <h2>Interview details</h2>
          <div className="contribute-fields">
            <label>
              Entry title
              <input
                value={proposal.title}
                required
                maxLength={160}
                onChange={(event) => update("title", event.target.value)}
                placeholder="Name of a person, organisation or interview group"
              />
            </label>
            <label>
              Role or position
              <input
                value={proposal.role}
                required
                maxLength={160}
                onChange={(event) => update("role", event.target.value)}
                placeholder="e.g. end user, researcher, service provider"
              />
            </label>
            <label>
              Organisation (optional)
              <input
                value={proposal.organisation}
                maxLength={180}
                onChange={(event) => update("organisation", event.target.value)}
              />
            </label>
            <label>
              Project field
              <input
                list="project-fields"
                value={proposal.domain}
                required
                maxLength={120}
                onChange={(event) => update("domain", event.target.value)}
                placeholder="Choose or enter a field"
              />
              <datalist id="project-fields">
                {PROJECT_FIELDS.map((field) => (
                  <option key={field} value={field} />
                ))}
              </datalist>
            </label>
            <label>
              Contributing team
              <input
                value={proposal.contributor}
                required
                maxLength={160}
                onChange={(event) => update("contributor", event.target.value)}
              />
            </label>
            <label>
              Public source or evidence
              <input
                type="url"
                pattern="https://.*"
                value={proposal.source}
                required
                maxLength={1000}
                onChange={(event) => update("source", event.target.value)}
                placeholder="https://…"
              />
            </label>
            <label>
              Interview date (optional)
              <input
                value={proposal.interviewDate}
                onChange={(event) =>
                  update("interviewDate", event.target.value)
                }
                placeholder="As recorded in the source"
                maxLength={100}
              />
            </label>
          </div>
          <fieldset className="contribution-tags">
            <legend>Project stages</legend>
            <div>
              {JOURNEY_STAGES.map((name) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={selectedStages.includes(name)}
                  onClick={() => {
                    setSelectedStages((previous) =>
                      previous.includes(name)
                        ? previous.filter((item) => item !== name)
                        : [...previous, name],
                    );
                    setGenerated(false);
                    setError("");
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              value={proposal.stage}
              onChange={(event) => update("stage", event.target.value)}
              placeholder="Custom stages (optional, comma-separated)"
              aria-label="Custom project stages"
              maxLength={300}
            />
          </fieldset>
          <fieldset className="contribution-tags">
            <legend>Stakeholder roles</legend>
            <div>
              {ROLE_TAGS.map((name) => (
                <button
                  type="button"
                  key={name}
                  aria-pressed={selectedRoles.includes(name)}
                  onClick={() => {
                    setSelectedRoles((previous) =>
                      previous.includes(name)
                        ? previous.filter((item) => item !== name)
                        : [...previous, name],
                    );
                    setGenerated(false);
                    setError("");
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              value={proposal.customRoles}
              onChange={(event) => update("customRoles", event.target.value)}
              placeholder="Custom roles (optional, comma-separated)"
              aria-label="Custom stakeholder roles"
              maxLength={300}
            />
          </fieldset>
          <label className="long-field">
            Keywords (optional)
            <input
              value={proposal.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="e.g. accessibility, prototyping, community engagement"
              maxLength={500}
            />
          </label>
          {(
            [
              [
                "summary",
                "Short description",
                "What perspective does this entry bring?",
              ],
              [
                "rationale",
                "Rationale",
                "Why did your team seek this perspective?",
              ],
              [
                "interview",
                "Stakeholder interview",
                "Describe the exchange and what you learned. Include only material approved for publication.",
              ],
              [
                "integration",
                "Integrate",
                "What changed in your project? Distinguish completed actions from future plans.",
              ],
              [
                "limitations",
                "Context & limitations",
                "Where might this experience not apply? What remains uncertain?",
              ],
            ] as const
          ).map(([key, title, placeholder]) => (
            <label className="long-field" key={key}>
              {title}
              <textarea
                rows={3}
                required
                maxLength={3000}
                value={proposal[key]}
                placeholder={placeholder}
                onChange={(event) => update(key, event.target.value)}
              />
            </label>
          ))}
          <details className="optional-fields">
            <summary>Materials & public contact (optional)</summary>
            <div className="contribute-fields">
              {" "}
              <label>
                Public professional contact (optional)
                <input
                  value={proposal.publicContact}
                  onChange={(event) =>
                    update("publicContact", event.target.value)
                  }
                  placeholder="Published business email or official contact page"
                  maxLength={1000}
                />
              </label>
              <label>
                Official contact source (optional)
                <input
                  type="url"
                  pattern="https://.*"
                  value={proposal.contactSource}
                  onChange={(event) =>
                    update("contactSource", event.target.value)
                  }
                  placeholder="Official page publishing this contact"
                  maxLength={1000}
                  required={!!proposal.publicContact}
                />
              </label>
              <label>
                Published material links (optional)
                <textarea
                  value={proposal.materials}
                  onChange={(event) => update("materials", event.target.value)}
                  placeholder="Links to published photographs, documents or related pages"
                  maxLength={3000}
                />
              </label>
            </div>
          </details>
          <label className="contribute-consent">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I have permission to publish this material under CC BY 4.0 and have
            removed private or confidential information.
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="app-button">
            Prepare submission
          </button>
          {generated && consent && (
            <div className="proposal-ready" role="status">
              <h3>Your proposal is ready for review</h3>
              <p>
                Download the file and attach it to a GitHub issue. Publication
                follows maintainer review.
              </p>
              <div className="button-row">
                <button
                  type="button"
                  className="app-button"
                  onClick={() =>
                    download(
                      new Blob([JSON.stringify(json, null, 2)], {
                        type: "application/json",
                      }),
                      `${safeFilename(proposal.title)}-proposal.json`,
                    )
                  }
                >
                  Download proposal JSON
                </button>
                <a
                  className="app-button secondary"
                  href={`${REPOSITORY}/issues/new?template=stakeholder-entry.yml&title=${encodeURIComponent(`[Entry proposal] ${proposal.title}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open GitHub submission ↗
                </a>
              </div>
            </div>
          )}
        </form>
        <aside className="contribute-aside">
          <h3>How it works</h3>
          <ol>
            <li>Prepare this record.</li>
            <li>Download the proposal.</li>
            <li>Submit it on GitHub.</li>
            <li>Maintainers review it.</li>
          </ol>
          <a href="#handbook/contribute">Contribution guide →</a>
        </aside>
      </div>
    </div>
  );
}
