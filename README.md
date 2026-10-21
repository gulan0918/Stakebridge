# StakeBridge

**Every conversation can become a starting point for the next team.**

StakeBridge is a contribution to Human Practices in the iGEM community by ZJU-China. Inspired by the iGEM Parts Registry, it connects stakeholder perspectives, engagement pathways and project insights into a shared resource that teams can assess, adapt and build on.

The software combines a public registry with a personal engagement workspace. Knowledge is reusable; a person's participation is always their own choice.

## Shared registry

- Stable `SB_000001` identifiers and versioned entry documentation.
- **Stakeholder entries** and **role guides** as individual resources; **pathway collections** combine them across a product lifecycle.
- Search by ID, name, role, organisation and topic, with filters for entry type, product stage and current contact permission.
- Rationale, suggested interview questions, integration examples, limitations, attribution and source documentation on every entry.
- Team experience records, correction requests and a contribution process through GitHub Issues and reviewed pull requests.
- Add a reference or pathway to a personal workspace as planning drafts. Other teams' outcomes are not copied into your own interview or integration fields.

The initial collection contains five sourced stakeholder cases, three authored role guides and one pathway collection. Cases summarise ZJU-China's documented engagement; they do not imply public contact consent. No entry in this initial release claims an authorised public contact channel. The registry supports these channels when permission evidence and an expiry date are supplied.

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

See [CONTRIBUTING.md](CONTRIBUTING.md) to propose an entry, add experience, assemble a pathway or correct existing documentation. See [the maintainer guide](docs/MAINTAINERS.md) for the published data format and review process, and [data and permission](docs/PRIVACY.md) for storage and contact handling.

The public source of truth is [`public/registry/entries.json`](public/registry/entries.json). Accepted contributions update that file in a reviewed pull request, pass registry checks, and are published with the next successful deployment. Submitted issues are proposals, not automatically accepted records.

## Project structure

```text
src/components/StakeholderWorkspace.tsx   Personal workspace
src/components/stakebridge/              Model, storage, backup and Word export
src/registry/                            Catalogue, documentation and contribution UI
public/registry/entries.json             Published community registry
.github/ISSUE_TEMPLATE/                  Entry, experience and correction submissions
scripts/check-registry.mjs               Registry integrity checks
tests/core.test.mjs                      Storage, import, permissions and export checks
```

## Attribution and licensing

Source code is available under the [MIT License](LICENSE). The initial registry documentation derives from the [ZJU-China 2026 wiki](https://gitlab.igem.org/2026/zju-china), with sources attached to individual entries; registry content is covered separately by [CC BY 4.0](LICENSE-DATA.md). Third-party source materials retain their original terms. Suggested interview questions and role guides are authored resources rather than verbatim transcripts.

StakeBridge is an independent community project inspired by the [iGEM Registry](https://registry.igem.org/). It is not an official iGEM service.
