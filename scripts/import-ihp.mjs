// Convert an explicitly supplied IHP TSX source snapshot without executing it.
// Usage: node scripts/import-ihp.mjs source.tsx <source-commit> [YYYY-MM-DD]
import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
const [filename, revision, checkedOn = new Date().toISOString().slice(0, 10)] =
  process.argv.slice(2);
if (!filename || !/^[a-f0-9]{7,40}$/.test(revision || ""))
  throw new Error("Supply an IHP TSX snapshot and its Git commit.");
const input = ts.createSourceFile(
  "ihp.tsx",
  await readFile(filename, "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const sourceBase = `https://gitlab.igem.org/2026/zju-china/-/blob/${revision}/src/contents/human-practices.tsx`;
const wiki = "https://2026.igem.wiki/zju-china/human-practices";
const overrides = JSON.parse(
  await readFile(
    new URL("../public/registry/contact-sources.json", import.meta.url),
    "utf8",
  ),
);
const fixed = new Map([
  ["Prof. Ouyang Hongwei", 1],
  ["Dr. Qiu Xiaoming", 2],
  ["Prof. Huang Wenwen", 3],
  ["Beijing Weixinkang", 4],
  ["Dr. Huang Jun", 5],
]);
const stages = {
  Patient: "Patient",
  "R&D": "R&D",
  Treatment: "Treatment",
  Manufacturing: "Manufacturing",
  "Market access": "Market access",
  Rehabilitation: "Rehabilitation",
};
const roles = {
  Patient: "Patient perspective",
  "R&D": "Research",
  Treatment: "Clinical practice",
  Manufacturing: "Manufacturing",
  "Market access": "Translation & access",
  Rehabilitation: "Rehabilitation & society",
};
function plain(node) {
  if (!node) return "";
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isJsxText(node)) return node.text.replace(/\s+/g, " ");
  if (ts.isJsxExpression(node)) return plain(node.expression);
  if (ts.isJsxFragment(node) || ts.isJsxElement(node))
    return node.children.map(plain).join("");
  throw new Error(`Unsupported interview content: ${ts.SyntaxKind[node.kind]}`);
}
function linkedMaterials(node) {
  const links = [];
  function visit(n) {
    if (ts.isJsxElement(n)) {
      const attr = n.openingElement.attributes.properties.find(
        (p) => ts.isJsxAttribute(p) && p.name.getText(input) === "href",
      );
      if (attr?.initializer && ts.isStringLiteral(attr.initializer)) {
        const raw = attr.initializer.text;
        const url = raw.startsWith("#")
          ? wiki + raw
          : raw.startsWith("/")
            ? "https://2026.igem.wiki" + raw
            : raw;
        if (url.startsWith("https://"))
          links.push({
            label: plain(n).replace(/\s+/g, " ").trim() || "IHP material",
            url,
            kind: "page",
          });
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(node);
  return links;
}
const entries = [];
let next = 6;
let patient = 0;
function visit(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(input) === "stakeholder"
  ) {
    const args = node.arguments;
    const [
      date,
      stage,
      originalTitle,
      summary,
      rationale,
      interview,
      integration,
    ] = args.slice(0, 7).map((arg) => plain(arg).replace(/\s+/g, " ").trim());
    const [name, topic = ""] = originalTitle.split(" — ");
    const line = input.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const source = `${sourceBase}#L${line}`;
    const isPatient = stage === "Patient";
    const number = fixed.get(name) || next++;
    let title = name;
    let texts = { summary, rationale, interview, integration };
    if (isPatient) {
      patient++;
      title = [
        "Patient interview — competitive tennis player",
        "Patient interviews — post-operative experiences",
        "Patient interview — rural access to care",
      ][patient - 1];
      const replacements = {
        "Xuan Ge": "the participant",
        "Yue Wang": "one participant",
        "Yu Xu": "one participant",
        "Fangrui Liang": "another participant",
        "Grandpa Gu": "the participant",
      };
      for (const [key, value] of Object.entries(texts)) {
        texts[key] = Object.entries(replacements).reduce(
          (result, [from, to]) => result.replaceAll(from, to),
          value,
        );
      }
    }
    const extra = overrides[name] || {};
    const materials = linkedMaterials(args[6]);
    if (args[7]?.text && !isPatient)
      materials.unshift({
        label: "Interview photograph",
        kind: "photo",
        url: `https://static.igem.wiki/teams/6102/wiki/images/engagement/ihp/${args[7].text}.avif`,
      });
    if (name === "Zhang Binghong")
      materials.push(
        {
          label: "Cartilage-health report",
          kind: "document",
          url: "https://static.igem.wiki/teams/6102/wiki/hp-file/res.pdf",
        },
        {
          label: "Health Commission reply",
          kind: "document",
          url: "https://static.igem.wiki/teams/6102/wiki/hp-file/gov.pdf",
        },
      );
    entries.push({
      id: `SB_${String(number).padStart(6, "0")}`,
      revision: 1,
      kind: "stakeholder",
      title,
      topic,
      role: extra.role || roles[stage],
      organisation: extra.organisation || "",
      domain: "Biomedical materials",
      stages: [stages[stage]],
      tags: [topic, roles[stage]].filter(Boolean),
      ...texts,
      interviewDate: date,
      questions: [],
      limitations:
        "This is ZJU-China’s account of its own engagement. Dates and outcomes are retained as recorded in the IHP source.",
      contributor: "ZJU-China 2026",
      updated: checkedOn,
      source,
      members: [],
      materials,
      publicContacts: isPatient ? [] : extra.channels || [],
      contactReview: {
        status: isPatient
          ? "not_sought"
          : extra.status || (extra.channels?.length ? "found" : "not_found"),
        note: isPatient
          ? "Patient contacts are not published."
          : extra.note ||
            "No matching public professional contact has been confirmed.",
        checkedOn,
      },
      contact: {
        availability: "unrecorded",
        channel: "",
        consentSource: "",
        expires: "",
      },
      experiences: [
        { team: "ZJU-China", year: 2026, summary: texts.integration, source },
      ],
    });
  }
  ts.forEachChild(node, visit);
}
visit(input);
await writeFile(
  new URL("../public/registry/entries.json", import.meta.url),
  JSON.stringify({ schemaVersion: 1, updated: checkedOn, entries }, null, 2) +
    "\n",
);
console.log(
  `Imported ${entries.length} IHP records with source links and ${entries.reduce((n, e) => n + (e.publicContacts?.length || 0), 0)} sourced contact channels.`,
);
