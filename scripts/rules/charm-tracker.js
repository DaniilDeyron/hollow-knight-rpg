function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function charmName(item) {
  return String(item?.name ?? "").trim().toLocaleLowerCase("ru");
}

function charmNotches(item) {
  return Math.max(1, safeInteger(item?.system?.notches ?? item?.notches ?? 1, 1));
}

export function countPathRanks(pathRows = {}) {
  return Object.values(pathRows ?? {}).reduce((total, path) =>
    total + ["rank1", "rank2", "rank3"].filter((key) => Boolean(path?.[key])).length, 0);
}

export function buildCharmNotchState(maximum = 3, charms = []) {
  const max = safeInteger(maximum, 3);
  const equipped = (charms ?? []).filter((item) => Boolean(item?.system?.equipped));
  const used = equipped.reduce((total, item) => total + charmNotches(item), 0);
  return {
    maximum: max,
    used,
    free: Math.max(0, max - used),
    overflow: Math.max(0, used - max),
    overcharmed: used > max,
    slots: Array.from({ length: max }, (_, index) => ({ value: index + 1, filled: index < used }))
  };
}

export function evaluateCharmEquip(maximum = 3, equippedCharms = [], candidate = {}) {
  const state = buildCharmNotchState(maximum, equippedCharms);
  const candidateName = charmName(candidate);
  const candidateId = candidate?.id ?? candidate?._id ?? null;
  const duplicate = Boolean(candidateName) && (equippedCharms ?? []).some((item) => {
    const itemId = item?.id ?? item?._id ?? null;
    const isSameDocument = candidateId != null && itemId != null &&
      String(itemId) === String(candidateId);
    return !isSameDocument && charmName(item) === candidateName;
  });
  if (duplicate) return { allowed: false, reason: "duplicate", overcharmed: false };
  if (state.overcharmed) return { allowed: false, reason: "already-overcharmed", overcharmed: false };
  if (state.free < 1) return { allowed: false, reason: "no-free-notch", overcharmed: false };
  const cost = charmNotches(candidate);
  const overcharmed = cost > state.free;
  return { allowed: true, reason: null, cost, remaining: state.free - cost, overcharmed };
}
