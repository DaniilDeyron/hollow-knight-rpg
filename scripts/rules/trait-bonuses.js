const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function resolveActiveTraitItems(items = []) {
  const traits = (items ?? []).filter((item) => item.type === "trait");
  const byId = new Map(traits.map((item) => [item.id, item]));
  const active = [];
  const isActive = (item, visited = new Set()) => {
    if (!item || visited.has(item.id) || item.system?.selected === false) return false;
    visited.add(item.id);
    const parentId = String(item.system?.parentId ?? "");
    if (!parentId) return item.system?.kind === "main";
    const parent = byId.get(parentId);
    return Boolean(parent && isActive(parent, visited));
  };
  for (const item of traits) if (isActive(item)) active.push(item);
  return active;
}

export function calculateTraitBonuses(items = []) {
  const active = resolveActiveTraitItems(items);
  return active.reduce((sum, item) => {
    const system = item.system ?? {};
    for (const key of ["might","insight","shell","grace","heartMax","staminaMax","soulMax","satietyMax","hunger","cute","spook"]) {
      sum[key] += number(system[key]);
    }
    return sum;
  }, {
    might:0, insight:0, shell:0, grace:0, heartMax:0,
    staminaMax:0, soulMax:0, satietyMax:0, hunger:0, cute:0, spook:0
  });
}

export function canSelectTraitChild(parent, child) {
  return Boolean(parent && child && parent.type === "trait" && child.type === "trait" &&
    parent.system?.selected !== false &&
    String(child.system?.parentId ?? "") === String(parent.id));
}
