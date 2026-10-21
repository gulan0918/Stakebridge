export const JOURNEY_STAGES = [
  "Users",
  "Research & development",
  "Production & delivery",
  "Adoption & access",
  "Use",
  "Impact & follow-up",
] as const;

const legacyDefaults = [
  "Patient",
  "R&D",
  "Manufacturing",
  "Market access & entrepreneurship",
  "Treatment",
  "Rehabilitation",
];

const aliases: Record<string, string> = Object.fromEntries(
  legacyDefaults.map((name, index) => [name, JOURNEY_STAGES[index]]),
);
aliases["Market access"] = JOURNEY_STAGES[3];

export const standardStageName = (name: string): string =>
  aliases[name] || name;

/** Upgrade only the unchanged old starter. Keep custom maps and every stage ID. */
export function upgradeDefaultStages(stages: { id: string; name: string }[]) {
  if (
    stages.length !== legacyDefaults.length ||
    !stages.every((stage, index) => stage.name === legacyDefaults[index])
  )
    return stages;
  return stages.map((stage, index) => ({
    ...stage,
    name: JOURNEY_STAGES[index],
  }));
}
