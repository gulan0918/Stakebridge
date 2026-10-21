import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import {
  validateWorkspace,
  newStakeholder,
  defaultStages,
  chronological,
} from "../src/components/stakebridge/model.ts";
import {
  loadWorkspace,
  saveWorkspace,
  loadFile,
  createBackup,
  readBackup,
} from "../src/components/stakebridge/storage.ts";
import { exportWord } from "../src/components/stakebridge/word.ts";
import { validateRegistry, openToContact } from "../src/registry/schema.ts";

const seed = JSON.parse(
  await readFile(
    new URL("../public/registry/entries.json", import.meta.url),
    "utf8",
  ),
);
function fixture() {
  const stages = defaultStages();
  return {
    version: 1,
    team: "Test team",
    project: "中文 & <Project>",
    stages,
    stakeholders: [
      {
        ...newStakeholder(stages[0].id),
        name: "Late interview",
        date: "2026-10-20",
        status: "complete",
        rationale: "Why & <who>",
        interview: "What we learned\nSecond paragraph",
        integrate: "Our project changed.",
      },
      {
        ...newStakeholder(stages[0].id),
        name: "Early interview",
        date: "2026-02-01",
      },
      { ...newStakeholder(stages[0].id), name: "Undated draft" },
    ],
  };
}

test("registry entries, sources and collection references are valid", () =>
  validateRegistry(seed));
test("duplicate IDs and missing pathway members are rejected", () => {
  const duplicate = structuredClone(seed);
  duplicate.entries.push(duplicate.entries[0]);
  assert.throws(() => validateRegistry(duplicate), /duplicate ID/);
  const dangling = structuredClone(seed);
  dangling.entries.push({
    ...structuredClone(seed.entries[0]),
    id: "SB_100001",
    kind: "pathway",
    stages: ["Patient", "R&D", "Manufacturing", "Treatment"],
    members: ["SB_999999"],
  });
  assert.throws(() => validateRegistry(dangling), /missing member/);
});
test("public contact links retain provenance and reject unsafe URLs", () => {
  const invalid = structuredClone(seed);
  const entry = invalid.entries.find((item) => item.publicContacts?.length);
  entry.publicContacts[0].source = "";
  assert.throws(() => validateRegistry(invalid), /source and verification/);
  entry.publicContacts[0].source = "https://example.org/profile";
  entry.publicContacts[0].url = "javascript:alert(1)";
  assert.throws(() => validateRegistry(invalid), /invalid public contact/);
  assert.equal(seed.entries.length, 36);
  assert.ok(
    seed.entries.every(
      (item) => item.interview?.length && item.source.includes("/-/blob/"),
    ),
  );
  const patients = seed.entries.filter((item) =>
    item.stages.includes("Patient"),
  );
  assert.equal(patients.length, 3);
  assert.ok(
    patients.every(
      (item) =>
        item.publicContacts.length === 0 &&
        item.materials.every((material) => material.kind !== "photo"),
    ),
  );
});
test("an interview cannot imply consent, and expired permission is not discoverable", () => {
  assert.equal(
    seed.entries.some((entry) => openToContact(entry)),
    false,
  );
  const invalid = structuredClone(seed);
  invalid.entries[0].contact.availability = "open";
  assert.throws(() => validateRegistry(invalid), /requires/);
  invalid.entries[0].contact = {
    availability: "open",
    channel: "https://example.org/contact",
    consentSource: "https://example.org/permission",
    expires: "2026-10-01",
  };
  validateRegistry(invalid);
  assert.equal(openToContact(invalid.entries[0], "2026-10-21"), false);
  assert.equal(openToContact(invalid.entries[0], "2026-09-21"), true);
});
test("workspace imports reject dangling stages, impossible dates and false completion", () => {
  validateWorkspace(fixture());
  const dangling = fixture();
  dangling.stakeholders[0].stageId = "missing";
  assert.throws(() => validateWorkspace(dangling));
  const invalidDate = fixture();
  invalidDate.stakeholders[0].date = "2026-02-30";
  assert.throws(() => validateWorkspace(invalidDate));
  const incomplete = fixture();
  incomplete.stakeholders[0].integrate = "";
  assert.throws(() => validateWorkspace(incomplete));
  const outsideBounds = fixture();
  outsideBounds.stages = outsideBounds.stages.slice(0, 3);
  assert.throws(() => validateWorkspace(outsideBounds));
});
test("interviews export chronologically and undated drafts come last", () => {
  assert.deepEqual(
    chronological(fixture().stakeholders).map((item) => item.name),
    ["Early interview", "Late interview", "Undated draft"],
  );
});

function unzipStored(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = new Map();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    assert.equal(view.getUint16(offset + 8, true), 0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const name = new TextDecoder().decode(
      bytes.subarray(offset + 30, offset + 30 + nameLength),
    );
    const start = offset + 30 + nameLength;
    entries.set(
      name,
      new TextDecoder().decode(bytes.subarray(start, start + size)),
    );
    offset = start + size;
  }
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  return entries;
}
test("Word is a DOCX package with real heading styles, escaped Unicode text and draft controls", async () => {
  const blob = exportWord(fixture(), true);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const parts = unzipStored(bytes);
  assert.equal(parts.size, 5);
  const xml = parts.get("word/document.xml");
  assert.match(xml, /中文 &amp; &lt;Project&gt;/);
  for (const style of ["Heading1", "Heading2", "Heading3"])
    assert.match(xml, new RegExp(`w:val="${style}"`));
  assert.ok(xml.indexOf("Early interview") < xml.indexOf("Late interview"));
  assert.ok(xml.indexOf("Late interview") < xml.indexOf("Undated draft"));
  assert.match(parts.get("word/styles.xml"), /w:outlineLvl w:val="2"/);
  const completeOnly = unzipStored(
    new Uint8Array(await exportWord(fixture(), false).arrayBuffer()),
  ).get("word/document.xml");
  assert.doesNotMatch(completeOnly, /Early interview|Undated draft/);
  await mkdir(new URL("../output/verification/", import.meta.url), {
    recursive: true,
  });
  await writeFile(
    new URL("../output/verification/sample-report.docx", import.meta.url),
    bytes,
  );
});
test("IndexedDB round-trip, full backup and restore retain original attachment bytes", async () => {
  globalThis.FileReader = class {
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((data) => {
          this.result = `data:${blob.type};base64,${Buffer.from(data).toString("base64")}`;
          this.onload();
        })
        .catch((error) => {
          this.error = error;
          this.onerror();
        });
    }
  };
  const workspace = fixture();
  const attachment = {
    id: crypto.randomUUID(),
    name: "interview.txt",
    type: "text/plain",
    size: 12,
    section: "interview",
  };
  workspace.stakeholders[0].attachments.push(attachment);
  await saveWorkspace(
    workspace,
    new Map([
      [attachment.id, new Blob(["source bytes"], { type: "text/plain" })],
    ]),
  );
  assert.deepEqual(await loadWorkspace(), workspace);
  assert.equal(await (await loadFile(attachment.id)).text(), "source bytes");
  const backup = await createBackup(workspace, loadFile);
  const restored = await readBackup(
    new File([backup], "workspace.stakebridge.json"),
  );
  assert.deepEqual(restored.workspace, workspace);
  assert.equal(await restored.files.get(attachment.id).text(), "source bytes");
  const corrupt = JSON.parse(await backup.text());
  corrupt.files = [];
  await assert.rejects(
    readBackup(new File([JSON.stringify(corrupt)], "bad.json")),
    /missing original attachments/,
  );
  workspace.stakeholders[0].attachments = [];
  await saveWorkspace(workspace, new Map(), new Set([attachment.id]));
  await assert.rejects(loadFile(attachment.id), /missing/);
});
