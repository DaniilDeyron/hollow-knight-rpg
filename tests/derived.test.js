import test from "node:test";
import assert from "node:assert/strict";
import { calculateDerivedStats } from "../scripts/rules/derived.js";

test("Нагрузка округляет Мощь вниз", () => {
  assert.equal(calculateDerivedStats({ might: 3.5, grace: 0 }).carryingCapacity, 3);
});

test("Манёвренность равна половине Грации с округлением вверх", () => {
  assert.equal(calculateDerivedStats({ might: 0, grace: 3 }).maneuverability, 2);
  assert.equal(calculateDerivedStats({ might: 0, grace: 4 }).maneuverability, 2);
});

test("Пустые характеристики дают нулевые производные значения", () => {
  assert.deepEqual(calculateDerivedStats(), {
    carryingCapacity: 0,
    maneuverability: 0
  });
});