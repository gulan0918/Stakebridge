export const SECTIONS = [
  {
    key: "rationale",
    title: "Rationale",
    question: "Why are we talking to this person?",
    prompt:
      "Explain the question, knowledge gap or decision this stakeholder can help with.",
  },
  {
    key: "interview",
    title: "Stakeholder interview",
    question: "What did we learn?",
    prompt:
      "Record your questions, key insights and the stakeholder’s perspective. Add recordings or source documents below.",
  },
  {
    key: "integrate",
    title: "Integrate",
    question: "How did the conversation change the project?",
    prompt:
      "Connect feedback to a specific decision or change. If you did not act on a suggestion, explain why.",
  },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];
export type Stage = { id: string; name: string };
export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  section: SectionKey;
};
export type Stakeholder = {
  id: string;
  stageId: string;
  name: string;
  role: string;
  date: string;
  status: "draft" | "complete";
  rationale: string;
  interview: string;
  integrate: string;
  attachments: Attachment[];
  createdAt: string;
  source?: { entryId: string; url: string; revision: number };
};
export type Workspace = {
  version: 1;
  team: string;
  project: string;
  stages: Stage[];
  stakeholders: Stakeholder[];
};

export const newId = () => crypto.randomUUID();
export const defaultStages = (): Stage[] =>
  [
    "Patient",
    "R&D",
    "Manufacturing",
    "Market access & entrepreneurship",
    "Treatment",
    "Rehabilitation",
  ].map((name) => ({ id: newId(), name }));

export function newStakeholder(stageId: string): Stakeholder {
  return {
    id: newId(),
    stageId,
    name: "",
    role: "",
    date: "",
    status: "draft",
    rationale: "",
    interview: "",
    integrate: "",
    attachments: [],
    createdAt: new Date().toISOString(),
  };
}

export function completion(item: Stakeholder): number {
  return SECTIONS.filter((section) => item[section.key].trim()).length;
}

export function canComplete(item: Stakeholder): boolean {
  return !!item.name.trim() && !!item.date && completion(item) === 3;
}

export function chronological(items: Stakeholder[]): Stakeholder[] {
  return [...items].sort(
    (a, b) =>
      (a.date || "9999").localeCompare(b.date || "9999") ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.name.localeCompare(b.name),
  );
}

export function displayDate(value: string): string {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function fileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function stageProblem(stages: Stage[]): string | null {
  if (stages.length < 4 || stages.length > 8)
    return "Choose between 4 and 8 stages.";
  if (stages.some((stage) => !stage.name.trim()))
    return "Give every stage a name.";
  if (
    new Set(stages.map((stage) => stage.name.trim().toLocaleLowerCase()))
      .size !== stages.length
  )
    return "Give each stage a different name.";
  return null;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string";

/** Validate local and imported data before it can replace a workspace. */
export function validateWorkspace(value: unknown): asserts value is Workspace {
  const fail = () => {
    throw new Error(
      "This file does not contain a valid StakeBridge workspace.",
    );
  };
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !isText(value.team) ||
    !value.team.trim() ||
    !isText(value.project) ||
    !value.project.trim() ||
    !Array.isArray(value.stages) ||
    !Array.isArray(value.stakeholders)
  )
    return fail();
  const ids = new Set<string>();
  const uniqueId = (id: unknown) => {
    if (!isText(id) || !id || ids.has(id)) return false;
    ids.add(id);
    return true;
  };
  for (const stage of value.stages) {
    if (!isObject(stage) || !uniqueId(stage.id) || !isText(stage.name))
      return fail();
  }
  if (stageProblem(value.stages as Stage[])) return fail();
  const stages = new Set(value.stages.map((stage: Stage) => stage.id));
  for (const item of value.stakeholders) {
    if (
      !isObject(item) ||
      !uniqueId(item.id) ||
      !isText(item.stageId) ||
      !stages.has(item.stageId) ||
      ![
        "name",
        "role",
        "date",
        "rationale",
        "interview",
        "integrate",
        "createdAt",
      ].every((key) => isText(item[key])) ||
      !["draft", "complete"].includes(String(item.status)) ||
      !Array.isArray(item.attachments)
    )
      return fail();
    if (
      item.date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(String(item.date)) ||
        !Number.isFinite(Date.parse(`${item.date}T12:00:00Z`)) ||
        new Date(`${item.date}T12:00:00Z`).toISOString().slice(0, 10) !==
          item.date)
    )
      return fail();
    if (!Number.isFinite(Date.parse(String(item.createdAt)))) return fail();
    if (
      item.source !== undefined &&
      (!isObject(item.source) ||
        !isText(item.source.entryId) ||
        !isText(item.source.url) ||
        !item.source.url.startsWith("https://") ||
        !Number.isSafeInteger(item.source.revision))
    )
      return fail();
    for (const file of item.attachments) {
      if (
        !isObject(file) ||
        !uniqueId(file.id) ||
        !isText(file.name) ||
        !isText(file.type) ||
        typeof file.size !== "number" ||
        !Number.isSafeInteger(file.size) ||
        file.size < 0 ||
        !SECTIONS.some((section) => section.key === file.section)
      )
        return fail();
    }
    if (
      item.status === "complete" &&
      !canComplete(item as unknown as Stakeholder)
    )
      return fail();
  }
}

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const safeFilename = (name: string) =>
  name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .slice(0, 100)
    .trim() || "StakeBridge";
