export const ROLE_TAGS = [
  "Users & beneficiaries",
  "Experts & researchers",
  "Producers & providers",
  "Partners & funders",
  "Decision-makers",
  "Implementers & operators",
  "Communities & advocates",
  "Evaluators",
] as const;

export const PROJECT_FIELDS = [
  "Health & wellbeing",
  "Environment & sustainability",
  "Education & learning",
  "Food & agriculture",
  "Industry & materials",
  "Digital tools & services",
  "Public services & society",
] as const;

export function splitTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}
