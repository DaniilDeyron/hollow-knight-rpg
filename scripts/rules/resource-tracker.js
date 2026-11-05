/**
 * Builds compact, render-ready pip arrays for resource trackers.
 * The displayed pip count follows the maximum; temporary points are separate.
 */
export function buildResourcePips(maximum = 0, current = 0, temporary = 0, visibleLimit = 40) {
  const toCount = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  };

  const limit = Math.max(1, toCount(visibleLimit));
  const max = toCount(maximum);
  const value = toCount(current);
  const temp = toCount(temporary);
  const baseVisible = Math.min(max, limit);
  const tempVisible = Math.min(temp, limit);

  return {
    base: Array.from({ length: baseVisible }, (_, index) => ({
      value: index + 1,
      filled: index < value
    })),
    temporary: Array.from({ length: tempVisible }, (_, index) => ({
      value: index + 1,
      filled: true
    })),
    baseOverflow: Math.max(0, max - baseVisible),
    temporaryOverflow: Math.max(0, temp - tempVisible)
  };
}


/**
 * The resource bar is anchored on the left:
 * - clicking a filled pip removes that pip and every pip to its right;
 * - clicking an empty pip fills through the selected pip.
 */
export function getNextResourceValue(current, clickedPip, maximum) {
  const toCount = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  };

  const currentValue = toCount(current);
  const pipValue = toCount(clickedPip);
  const maxValue = toCount(maximum);
  if (pipValue < 1 || maxValue < 1) return currentValue;

  const next = pipValue <= currentValue ? pipValue - 1 : pipValue;
  return Math.min(maxValue, next);
}
