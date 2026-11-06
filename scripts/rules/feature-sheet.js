/**
 * Build fixed visual rows for the Features tab.
 * Legacy embedded Items are used as a display fallback so existing names remain visible.
 */
export function buildFeatureRows(savedRows = {}, legacyItems = [], count = 1, markFields = []) {
  return Array.from({ length: count }, (_, index) => {
    const slot = `slot${index + 1}`;
    const saved = savedRows?.[slot] ?? {};
    const row = {
      slot,
      name: String(saved.name ?? "").trim() || String(legacyItems[index]?.name ?? "")
    };

    for (const field of markFields) row[field] = Boolean(saved[field]);
    return row;
  });
}

export function countFeatureMarks(rows = [], fields = []) {
  return Object.fromEntries(fields.map((field) => [
    field,
    rows.reduce((total, row) => total + (row[field] ? 1 : 0), 0)
  ]));
}

/**
 * Build the three proficiency groups shown in the Overview skill column.
 * Every group has a rank and four skills; each skill has a mastery value.
 */
export function buildSkillGroups(savedGroups = {}) {
  const toRank = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(3, Math.max(0, Math.floor(number))) : 0;
  };

  return Array.from({ length: 3 }, (_, groupIndex) => {
    const id = `group${groupIndex + 1}`;
    const savedGroup = savedGroups?.[id] ?? {};

    return {
      id,
      rank: toRank(savedGroup.rank),
      skills: Array.from({ length: 4 }, (_, skillIndex) => {
        const skillId = `skill${skillIndex + 1}`;
        const savedSkill = savedGroup.skills?.[skillId] ?? {};
        return {
          id: skillId,
          name: String(savedSkill.name ?? ""),
          mastery: toRank(savedSkill.mastery)
        };
      })
    };
  });
}
