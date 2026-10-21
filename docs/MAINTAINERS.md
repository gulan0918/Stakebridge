# Maintaining the registry

`public/registry/entries.json` is the published source of truth. It is a shared repository resource, not visitor-local sample data. Successful deployments serve the same accepted data to every visitor. Community issues remain proposals until a maintainer incorporates them in a reviewed pull request.

## Identifiers and revisions

- Individual stakeholder entries and role guides use stable IDs such as `SB_000001`.
- Pathway collections use IDs such as `SB_100001` and reference individual entries through `members`.
- Allocate the next unused ID in the relevant range. Never recycle an ID for a different subject.
- Increment `revision` and update `updated` when changing an entry. Keep source attribution and past team experience intact unless correcting or removing it for a documented reason.
- Pathways need 4–8 ordered, distinct stages and at least one valid member. Nested pathways are not supported in this release.

## Entry fields

The TypeScript contract and runtime validator are in `src/registry/schema.ts`. Every entry includes its ID, revision, kind, title, role, organisation, domain (project field), stages, roleTags, tags (keywords), summary, rationale, interview text (or authored questions), integration, limitations, contributor, update date, HTTPS source, members, contact permission and experience records.

`stages` and `roleTags` contain one or more distinct, non-blank values; `tags` contains optional keywords. Use the suggestions in `src/journey.ts` and `src/registry/taxonomy.ts` when they fit, while accepting custom values for other projects. `role` remains the specific position or perspective, distinct from the searchable `roleTags` categories. Older records without `roleTags` remain readable; assign them during review. `sourceStage` retains an imported source’s original category for attribution.

`experiences` is an array of `{ team, year, summary, source }`. A role guide may have an empty experience array. A team-reported account is not an independent scientific verification; retain the context and source.

Default contact data:

```json
{
  "availability": "unrecorded",
  "channel": "",
  "consentSource": "",
  "expires": ""
}
```

`open` requires a public HTTPS channel, a public permission source and a valid expiry date. The UI independently checks the expiry against the current date before displaying an open contact channel. `closed` explicitly records current unavailability. Never infer an open state from a person's previous participation.

## IHP source import and public contacts

The initial 36 records derive from the ZJU-China IHP source at commit `707a093`. The importer parses its TypeScript syntax without executing it. To regenerate from an updated source, review its contents and run:

```sh
node scripts/import-ihp.mjs /path/to/human-practices.tsx <commit-sha> YYYY-MM-DD
```

Review the generated diff before committing. Keep permanent identifiers and increase revisions when changing already published records. Patient identities and photographs are excluded by the importer. The source may use approximate dates or describe future plans: preserve those distinctions rather than inventing exact dates or treating plans as verified results.

`public/registry/contact-sources.json` records reviewed role/organisation matches, professional contact channels and uncertainty notes. Each `publicContacts` item needs `label`, `kind` (email, website or phone), `value`, safe `url`, official HTTPS `source` and `checkedOn` date. Institutional enquiries must be labelled as institutional rather than an individual’s direct contact. This data does not change `contact.availability`.

The optional `materials` array links to already published photographs, documents or pages; it does not upload personal workspace attachments. `interviewDate` retains the source’s date label. `contactReview` explains unavailable or uncertain matches.

## Review process

1. Review the proposal's rights, attribution, source and level of evidence.
2. Check whether it duplicates an existing subject. Add experience to that entry where appropriate.
3. Distinguish authored guidance from a completed interview and completed actions from plans.
4. Remove private contact details, identifiable patient information and material without publication permission.
5. Review any claimed contact permission separately.
6. Add or update the entry, preserving stable IDs and increasing revision on changes.
7. Run `pnpm check:registry`, `pnpm test` and `pnpm build`.
8. Request review and merge the pull request. Link the accepted issue to the PR. Check deployment before calling the entry published.

## Hosting

The workflow builds on pushes and pull requests; only `main` deploys. The deploy job requests Pages write and OIDC permissions, while pull requests run with read-only repository permissions. New registry contributions are data, not executable HTML. The app renders entry text through React and validates HTTPS links.

For initial GitHub Pages configuration, select **Settings → Pages → Source → GitHub Actions**, then run the workflow. Until this one-time setting is enabled, the build produces a downloadable artifact and skips publication.
