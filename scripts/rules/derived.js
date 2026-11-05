/**
 * Pure calculations shared by the Foundry data model and automated tests.
 *
 * These two formulas are the first derived values implemented from the
 * reference rules. Additional rules should be added only after their exact
 * wording and edge cases have been checked against the sourcebook.
 */
export function calculateDerivedStats(attributes = {}) {
  const might = Number(attributes.might ?? 0);
  const grace = Number(attributes.grace ?? 0);

  return {
    carryingCapacity: Math.floor(Number.isFinite(might) ? might : 0),
    maneuverability: Math.ceil((Number.isFinite(grace) ? grace : 0) / 2)
  };
}