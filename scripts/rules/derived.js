/**
 * Pure, source-backed derived character values.
 * Keep these calculations outside the sheet so they can be reused and tested.
 */
export function calculateDerivedStats(attributes = {}, resources = {}, overrides = {}) {
  const might = Number(attributes.might ?? 0);
  const insight = Number(attributes.insight ?? 0);
  const shell = Number(attributes.shell ?? 0);
  const techniqueSlotsBonus = Number(overrides.techniqueSlotsBonus ?? resources.techniqueSlotsBonus ?? 0);
  const grace = Number(attributes.grace ?? 0);
  const hunger = Number(resources.hunger ?? 0);
  const pathRanks = Number(overrides.pathRanks ?? 0);
  const notchBonus = Number(overrides.notchBonus ?? resources.notchesBonus ?? 0);

  const safe = (value) => Number.isFinite(value) ? value : 0;

  return {
    carryingCapacity: Math.floor(safe(might)),
    maneuverability: overrides.maneuverability == null
      ? Math.ceil(safe(grace) / 2)
      : Math.floor(Math.max(0, safe(Number(overrides.maneuverability)))),
    techniqueSlots: Math.max(0, Math.floor(safe(insight)) + Math.floor(Math.max(0, safe(techniqueSlotsBonus)))),
    beltSize: Math.floor(safe(shell)),
    satietyMax: overrides.satietyMax == null
      ? Math.max(safe(hunger), 10)
      : Math.floor(Math.max(0, safe(Number(overrides.satietyMax)))),
    notchesMax: Math.max(0, 3 + Math.floor(Math.max(0, safe(pathRanks))) + Math.floor(Math.max(0, safe(notchBonus))))
  };
}