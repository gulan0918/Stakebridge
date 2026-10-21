import { useState, type ReactNode } from "react";
import { download } from "./components/stakebridge/model";
import { REPOSITORY } from "./registry/schema";

const template = `STAKEHOLDER ENGAGEMENT RECORD

Team / project:
Project stage:
Stakeholder / organisation:
Interview date:

RATIONALE
What decision do we need to make?
Why does this person's perspective matter?
What do we want to learn?

STAKEHOLDER INTERVIEW
Permission for notes / recording / publication:
Main questions:
What we heard:
Evidence and material references:
Uncertainties or differing views:

INTEGRATE
Previous plan:
Feedback considered:
Decision and reason:
Change made / next action:
Owner and follow-up date:
Evidence that the action was completed:

PUBLICATION CHECK
Approved public account:
Private material removed:
Official source for any public contact:
Interview availability confirmed separately:
`;

type Chapter = {
  slug: string;
  title: string;
  description: string;
  content: ReactNode;
};

const chapters: Chapter[] = [
  {
    slug: "start",
    title: "Get started",
    description: "Set up a project and record your first interview.",
    content: (
      <>
        <ol className="handbook-steps">
          <li>
            <h3>Create your workspace</h3>
            <p>
              Open <a href="#workspace">Workspace</a> and enter your team and
              project names.
            </p>
          </li>
          <li>
            <h3>Define 4–8 stages</h3>
            <p>
              Follow your product from the first research question to use and
              follow-up. Rename and reorder the stages for your project.
            </p>
          </li>
          <li>
            <h3>Add a stakeholder</h3>
            <p>
              Select a stage and choose <b>Add from library</b> to select an
              existing stakeholder, or <b>Add stakeholder</b> to create your
              own. Add your interview date when you meet.
            </p>
          </li>
          <li>
            <h3>Document the exchange</h3>
            <p>
              Complete Rationale, Stakeholder interview and Integrate. Attach
              the relevant files to each section.
            </p>
          </li>
          <li>
            <h3>Export and back up</h3>
            <p>
              Export a Word report for writing and review. Download a full
              backup to retain original attachments or move to another device.
            </p>
          </li>
        </ol>
        <div className="handbook-callout">
          <b>Start with a draft.</b>
          <p>
            You can return to unfinished records. Mark a record complete once
            its name, date and three sections are filled.
          </p>
        </div>
      </>
    ),
  },
  {
    slug: "map",
    title: "Build your stakeholder map",
    description: "Organise perspectives around the product journey.",
    content: (
      <>
        <p>
          Start with the decisions your project must make. For each stage,
          identify who experiences the problem, who contributes expertise, and
          who can enable or challenge the next step.
        </p>
        <h3>A starting point for any project</h3>
        <div className="handbook-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Perspectives</th>
                <th>What to learn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Users</td>
                <td>End users, beneficiaries and affected communities</td>
                <td>Needs, existing practices and barriers</td>
              </tr>
              <tr>
                <td>Research &amp; development</td>
                <td>Researchers, domain experts and designers</td>
                <td>Assumptions, feasibility and evidence</td>
              </tr>
              <tr>
                <td>Production &amp; delivery</td>
                <td>Makers, operators and service providers</td>
                <td>Resources, consistency and delivery constraints</td>
              </tr>
              <tr>
                <td>Adoption &amp; access</td>
                <td>Partners, decision-makers and purchasers</td>
                <td>Adoption, affordability and access</td>
              </tr>
              <tr>
                <td>Use</td>
                <td>Users, implementers and support teams</td>
                <td>Usability and practical requirements</td>
              </tr>
              <tr>
                <td>Impact &amp; follow-up</td>
                <td>Users, communities and evaluators</td>
                <td>Outcomes, unintended effects and improvements</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Use this as a starting point, not a required sequence. A software
          tool, an educational programme and a physical product may need
          different stages. You can rename, add or remove stages within the 4–8
          stage limit.
        </p>
        <h3>Check for missing perspectives</h3>
        <ul>
          <li>Who will use the product, and who might be left out?</li>
          <li>Who will make, deliver, purchase or maintain it?</li>
          <li>Who bears a cost or risk without receiving a benefit?</li>
          <li>Whose view could disagree with the team’s assumptions?</li>
        </ul>
        <a className="app-button secondary" href="#workspace">
          Build your map →
        </a>
      </>
    ),
  },
  {
    slug: "interview",
    title: "Prepare an interview",
    description: "Make each conversation focused and respectful.",
    content: (
      <>
        <h3>Before the conversation</h3>
        <ul>
          <li>
            Write down the decision you need help with and the assumptions you
            want to test.
          </li>
          <li>
            Check the person’s role and use an appropriate professional contact
            channel.
          </li>
          <li>
            Explain your team, the topic, expected duration and intended use of
            the conversation.
          </li>
          <li>
            Ask separately about taking notes, recording and publishing names,
            quotations or materials.
          </li>
        </ul>
        <h3>Questions to adapt</h3>
        <ol>
          <li>How do you currently deal with this problem?</li>
          <li>Which part of that process is most difficult?</li>
          <li>What would a useful improvement need to achieve?</li>
          <li>What could prevent our approach from working in practice?</li>
          <li>What evidence would you need before considering it?</li>
          <li>Which trade-offs would be unacceptable?</li>
          <li>Who else should we hear from, and why?</li>
        </ol>
        <h3>After the conversation</h3>
        <p>
          Separate the participant’s account from your interpretation. Check
          important quotations, record uncertainties and agree on any follow-up.
          Respect a decision to decline or stop participating.
        </p>
        <div className="handbook-callout">
          <b>A public email is a contact route.</b>
          <p>
            It is not confirmation that someone welcomes new interview requests.
            Availability is recorded separately in the library.
          </p>
        </div>
      </>
    ),
  },
  {
    slug: "record",
    title: "Rationale → Interview → Integrate",
    description: "Keep the link between feedback and project decisions.",
    content: (
      <>
        <h3>Rationale</h3>
        <p>
          State why you approached this person, what perspective they bring and
          which decision or uncertainty prompted the exchange.
        </p>
        <h3>Stakeholder interview</h3>
        <p>
          Record the questions, relevant responses and evidence. Keep
          participant statements distinct from the team’s interpretation. Link
          notes, recordings or other materials where you have permission to
          retain them.
        </p>
        <h3>Integrate</h3>
        <p>
          Show the previous plan, the feedback considered, the decision made and
          the resulting action. An action can be completed, planned or rejected
          with a reason. Record the evidence and follow-up needed to assess it.
        </p>
        <div className="handbook-case">
          <span>From the ZJU-China IHP record</span>
          <h3>Clarifying the treatment boundary</h3>
          <dl>
            <dt>Rationale</dt>
            <dd>
              The team needed to distinguish local cartilage repair from broader
              claims about treating osteoarthritis.
            </dd>
            <dt>Interview</dt>
            <dd>
              Prof. Ouyang Hongwei discussed the indication and the relationship
              between material degradation and tissue regeneration.
            </dd>
            <dt>Integration</dt>
            <dd>
              The team’s account describes a narrower indication and the
              addition of degradation testing.
            </dd>
          </dl>
          <a href="#registry/SB_000001">Read the full sourced record →</a>
        </div>
        <p>
          Use this structure to document your own work. A library example is a
          reference, not evidence that your team conducted the same interview or
          obtained the same results.
        </p>
      </>
    ),
  },
  {
    slug: "library",
    title: "Use the shared library",
    description:
      "Find relevant records and bring references into your project.",
    content: (
      <>
        <ol className="handbook-steps">
          <li>
            <h3>Search by your question</h3>
            <p>
              Search names, organisations, topics or interview content. Use
              project stages, stakeholder roles and project fields to narrow the
              results.
            </p>
          </li>
          <li>
            <h3>Read the context</h3>
            <p>
              Review the Rationale, Interview and Integration sections. Check
              the original IHP source, materials, date and contributing team.
            </p>
          </li>
          <li>
            <h3>Check the contact</h3>
            <p>
              Public contact channels link to official sources. A general
              institutional address is labelled separately from an individual’s
              direct contact. An “open to interviews” status needs its own
              permission evidence.
            </p>
          </li>
          <li>
            <h3>Add a planning draft</h3>
            <p>
              In Workspace, open a stage and select <b>Add from library</b>.
              Choose a stakeholder to add directly to that stage. You can also
              add a record from its library page. The draft keeps its source;
              your interview and integration fields start empty.
            </p>
          </li>
        </ol>
        <p>
          The initial ZJU-China biomedical collection contains individual, group
          and organisational interview records. One group conversation is one
          record, even when several people participated.
        </p>
        <a className="app-button secondary" href="#registry">
          Browse the library →
        </a>
      </>
    ),
  },
  {
    slug: "export",
    title: "Files, export & backup",
    description: "Keep notes and original materials together.",
    content: (
      <>
        <h3>Attachments</h3>
        <p>
          Add audio, video, photographs or documents to the relevant reflection
          section. Each file can be up to 200 MB, subject to available browser
          storage. Your attachments stay on this device until you choose to
          share them.
        </p>
        <h3>Word report</h3>
        <p>
          Select <b>Export Word</b>. Choose whether to include drafts. The
          report uses real Word heading styles:
        </p>
        <ul>
          <li>
            <b>Heading 1:</b> project stage.
          </li>
          <li>
            <b>Heading 2:</b> stakeholder, in interview-date order within that
            stage.
          </li>
          <li>
            <b>Heading 3:</b> Rationale, Stakeholder interview and Integrate.
          </li>
        </ul>
        <p>
          The report includes notes, references and attachment names. It does
          not embed original recordings or documents. Undated drafts appear
          last.
        </p>
        <h3>Full backup</h3>
        <p>
          Choose <b>Backup &amp; restore → Download full backup</b> to save a{" "}
          <code>.stakebridge.json</code> file containing the workspace and
          original attachments.
        </p>
        <p>
          Restore that file on another device or browser. Restoring replaces
          that browser’s current workspace; back it up first if you need to keep
          both.
        </p>
        <div className="handbook-callout">
          <b>Back up before clearing site data.</b>
          <p>
            Browser storage is tied to the website address, browser and profile.
            Use a backup to transfer your workspace to another device.
          </p>
        </div>
      </>
    ),
  },
  {
    slug: "contribute",
    title: "Contribute a record",
    description: "Share an account that another team can learn from.",
    content: (
      <>
        <ol className="handbook-steps">
          <li>
            <h3>Prepare the account</h3>
            <p>
              Include the person or organisation, rationale, interview account,
              integration and limitations. Add your team, dates and public
              evidence.
            </p>
          </li>
          <li>
            <h3>Check publication permission</h3>
            <p>
              Remove patient identifiers, private contact details and
              confidential material. Link to published materials you have
              permission to share. Give an official source for any public
              professional contact.
            </p>
          </li>
          <li>
            <h3>Submit on GitHub</h3>
            <p>
              Use <a href="#contribute">Contribute</a> to prepare and download a
              proposal. Open the linked GitHub issue form and attach it.
              Preparing a file does not publish it.
            </p>
          </li>
          <li>
            <h3>Maintainer review</h3>
            <p>
              Maintainers check the sources and prepare a reviewed data update.
              Accepted records receive a stable identifier and are included
              after merge and deployment.
            </p>
          </li>
        </ol>
        <h3>Classify the record</h3>
        <ul>
          <li>
            <b>Project stages:</b> choose every relevant step, from Users to
            Impact &amp; follow-up. Custom stages are welcome.
          </li>
          <li>
            <b>Stakeholder roles:</b> choose one or more roles, such as users,
            researchers, partners or decision-makers. Add a custom role when
            needed.
          </li>
          <li>
            <b>Project field:</b> choose a suggested field or enter your own.
          </li>
          <li>
            <b>Keywords:</b> optionally add topics or methods, separated by
            commas.
          </li>
        </ul>
        <h3>Improve an existing record</h3>
        <p>
          Add your own team’s experience through the record’s Experience tab, or
          request a correction from Source &amp; history. Include the record ID
          and supporting evidence.
        </p>
        <a className="app-button secondary" href="#contribute">
          Prepare a contribution →
        </a>
      </>
    ),
  },
  {
    slug: "data",
    title: "Data, type & credits",
    description: "Storage, publication and the site’s visual assets.",
    content: (
      <>
        <h3>Your workspace</h3>
        <p>
          Your notes and attachments are saved on this device. They are not
          published to the shared library. Download a backup before switching
          devices or clearing site data. Anyone using the same browser profile
          may be able to access the workspace.
        </p>
        <h3>The public collection</h3>
        <p>
          Accepted records are public repository data. The initial accounts come
          from ZJU-China’s IHP documentation and retain source links. Dates,
          plans and outcomes reflect the team’s account; inclusion is not
          independent validation or endorsement.
        </p>
        <p>
          Patient accounts are anonymised. Public professional contacts and
          availability for new interviews are separate fields.
        </p>
        <h3>Typography</h3>
        <p>
          StakeBridge uses Outfit, the same main typeface as the ZJU-China wiki.
          The font is served from the team’s <code>static.igem.wiki</code>{" "}
          asset, with system fonts as fallbacks. It makes no Google Fonts or
          third-party font-CDN requests.
        </p>
        <p>
          Outfit is licensed under the SIL Open Font License 1.1.{" "}
          <a
            href={`${import.meta.env.BASE_URL}licenses/outfit-OFL.txt`}
            target="_blank"
            rel="noreferrer"
          >
            Read the licence
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/Outfitio/Outfit-Fonts"
            target="_blank"
            rel="noreferrer"
          >
            Font project ↗
          </a>
        </p>
        <h3>Sources and licences</h3>
        <ul>
          <li>
            <a
              href="https://gitlab.igem.org/2026/zju-china"
              target="_blank"
              rel="noreferrer"
            >
              ZJU-China 2026 wiki and source ↗
            </a>
          </li>
          <li>
            <a
              href={`${REPOSITORY}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
            >
              Software: MIT
            </a>{" "}
            ·{" "}
            <a
              href={`${REPOSITORY}/blob/main/LICENSE-DATA.md`}
              target="_blank"
              rel="noreferrer"
            >
              Registry and handbook text: CC BY 4.0
            </a>
          </li>
          <li>
            <a
              href={`${REPOSITORY}/blob/main/docs/PRIVACY.md`}
              target="_blank"
              rel="noreferrer"
            >
              Data and contact policy ↗
            </a>
          </li>
        </ul>
        <p>
          StakeBridge is an independent contribution to the iGEM community by
          ZJU-China.
        </p>
      </>
    ),
  },
];

export function Handbook({ slug }: { slug?: string }) {
  const [query, setQuery] = useState("");
  const index = chapters.findIndex(
    (chapter) => chapter.slug === (slug || "start"),
  );
  const chapter = chapters[index];
  const found = chapters.filter((item) =>
    `${item.title} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="handbook-page">
      <header className="page-heading handbook-heading">
        <div>
          <h1>Handbook</h1>
          <p>Stakeholder engagement for any project.</p>
        </div>
        <div className="button-row">
          <button
            className="app-button secondary"
            onClick={() =>
              download(
                new Blob([template], { type: "text/plain;charset=utf-8" }),
                "stakebridge-interview-template.txt",
              )
            }
          >
            Interview template ↓
          </button>
          <button className="app-button" onClick={() => window.print()}>
            Print / save PDF
          </button>
        </div>
      </header>
      <div className="handbook-layout">
        <aside className="handbook-sidebar">
          <label className="handbook-search">
            <span className="sr-only">Find a handbook chapter</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a chapter"
            />
          </label>
          <nav aria-label="Handbook chapters">
            {found.map((item) => (
              <a
                key={item.slug}
                href={`#handbook/${item.slug}`}
                aria-current={chapter?.slug === item.slug ? "page" : undefined}
              >
                {item.title}
              </a>
            ))}
            {!found.length && <p>No matching chapters.</p>}
          </nav>
          <a className="handbook-start" href="#workspace">
            Open workspace →
          </a>
        </aside>
        <article className="handbook-article">
          {chapter ? (
            <>
              <header>
                <span className="handbook-number">
                  {index + 1} / {chapters.length}
                </span>
                <h2>{chapter.title}</h2>
                <p>{chapter.description}</p>
              </header>
              <div className="handbook-body">{chapter.content}</div>
              <nav
                className="handbook-pager"
                aria-label="Next handbook chapter"
              >
                {index > 0 ? (
                  <a href={`#handbook/${chapters[index - 1].slug}`}>
                    ← {chapters[index - 1].title}
                  </a>
                ) : (
                  <span />
                )}
                {index < chapters.length - 1 && (
                  <a href={`#handbook/${chapters[index + 1].slug}`}>
                    {chapters[index + 1].title} →
                  </a>
                )}
              </nav>
            </>
          ) : (
            <>
              <h2>Chapter not found</h2>
              <a href="#handbook">Open the handbook</a>
            </>
          )}
        </article>
      </div>
      <div className="handbook-print">
        <header>
          <h1>StakeBridge Handbook</h1>
          <p>ZJU-China · Stakeholder engagement</p>
        </header>
        {chapters.map((item) => (
          <article key={item.slug}>
            <h2>{item.title}</h2>
            {item.content}
          </article>
        ))}
      </div>
    </div>
  );
}
