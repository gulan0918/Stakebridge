import { readFile } from "node:fs/promises";
import { validateRegistry, openToContact } from "../src/registry/schema.ts";

const registry = JSON.parse(
  await readFile(
    new URL("../public/registry/entries.json", import.meta.url),
    "utf8",
  ),
);
validateRegistry(registry);
console.log(
  `Registry valid: ${registry.entries.length} unique entries, ${registry.entries.filter((entry) => openToContact(entry)).length} active authorised contact channels.`,
);
