import test from "node:test";
import assert from "node:assert/strict";
import { buildResourcePips, getNextResourceValue } from "../scripts/rules/resource-tracker.js";

test("Количество обычных пипсов соответствует максимуму", () => {
  const result = buildResourcePips(7, 6, 0);
  assert.equal(result.base.length, 7);
  assert.equal(result.base.filter((pip) => pip.filled).length, 6);
});

test("Текущие пункты отмечаются заполненными", () => {
  const result = buildResourcePips(3, 2, 0);
  assert.deepEqual(result.base.map((pip) => pip.filled), [true, true, false]);
});

test("Временные пункты выводятся отдельно от основного максимума", () => {
  const result = buildResourcePips(5, 3, 2);
  assert.equal(result.base.length, 5);
  assert.equal(result.base.filter((pip) => pip.filled).length, 3);
  assert.equal(result.temporary.length, 2);
});

test("Отрицательные и нечисловые значения безопасно превращаются в ноль", () => {
  const result = buildResourcePips(-4, "bad", -1);
  assert.deepEqual(result, {
    base: [],
    temporary: [],
    baseOverflow: 0,
    temporaryOverflow: 0
  });
});

test("Большие значения ограничиваются видимым числом пипсов с индикатором остатка", () => {
  const result = buildResourcePips(50, 45, 42, 10);
  assert.equal(result.base.length, 10);
  assert.equal(result.baseOverflow, 40);
  assert.equal(result.temporary.length, 10);
  assert.equal(result.temporaryOverflow, 32);
});


test("Нажатие на пустой пункт увеличивает ресурс до его номера", () => {
  assert.equal(getNextResourceValue(3, 5, 8), 5);
});

test("Нажатие на второй заполненный пункт оставляет только первый", () => {
  assert.equal(getNextResourceValue(10, 2, 10), 1);
});

test("Нажатие на последний заполненный пункт убирает его и всё правее", () => {
  assert.equal(getNextResourceValue(5, 5, 8), 4);
});

test("Нажатие на более ранний заполненный пункт убирает его тоже", () => {
  assert.equal(getNextResourceValue(7, 3, 8), 2);
});

test("Нажатие на седьмой пустой пункт восстанавливает семь пунктов", () => {
  assert.equal(getNextResourceValue(1, 7, 10), 7);
});

test("Нажатие на первый пункт обнуляет ресурс", () => {
  assert.equal(getNextResourceValue(1, 1, 10), 0);
});

test("Нельзя увеличить ресурс выше максимума", () => {
  assert.equal(getNextResourceValue(5, 9, 7), 7);
});
