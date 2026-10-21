import { useState, type FormEvent } from "react";
import { download, safeFilename } from "../components/stakebridge/model";
import { REPOSITORY } from "./schema";

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
  });
  const [consent, setConsent] = useState(false);
  const [generated, setGenerated] = useState(false);
  function update(key: keyof typeof proposal, value: string) {
    setProposal((previous) => ({ ...previous, [key]: value }));
    setGenerated(false);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (consent) setGenerated(true);
  }
  const json = {
    format: "stakebridge-proposal",
    version: 1,
    ...proposal,
    stages: proposal.stage
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    contact: {
      availability: "unrecorded",
      channel: "",
      consentSource: "",
      expires: "",
    },
  };
  return (
    <div className="contribute-page">
      <span className="entry-kicker">COMMUNITY SUBMISSIONS</span>
      <h1>
        Contribute to the registry
        <br />
        <em>Share a documented engagement record.</em>
      </h1>
      <p className="contribute-intro">
        Share the perspective your team needed, the conversation you had and the
        decisions that followed. Include the original documentation so other
        teams can understand the context and learn from your experience.
      </p>
      <div className="contribute-process">
        <span>
          <b>01</b> Prepare an entry
        </span>
        <span>→</span>
        <span>
          <b>02</b> Submit on GitHub
        </span>
        <span>→</span>
        <span>
          <b>03</b> Maintainer review
        </span>
        <span>→</span>
        <span>
          <b>04</b> Publish & reuse
        </span>
      </div>
      <div className="contribute-layout">
        <form className="contribute-form" onSubmit={submit}>
          <h2>Propose a registry entry</h2>
          <p className="muted">
            No private workspace data or files are sent automatically. This form
            prepares a proposal for you to submit.
          </p>
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
              Role
              <input
                value={proposal.role}
                required
                maxLength={160}
                onChange={(event) => update("role", event.target.value)}
                placeholder="e.g. biomaterials researcher"
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
              Product stages
              <input
                value={proposal.stage}
                required
                maxLength={300}
                onChange={(event) => update("stage", event.target.value)}
                placeholder="e.g. R&D, Manufacturing (comma-separated)"
              />
            </label>
            <label>
              Field / domain
              <input
                value={proposal.domain}
                required
                maxLength={120}
                onChange={(event) => update("domain", event.target.value)}
                placeholder="e.g. Biomedical materials"
              />
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
          <label className="contribute-consent">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I have permission to publish this material and have removed patient
            identifiers, private contact details and confidential information.
          </label>
          <button type="submit" className="app-button">
            Prepare submission
          </button>
          {generated && (
            <div className="proposal-ready" role="status">
              <h3>Your proposal is ready for review</h3>
              <p>
                Download the proposal, open the GitHub submission form, and
                attach the file to your issue. Maintainers assign a permanent SB
                ID after review. Nothing is published by this button.
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
          <h3>Document the engagement</h3>
          <p>
            Each accepted entry receives a stable ID and versioned
            documentation. Other teams can add experience with their own
            evidence and context.
          </p>
          <h3>Contact and availability</h3>
          <p>
            Listing a person or documenting a previous interview does not mean
            they welcome new interviews. Published professional contact details
            need an official source. An “open to interviews” status requires
            separate permission evidence and an expiry date.
          </p>
          <h3>Credit the contributing team</h3>
          <p>
            Include your team, year and original documentation. Report what
            actually happened, including limitations and unsuccessful
            approaches.
          </p>
          <a
            href={`${REPOSITORY}/blob/main/CONTRIBUTING.md`}
            target="_blank"
            rel="noreferrer"
          >
            Read contribution guidance ↗
          </a>
        </aside>
      </div>
    </div>
  );
}
