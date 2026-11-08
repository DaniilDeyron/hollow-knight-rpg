import test from "node:test";
import assert from "node:assert/strict";
import { summarizePaths } from "../scripts/rules/feature-sheet.js";

test("Строка Пути получает изображение предмета", () => {
  const summary = summarizePaths([{
    id: "path-1",
    name: "Гвоздь",
    img: "icons/svg/sword.svg",
    system: { rank: 2, pathType: "martial" }
  }]);
  assert.equal(summary.paths[0].img, "icons/svg/sword.svg");
  assert.equal(summary.paths[0].name, "Гвоздь");
  assert.equal(summary.paths[0].rank, 2);
});

test("Пустое изображение Пути не ломает отображаемую модель", () => {
  const summary = summarizePaths([{
    id: "path-2",
    name: "Шпиль",
    system: { rank: 1, pathType: "mystic" }
  }]);
  assert.equal(summary.paths[0].img, "");
});
