/**
 * Pure, source-backed derived character values.
 * Keep these calculations outside the sheet so they can be reused and tested.
 */
export function calculateDerivedStats(attributes = {}, resources = {}) {
  const might = Number(attributes.might ?? 0);
  const insight = Number(attributes.insight ?? 0);
  const shell = Number(attributes.shell ?? 0);
  const grace = Number(attributes.grace ?? 0);
  const hunger = Number(resources.hunger ?? 0);

  const safe = (value) => Number.isFinite(value) ? value : 0;

  return {
    carryingCapacity: Math.floor(safe(might)),
    maneuverability: Math.ceil(safe(grace) / 2),
    techniqueSlots: Math.floor(safe(insight)),
    beltSize: Math.floor(safe(shell)),
    satietyMax: Math.max(safe(hunger), 10)
  };
}