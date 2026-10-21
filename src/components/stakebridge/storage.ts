import { validateWorkspace, type Workspace } from "./model.ts";

let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("stakebridge-local", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("workspace");
        request.result.createObjectStore("files");
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          database = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        database = undefined;
        reject(new Error("Close other StakeBridge tabs and try again."));
      };
    });
  }
  return database;
}

export async function loadWorkspace(): Promise<Workspace | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction("workspace")
      .objectStore("workspace")
      .get("current");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      try {
        if (request.result === undefined) return resolve(null);
        validateWorkspace(request.result);
        resolve(request.result);
      } catch (error) {
        reject(error);
      }
    };
  });
}

/** Notes and original files commit together, so a record never points at a partial upload. */
export async function saveWorkspace(
  workspace: Workspace,
  files: Map<string, Blob> = new Map(),
  deleted: Set<string> = new Set(),
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["workspace", "files"], "readwrite");
    transaction.objectStore("workspace").put(workspace, "current");
    const store = transaction.objectStore("files");
    deleted.forEach((id) => store.delete(id));
    files.forEach((blob, id) => store.put(blob, id));
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(
        transaction.error ||
          new Error("The browser could not save this workspace."),
      );
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function loadFile(id: string): Promise<Blob> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("files").objectStore("files").get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      request.result instanceof Blob
        ? resolve(request.result)
        : reject(
            new Error(
              "The original attachment is missing. Restore a backup that contains this file.",
            ),
          );
  });
}

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

export async function createBackup(
  workspace: Workspace,
  getFile: (id: string) => Promise<Blob>,
): Promise<Blob> {
  const files: { id: string; data: string }[] = [];
  for (const item of workspace.stakeholders) {
    for (const attachment of item.attachments) {
      files.push({
        id: attachment.id,
        data: await base64(await getFile(attachment.id)),
      });
    }
  }
  return new Blob(
    [
      JSON.stringify({
        format: "stakebridge-backup",
        version: 1,
        workspace,
        files,
      }),
    ],
    { type: "application/json" },
  );
}

export async function readBackup(
  file: File,
): Promise<{ workspace: Workspace; files: Map<string, Blob> }> {
  if (file.size > 512 * 1024 * 1024)
    throw new Error("This backup exceeds the 512 MB import limit.");
  const data = JSON.parse(await file.text());
  if (
    data?.format !== "stakebridge-backup" ||
    data.version !== 1 ||
    !Array.isArray(data.files)
  )
    throw new Error(
      "Choose a .stakebridge.json backup exported by StakeBridge.",
    );
  validateWorkspace(data.workspace);
  const workspace: Workspace = data.workspace;
  const expected = new Map(
    workspace.stakeholders
      .flatMap((item) => item.attachments)
      .map((item) => [item.id, item]),
  );
  const files = new Map<string, Blob>();
  for (const entry of data.files) {
    const metadata = expected.get(entry?.id);
    if (!metadata || files.has(entry.id) || typeof entry.data !== "string")
      throw new Error("This backup contains invalid or duplicate attachments.");
    const bytes = Uint8Array.from(atob(entry.data), (character) =>
      character.charCodeAt(0),
    );
    if (bytes.length !== metadata.size)
      throw new Error("An attachment in this backup is incomplete.");
    files.set(entry.id, new Blob([bytes], { type: metadata.type }));
  }
  if (expected.size !== files.size)
    throw new Error("This backup is missing original attachments.");
  return { workspace, files };
}
