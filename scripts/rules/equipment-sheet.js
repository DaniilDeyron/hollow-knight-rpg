/**
 * Prepare fixed visual rows for the equipment tab.
 * Existing Item documents are kept in order; empty rows are presentation slots only.
 */
function readItemValue(item, key) {
  const aliases = {
    bulk: ["bulk", "weight"],
    protection: ["protection", "damageReduction", "dr"]
  };
  const candidates = aliases[key] ?? [key];
  for (const candidate of candidates) {
    const value = item?.system?.[candidate];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

export function buildEquipmentRows(items = [], minimumRows = 1, fields = []) {
  const documents = Array.from(items ?? []);
  const rowCount = Math.max(
    0,
    Math.min(100, Math.max(Math.floor(Number(minimumRows) || 0), documents.length))
  );

  return Array.from({ length: rowCount }, (_, index) => {
    const item = documents[index] ?? null;
    const values = {};
    for (const field of fields) values[field] = readItemValue(item, field);

    return {
      number: index + 1,
      item,
      isEmpty: !item,
      name: String(item?.name ?? ""),
      values
    };
  });
}
