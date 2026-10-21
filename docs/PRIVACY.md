# Data and permission

## Personal workspace

The workspace stores project names, stages, stakeholder notes and original attachments in the browser's IndexedDB. It does not send them to the repository, analytics services or a cloud database. The app loads the public registry from the same hosting origin and contains no analytics or third-party font/CDN calls.

Browser-local storage is not account authentication or encryption. Someone with access to the same browser profile may access its workspace. A different origin, browser profile or device has different local data. Clearing site data removes the workspace. A private browsing session may remove it when closed.

Full backups are ordinary JSON files containing notes and base64-encoded original attachments. Keep them somewhere appropriate for the material. Word reports contain notes, attribution and attachment names; original files are not embedded. The app does not record audio, access the camera or transcribe uploads.

## Public registry and submissions

Published registry content is public. GitHub submissions are made through GitHub's own interface and governed by its visibility and account settings. The app's proposal form prepares a file locally; it does not post on your behalf or silently upload workspace records.

Maintainers must review material before accepting it. Public professional information does not imply permission to share private contact details or to list a person as willing to receive new requests. Contact availability must be documented separately with a public channel, permission evidence and an expiry date; expired permissions are excluded from the “open to contact” filter.

If a public entry needs correction or removal, use the correction link without repeating private information in the issue. Deleting content from the latest registry does not erase past repository history; maintainers should follow GitHub's sensitive-data removal process when necessary.
