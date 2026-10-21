export type RegistryEntry = {
  id: string;
  revision: number;
  kind: "stakeholder" | "role" | "pathway";
  title: string;
  role: string;
  organisation: string;
  domain: string;
  stages: string[];
  tags: string[];
  roleTags?: string[];
  summary: string;
  rationale: string;
  interview?: string;
  interviewDate?: string;
  topic?: string;
  sourceStage?: string;
  materials?: {
    label: string;
    url: string;
    kind: "photo" | "document" | "page";
  }[];
  publicContacts?: {
    label: string;
    kind: "email" | "website" | "phone";
    value: string;
    url: string;
    source: string;
    checkedOn: string;
  }[];
  contactReview?: {
    status: "found" | "not_found" | "not_sought" | "identity_uncertain";
    note: string;
    checkedOn: string;
  };
  questions: string[];
  integration: string;
  limitations: string;
  contributor: string;
  updated: string;
  source: string;
  members: string[];
  contact: {
    availability: "unrecorded" | "open" | "closed";
    channel: string;
    consentSource: string;
    expires: string;
  };
  experiences: {
    team: string;
    year: number;
    summary: string;
    source: string;
  }[];
};
export type Registry = {
  schemaVersion: 1;
  updated: string;
  entries: RegistryEntry[];
};
const text = (value: unknown): value is string => typeof value === "string";
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(text);
const https = (value: unknown): boolean => {
  if (!text(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
const date = (value: unknown): boolean =>
  text(value) &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;

/** Also used by CI: registry merges cannot silently publish incomplete contact permission. */
export function validateRegistry(value: unknown): asserts value is Registry {
  function fail(message: string): never {
    throw new Error(`Registry validation: ${message}`);
  }
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !date(value.updated) ||
    !Array.isArray(value.entries)
  )
    fail("invalid document header");
  const ids = new Set<string>();
  for (const entry of value.entries) {
    if (!object(entry)) fail("invalid entry");
    if (!text(entry.id) || !/^SB_\d{6}$/.test(entry.id) || ids.has(entry.id))
      fail("invalid or duplicate ID");
    ids.add(entry.id);
    if (!Number.isSafeInteger(entry.revision) || Number(entry.revision) < 1)
      fail(`${entry.id}: invalid revision`);
    if (!["stakeholder", "role", "pathway"].includes(String(entry.kind)))
      fail(`${entry.id}: invalid kind`);
    for (const key of [
      "title",
      "role",
      "domain",
      "summary",
      "rationale",
      "integration",
      "limitations",
      "contributor",
    ])
      if (!text(entry[key]) || !entry[key].trim())
        fail(`${entry.id}: missing ${key}`);
    if (
      !text(entry.organisation) ||
      !date(entry.updated) ||
      !https(entry.source)
    )
      fail(`${entry.id}: invalid source or date`);
    if (
      !strings(entry.stages) ||
      !entry.stages.length ||
      !strings(entry.tags) ||
      !strings(entry.questions) ||
      (!entry.questions.length &&
        !(text(entry.interview) && entry.interview.trim())) ||
      !strings(entry.members)
    )
      fail(`${entry.id}: invalid categories`);
    if (new Set(entry.members).size !== entry.members.length)
      fail(`${entry.id}: duplicate member`);
    for (const key of ["stages", "tags", "roleTags"]) {
      const tags = entry[key];
      if (key === "roleTags" && tags === undefined) continue;
      if (
        !strings(tags) ||
        tags.some((tag) => !tag.trim() || tag !== tag.trim()) ||
        new Set(tags).size !== tags.length ||
        (key !== "tags" && !tags.length)
      )
        fail(`${entry.id}: invalid ${key}`);
    }
    for (const key of ["topic", "interviewDate", "sourceStage"]) {
      if (entry[key] !== undefined && !text(entry[key]))
        fail(`${entry.id}: invalid ${key}`);
    }
    if (entry.interview !== undefined && !text(entry.interview))
      fail(`${entry.id}: invalid interview`);
    if (entry.materials !== undefined) {
      if (!Array.isArray(entry.materials))
        fail(`${entry.id}: invalid materials`);
      for (const material of entry.materials) {
        if (
          !object(material) ||
          !text(material.label) ||
          !https(material.url) ||
          !["photo", "document", "page"].includes(String(material.kind))
        )
          fail(`${entry.id}: invalid material source`);
      }
    }
    if (entry.publicContacts !== undefined) {
      if (!Array.isArray(entry.publicContacts))
        fail(`${entry.id}: invalid public contacts`);
      for (const channel of entry.publicContacts) {
        if (
          !object(channel) ||
          !text(channel.label) ||
          !text(channel.value) ||
          !https(channel.source) ||
          !date(channel.checkedOn)
        )
          fail(
            `${entry.id}: public contact needs a source and verification date`,
          );
        const valid =
          channel.kind === "website"
            ? https(channel.url)
            : channel.kind === "email"
              ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(channel.value) &&
                channel.url === `mailto:${channel.value}`
              : channel.kind === "phone"
                ? /^\+?[\d\s()-]{5,30}$/.test(channel.value) &&
                  channel.url === `tel:${channel.value.replace(/[^+\d]/g, "")}`
                : false;
        if (!valid) fail(`${entry.id}: invalid public contact channel`);
      }
    }
    if (entry.contactReview !== undefined) {
      const review = entry.contactReview;
      if (
        !object(review) ||
        !["found", "not_found", "not_sought", "identity_uncertain"].includes(
          String(review.status),
        ) ||
        !text(review.note) ||
        !date(review.checkedOn)
      )
        fail(`${entry.id}: invalid contact review`);
    }
    const contact = entry.contact;
    if (
      !object(contact) ||
      !["unrecorded", "open", "closed"].includes(
        String(contact.availability),
      ) ||
      !["channel", "consentSource", "expires"].every((key) =>
        text(contact[key]),
      )
    )
      fail(`${entry.id}: invalid contact permission`);
    if (
      contact.availability === "open" &&
      (!https(contact.channel) ||
        !https(contact.consentSource) ||
        !date(contact.expires))
    )
      fail(
        `${entry.id}: open contact requires an authorised HTTPS channel, consent evidence and an expiry date`,
      );
    if (!Array.isArray(entry.experiences))
      fail(`${entry.id}: invalid experience records`);
    for (const experience of entry.experiences) {
      if (
        !object(experience) ||
        !text(experience.team) ||
        !experience.team.trim() ||
        !text(experience.summary) ||
        !experience.summary.trim() ||
        !Number.isInteger(experience.year) ||
        Number(experience.year) < 2000 ||
        !https(experience.source)
      )
        fail(`${entry.id}: invalid experience evidence`);
    }
  }
  for (const entry of value.entries as RegistryEntry[]) {
    if (entry.kind !== "pathway" && entry.members.length)
      fail(`${entry.id}: only pathways may contain members`);
    if (
      entry.kind === "pathway" &&
      (entry.stages.length < 4 ||
        entry.stages.length > 8 ||
        !entry.members.length)
    )
      fail(`${entry.id}: a pathway needs 4–8 stages and at least one member`);
    for (const member of entry.members) {
      const target = (value.entries as RegistryEntry[]).find(
        (item) => item.id === member,
      );
      if (!target || target.kind === "pathway")
        fail(`${entry.id}: missing member or nested pathway`);
    }
  }
}

export function openToContact(
  entry: RegistryEntry,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  return (
    entry.contact.availability === "open" && entry.contact.expires >= today
  );
}

export const REPOSITORY = "https://github.com/gulan0918/Stakebridge";
export const kindLabel = {
  stakeholder: "Stakeholder",
  role: "Role guide",
  pathway: "Pathway collection",
};
