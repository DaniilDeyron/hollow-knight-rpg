import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyD6Result,
  getAttributePool,
  summarizeD6Results
} from "../scripts/rolls/pool.js";

test("5 и 6 считаются успехами", () => {
  assert.equal(classifyD6Result(5), "success");
  assert.equal(classifyD6Result(6), "success");
});

test("3 и 4 — серые неуспешные результаты", () => {
  assert.equal(classifyD6Result(3), "neutral");
  assert.equal(classifyD6Result(4), "neutral");
});

test("1 и 2 — красные низкие неуспешные результаты", () => {
  assert.equal(classifyD6Result(1), "low");
  assert.equal(classifyD6Result(2), "low");
});

test("Пул характеристики 3.5 — три кости и один доступный переброс", () => {
  assert.deepEqual(getAttributePool(3.5), {
    diceCount: 3,
    rerollsAvailable: 1
  });
});

test("Целое значение характеристики даёт только целое число костей", () => {
  assert.deepEqual(getAttributePool(4), {
    diceCount: 4,
    rerollsAvailable: 0
  });
});

test("Сводка правильно считает успехи и неуспехи", () => {
  assert.deepEqual(summarizeD6Results([1, 3, 5, 6]), {
    dice: [
      { value: 1, type: "low" },
      { value: 3, type: "neutral" },
      { value: 5, type: "success" },
      { value: 6, type: "success" }
    ],
    total: 4,
    successes: 2,
    failures: 2
  });
});

test("Неверный результат кости отклоняется", () => {
  assert.throws(() => classifyD6Result(7), RangeError);
});