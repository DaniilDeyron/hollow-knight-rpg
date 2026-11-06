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
