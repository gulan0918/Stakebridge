# StakeBridge

**A shared foundation for stakeholder engagement across the iGEM community.**

StakeBridge is a Human Practices contribution by ZJU-China. It helps iGEM teams plan engagement along a product’s journey, document what people told them, and show how that feedback changed the project. The shared registry preserves real engagement accounts so future teams can learn whom to approach, why a perspective matters and how dialogue informs decisions.

The software combines a public stakeholder directory with a browser-local project workspace. The iGEM Registry is a reference for the directory’s visual layout; StakeBridge’s records and product-stage framework are designed for stakeholder engagement.

## Shared registry

- **36 sourced IHP interview records**, including individual, group and organisational exchanges from ZJU-China 2026. A group interview is one record rather than a separate entry for each participant.
- Full Rationale, Stakeholder interview and Integration accounts, source date labels, contributing team, original material links and source revisions.
- Public professional contact channels for **10 records**, checked against university or institutional websites and accompanied by source links and verification dates. Uncertain identity matches remain unlisted. Patient accounts are anonymised and have no public contact details or photographs.
- Search by name, organisation, topic, ID or interview content; filter by product stage and contact status; browse a compact directory and tabbed documentation pages.
- Stable `SB_000001` identifiers, version history, team experience, correction requests and reviewed contributions through GitHub Issues and pull requests.
- Add a registry reference to a local workspace as a planning draft, retaining attribution. Your interview and integration fields start empty.

The initial records reproduce the team’s published accounts and date labels, including plans described in the source; they are not independent verification of outcomes. Public contact information is separate from willingness to participate in new interviews. No initial record claims a confirmed “open to interviews” status.

## Personal workspace

1. Give your team and project a name.
2. Define **4–8 ordered stages** from research to delivery and impact.
3. Add stakeholders within each stage, with roles and interview dates.
4. Organise each record into **Rationale → Stakeholder interview → Integrate**.
5. Attach audio, video, images and documents, with a maximum of 200 MB per file, subject to browser storage capacity.
6. Keep drafts or mark complete records after filling all three reflections, name and date.
7. Export a real `.docx` report. Stage names are heading 1, stakeholder names are heading 2, and the three reflection sections are heading 3. Interviews are ordered chronologically within each stage; undated drafts appear last. Draft inclusion is optional.
8. Download and restore a full `.stakebridge.json` backup, including original attachment bytes.

Personal data is saved in IndexedDB in the current browser. This release does **not** provide account authentication, cloud synchronisation, automatic transcription or live collaborative editing. Word exports contain notes and attachment names; full backups contain the original files. Download a backup before clearing site data or changing devices.

## Run locally

Use Node.js **22.18 or later** (Node 24 is used in CI) and pnpm **11.25.0**.

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the Local URL printed by Vite. Keep the same origin to return to the same browser workspace.

```sh
pnpm check:registry
pnpm test
pnpm build
pnpm preview
```

The build produces `dist/`. The app uses relative asset URLs and hash navigation, so it can run from a project subdirectory without server rewrite rules.

## Hosting and embedding

The GitHub Actions workflow tests and builds the project on pushes and pull requests. Once Pages is configured, pushes to `main` also publish the static build. To enable it, choose **Settings → Pages → Source → GitHub Actions** in this repository and run the workflow. Before this setting is enabled, builds still produce a downloadable `stakebridge-dist` artifact and publication is skipped.

Once Pages deployment succeeds, the expected project URL is `https://gulan0918.github.io/Stakebridge/`. Use the deployment's returned URL as the source of truth.

To use it from your iGEM wiki's Stakeholder Engagement section, link to the deployed workspace, or embed the deployed app in an iframe where your team's hosting rules allow it. The personal workspace belongs to the app's browser origin; backups transfer data between local, hosted and embedded instances.

## Contribute and maintain

See [CONTRIBUTING.md](CONTRIBUTING.md) to propose an engagement record, add experience or correct existing documentation. See [the maintainer guide](docs/MAINTAINERS.md) for the published data format and review process, and [data and permission](docs/PRIVACY.md) for storage and contact handling.

The public source of truth is [`public/registry/entries.json`](public/registry/entries.json). Accepted contributions update that file in a reviewed pull request, pass registry checks, and are published with the next successful deployment. Submitted issues are proposals, not automatically accepted records.

## Project structure

```text
src/components/StakeholderWorkspace.tsx   Personal workspace
src/components/stakebridge/              Model, storage, backup and Word export
src/registry/                            Catalogue, documentation and contribution UI
public/registry/entries.json             Published community registry
.github/ISSUE_TEMPLATE/                  Entry, experience and correction submissions
scripts/check-registry.mjs               Registry integrity checks
scripts/import-ihp.mjs                   Reproducible IHP source importer
public/registry/contact-sources.json     Reviewed official contact sources
tests/core.test.mjs                      Storage, import, permissions and export checks
```

## Attribution and licensing

Source code is available under the [MIT License](LICENSE). The initial registry documentation derives from the [ZJU-China 2026 wiki](https://gitlab.igem.org/2026/zju-china), with sources attached to individual entries; registry content is covered separately by [CC BY 4.0](LICENSE-DATA.md). Third-party source materials retain their original terms. The initial registry contains sourced engagement accounts rather than invented demonstration records.

StakeBridge is an independent community project with a visual reference to the [iGEM Registry](https://registry.igem.org/). It is not an official iGEM service.
