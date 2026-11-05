import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyD6Result,
  getAttributePool,
  summarizeD6Results
} from "../scripts/rolls/pool.js";

test("Только 5 и 6 дают успех", () => {
  assert.equal(classifyD6Result(5), "success");
  assert.equal(classifyD6Result(6), "success");
});

test("Результаты от 1 до 4 не дают успеха и имеют нейтральный стиль", () => {
  for (const value of [1, 2, 3, 4]) {
    assert.equal(classifyD6Result(value), "neutral");
  }
});

test("Пул характеристики 3.5 — три кости и один доступный переброс", () => {
  assert.deepEqual(getAttributePool(3.5), {
    baseDiceCount: 3,
    bonusDiceCount: 0,
    diceCount: 3,
    rerollsAvailable: 1
  });
});

test("Целое значение характеристики даёт только целое число костей", () => {
  assert.deepEqual(getAttributePool(4), {
    baseDiceCount: 4,
    bonusDiceCount: 0,
    diceCount: 4,
    rerollsAvailable: 0
  });
});

test("Сводка считает только успехи и не содержит подсчёта неуспехов", () => {
  const summary = summarizeD6Results([1, 3, 5, 6]);
  assert.deepEqual(summary, {
    dice: [
      { value: 1, type: "neutral" },
      { value: 3, type: "neutral" },
      { value: 5, type: "success" },
      { value: 6, type: "success" }
    ],
    total: 4,
    successes: 2
  });
  assert.equal("failures" in summary, false);
});

test("Пустой пул даёт ноль успехов", () => {
  assert.deepEqual(summarizeD6Results([]), {
    dice: [],
    total: 0,
    successes: 0
  });
});

test("Неверный результат кости отклоняется", () => {
  assert.throws(() => classifyD6Result(7), RangeError);
});

test("Временный бонус добавляет отдельные кости к основному пулу", () => {
  assert.deepEqual(getAttributePool(3, 2), {
    baseDiceCount: 3,
    bonusDiceCount: 2,
    diceCount: 5,
    rerollsAvailable: 0
  });
});

test("Временные кости не отменяют переброс от дробной основной характеристики", () => {
  assert.deepEqual(getAttributePool(3.5, 2), {
    baseDiceCount: 3,
    bonusDiceCount: 2,
    diceCount: 5,
    rerollsAvailable: 1
  });
});

test("Дробная часть временного бонуса не превращается в переброс", () => {
  assert.deepEqual(getAttributePool(3, 0.5), {
    baseDiceCount: 3,
    bonusDiceCount: 0,
    diceCount: 3,
    rerollsAvailable: 0
  });
});

test("Отрицательный временный бонус не уменьшает пул", () => {
  assert.deepEqual(getAttributePool(3, -2), {
    baseDiceCount: 3,
    bonusDiceCount: 0,
    diceCount: 3,
    rerollsAvailable: 0
  });
});

test("Ручной максимум Сытости переопределяет автоматическое значение", async () => {
  const { calculateDerivedStats } = await import("../scripts/rules/derived.js");
  assert.equal(calculateDerivedStats({}, { hunger: 4 }, { satietyMax: 14 }).satietyMax, 14);
});

test("Пустое ручное значение максимума Сытости возвращает автоматический расчёт", async () => {
  const { calculateDerivedStats } = await import("../scripts/rules/derived.js");
  assert.equal(calculateDerivedStats({}, { hunger: 4 }, { satietyMax: null }).satietyMax, 10);
});
