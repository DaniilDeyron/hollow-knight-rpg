/**
 * Build a read-only world Item used as the rule reference for a combat status.
 * These Items never apply ActiveEffects; activation stays in Foundry's Token HUD.
 */
export function buildStatusItemData(definition) {
  if (!definition?.id || !definition?.name) {
    throw new TypeError("A status definition with id and name is required.");
  }

  const page = Number(definition.page ?? 0);
  const source = page > 0
    ? `The Unofficial Hollow Knight RPG, русский перевод v1.8, с. ${page}`
    : String(definition.source ?? "");

  return {
    name: String(definition.name),
    type: "status",
    img: String(definition.icon ?? "icons/svg/aura.svg"),
    system: {
      statusId: String(definition.id),
      summary: String(definition.summary ?? ""),
      rules: String(definition.rules ?? ""),
      duration: String(definition.duration ?? ""),
      source,
      page: Number.isInteger(page) ? page : 0,
      bookVersion: "1.8"
    },
    flags: {
      hkrpg: {
        statusReferenceId: String(definition.id),
        statusReferenceVersion: 1
      }
    }
  };
}

export function findStatusReferenceItem(items, statusId) {
  const collection = Array.isArray(items) ? items : items?.contents ?? [...(items ?? [])];
  return collection.find((item) =>
    item?.type === "status" &&
    item?.getFlag?.("hkrpg", "statusReferenceId") === statusId
  ) ?? null;
}
