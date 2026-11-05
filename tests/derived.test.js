import test from "node:test";
import assert from "node:assert/strict";
import { calculateDerivedStats } from "../scripts/rules/derived.js";

test("Нагрузка округляет Мощь вниз", () => {
  assert.equal(calculateDerivedStats({ might: 3.5 }).carryingCapacity, 3);
});

test("Манёвренность равна половине Грации с округлением вверх", () => {
  assert.equal(calculateDerivedStats({ grace: 3 }).maneuverability, 2);
  assert.equal(calculateDerivedStats({ grace: 4 }).maneuverability, 2);
});

test("Ячейки Техник равны Проницательности с округлением вниз", () => {
  assert.equal(calculateDerivedStats({ insight: 3.5 }).techniqueSlots, 3);
});

test("Размер Пояса равен Панцирю с округлением вниз", () => {
  assert.equal(calculateDerivedStats({ shell: 3.5 }).beltSize, 3);
});

test("Максимум Сытости равен большему из Голода и 10", () => {
  assert.equal(calculateDerivedStats({}, { hunger: 4 }).satietyMax, 10);
  assert.equal(calculateDerivedStats({}, { hunger: 12 }).satietyMax, 12);
});

test("Пустые характеристики дают нулевые значения, а минимум Сытости 10", () => {
  assert.deepEqual(calculateDerivedStats(), {
    carryingCapacity: 0,
    maneuverability: 0,
    techniqueSlots: 0,
    beltSize: 0,
    satietyMax: 10
  });
});

test("Ручное значение Манёвренности переопределяет расчёт от Грации", () => {
  assert.equal(calculateDerivedStats({ grace: 3 }, {}, { maneuverability: 5 }).maneuverability, 5);
});

test("Пустое ручное значение Манёвренности возвращает автоматический расчёт", () => {
  assert.equal(calculateDerivedStats({ grace: 5 }, {}, { maneuverability: null }).maneuverability, 3);
});
