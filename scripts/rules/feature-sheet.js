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
      name: String(savedGroup.name ?? ""),
      rank: toRank(savedGroup.rank),
      masterySkill: String(savedGroup.masterySkill ?? ""),
      canMaster: toRank(savedGroup.rank) === 3,
      skills: Array.from({ length: 4 }, (_, skillIndex) => {
        const skillId = `skill${skillIndex + 1}`;
        const savedSkill = savedGroup.skills?.[skillId] ?? {};
        return {
          id: skillId,
          name: String(savedSkill.name ?? ""),
          mastery: toRank(savedSkill.mastery),
          isMastered: savedGroup.masterySkill
            ? savedGroup.masterySkill === skillId
            : toRank(savedSkill.mastery) >= 3 && toRank(savedGroup.rank) === 3
        };
      })
    };
  });
}

function numeric(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatSigned(value) {
  const number = numeric(value);
  if (number === 0) return "0";
  const rounded = Math.round(number * 2) / 2;
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

export function buildTraitTree(items = []) {
  const nodes = (items ?? []).map((item) => ({
    id: item.id,
    name: String(item.name ?? ""),
    kind: item.system?.kind ?? "main",
    category: item.system?.category ?? "unassigned",
    categoryLabel: ({
      naturalWeapon: "Природное оружие",
      characteristics: "Характеристики",
      mind: "Разум",
      physiological: "Физиология",
      senses: "Чувства",
      mystical: "Мистика",
      body: "Тело",
      movement: "Движение",
      naturalDefense: "Природная защита",
      unassigned: "Категория не выбрана"
    })[item.system?.category ?? "unassigned"] ?? "Собственная черта",
    parentId: String(item.system?.parentId ?? ""),
    slot: Math.max(0, Math.min(7, Math.floor(numeric(item.system?.slot)))),
    img: String(item.img ?? ""),
    hunger: numeric(item.system?.hunger),
    cute: numeric(item.system?.cute),
    spook: numeric(item.system?.spook),
    hungerLabel: formatSigned(item.system?.hunger),
    cuteLabel: formatSigned(item.system?.cute),
    spookLabel: formatSigned(item.system?.spook),
    children: []
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const roots = [];

  for (const node of nodes) {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  const categoryOrder = [
    "naturalWeapon",
    "characteristics",
    "mind",
    "physiological",
    "senses",
    "mystical",
    "body",
    "movement",
    "naturalDefense",
    "custom",
    "unassigned"
  ];
  const categoryIndex = new Map(categoryOrder.map((category, index) => [category, index]));
  roots.sort((a, b) =>
    (categoryIndex.get(a.category) ?? 99) - (categoryIndex.get(b.category) ?? 99) ||
    a.name.localeCompare(b.name, "ru")
  );
  const sortChildren = (entries) => {
    entries.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    for (const entry of entries) sortChildren(entry.children);
  };
  for (const root of roots) sortChildren(root.children);

  const all = [];
  const flatten = (entries) => {
    for (const entry of entries) {
      all.push(entry);
      flatten(entry.children);
    }
  };
  flatten(roots);

  const totals = all.reduce((sum, trait) => ({
    hunger: sum.hunger + trait.hunger,
    cute: sum.cute + trait.cute,
    spook: sum.spook + trait.spook
  }), { hunger: 0, cute: 0, spook: 0 });

  return {
    roots,
    count: nodes.filter((trait) => trait.kind === "main").length,
    total: all.length,
    totals: {
      ...totals,
      hungerLabel: formatSigned(totals.hunger),
      cuteLabel: formatSigned(totals.cute),
      spookLabel: formatSigned(totals.spook)
    }
  };
}

export function summarizePaths(items = []) {
  const paths = (items ?? []).map((item) => {
    const rank = Math.min(3, Math.max(1, Math.floor(numeric(item.system?.rank) || 1)));
    const kind = item.system?.pathType ?? "unassigned";
    const assigned = kind === "martial" || kind === "mystic";
    return {
      id: item.id,
      name: String(item.name ?? ""),
      rank,
      kind,
      assigned,
      kindLabel: kind === "martial" ? "Военный" : kind === "mystic" ? "Мистический" : "Тип не выбран",
      rankLabel: `Ранг ${rank}`
    };
  });
  const totals = paths.reduce((sum, path) => {
    // A Path only grants benefits after its type is selected.
    if (path.assigned) sum.totalRanks += path.rank;
    if (path.kind === "martial") sum.martialRanks += path.rank;
    if (path.kind === "mystic") sum.mysticRanks += path.rank;
    return sum;
  }, { totalRanks: 0, martialRanks: 0, mysticRanks: 0 });

  return {
    paths,
    ...totals,
    count: paths.length,
    assignedCount: paths.filter((path) => path.assigned).length,
    unassignedCount: paths.filter((path) => !path.assigned).length,
    soulBonus: totals.mysticRanks,
    staminaBonus: totals.martialRanks
  };
}

function normalizedItemName(value) {
  return String(value ?? "").trim().normalize("NFC").toLocaleLowerCase("ru");
}

function excludeExistingItemNames(rows, existingItems = []) {
  const names = new Set((existingItems ?? []).map((item) => normalizedItemName(item?.name)));
  return rows.filter((row) => !names.has(normalizedItemName(row.name)));
}

export function buildLegacyTraitRows(savedRows = {}, existingItems = []) {
  const rows = Object.entries(savedRows ?? {}).map(([slot, row]) => ({
    slot,
    name: String(row?.name ?? "").trim(),
    attraction: Boolean(row?.attraction),
    spook: Boolean(row?.spook),
    hunger: Boolean(row?.hunger)
  })).filter((row) => row.name);
  return excludeExistingItemNames(rows, existingItems);
}

export function buildLegacyPathRows(savedRows = {}, existingItems = []) {
  const rows = Object.entries(savedRows ?? {}).map(([slot, row]) => {
    const rank = ["rank1", "rank2", "rank3"].filter((key) => Boolean(row?.[key])).length;
    return { slot, name: String(row?.name ?? "").trim(), rank };
  }).filter((row) => row.name);
  return excludeExistingItemNames(rows, existingItems);
}

export function buildTechniqueSlots(savedRows = {}, slotCount = 0) {
  const count = Math.max(0, Math.min(9, Math.floor(numeric(slotCount))));
  return Array.from({ length: count }, (_, index) => {
    const slot = `slot${index + 1}`;
    const saved = savedRows?.[slot] ?? {};
    return {
      slot,
      number: index + 1,
      name: String(saved.name ?? ""),
      type: saved.kind === "arcana" ? "arcana" : "art",
      typeLabel: saved.kind === "arcana" ? "Тайна" : "Искусство"
    };
  });
}

export function summarizeProficiencySkillDice(groups = []) {
  const dice = {};
  for (const group of groups ?? []) {
    const rank = Math.min(3, Math.max(0, Math.floor(numeric(group.rank))));
    for (const skill of group.skills ?? []) {
      const name = String(skill.name ?? "").trim().toLocaleLowerCase("ru");
      if (!name || rank === 0) continue;
      dice[name] = Math.min(3, (dice[name] ?? 0) + rank);
    }
  }
  return dice;
}


/**
 * Prepare the fixed technique grid. A prepared Item occupies its saved slot;
 * legacy text entries remain visible until they are migrated to Item documents.
 */
export function buildTechniqueSlotCards(maximum = 0, items = [], legacySlots = []) {
  const count = Math.max(0, Math.min(9, Math.floor(numeric(maximum))));
  const techniques = (items ?? []).filter((item) => item?.type === "technique");
  return Array.from({ length: count }, (_, index) => {
    const slotNumber = index + 1;
    const item = techniques.find((candidate) =>
      Math.floor(numeric(candidate.system?.preparedSlot)) === slotNumber
    ) ?? null;
    const legacy = item ? null : (legacySlots ?? []).find((entry) =>
      Number(entry.number) === slotNumber && String(entry.name ?? "").trim()
    ) ?? null;
    return {
      number: slotNumber,
      item,
      legacy,
      isEmpty: !item && !legacy
    };
  });
}


/**
 * Build seven fixed Trait drop targets. Existing Items without an explicit slot
 * keep their current visibility and are assigned to the first available target.
 * Legacy text-only traits remain visible until converted into Item documents.
 */
export function buildTraitCardSlots(maximum = 7, traitTree = {}, legacyTraits = []) {
  const count = Math.max(0, Math.min(7, Math.floor(numeric(maximum))));
  const slots = Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    trait: null,
    legacy: null,
    isEmpty: true
  }));
  const roots = Array.isArray(traitTree?.roots) ? traitTree.roots : [];
  const assigned = new Set();

  for (const trait of roots) {
    const slot = Math.floor(numeric(trait.slot));
    if (slot < 1 || slot > count || slots[slot - 1].trait) continue;
    slots[slot - 1].trait = trait;
    slots[slot - 1].isEmpty = false;
    assigned.add(trait.id);
  }

  for (const trait of roots) {
    if (assigned.has(trait.id)) continue;
    const target = slots.find((entry) => entry.isEmpty);
    if (!target) break;
    target.trait = trait;
    target.isEmpty = false;
    assigned.add(trait.id);
  }

  for (const legacy of legacyTraits ?? []) {
    const target = slots.find((entry) => entry.isEmpty);
    if (!target) break;
    target.legacy = legacy;
    target.isEmpty = false;
  }

  return slots;
}
