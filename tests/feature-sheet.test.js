import test from "node:test";
import assert from "node:assert/strict";
import { buildFeatureRows, countFeatureMarks } from "../scripts/rules/feature-sheet.js";

test("Формирует заданное число пустых строк черт", () => {
  const rows = buildFeatureRows({}, [], 10, ["attraction", "spook", "hunger"]);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].name, "");
  assert.equal(rows[0].attraction, false);
  assert.equal(rows[9].slot, "slot10");
});

test("Сохраняет названия существующих черт, путей и техник по слотам", () => {
  const rows = buildFeatureRows(
    { slot1: { name: "Крепкий панцирь" }, slot2: { name: "" } },
    [{ name: "Старая черта" }, { name: "Второй предмет" }],
    2,
    ["marked"]
  );
  assert.equal(rows[0].name, "Крепкий панцирь");
  assert.equal(rows[1].name, "Второй предмет");
});

test("Формирует отметки рангов в заданных полях", () => {
  const rows = buildFeatureRows({ slot1: { name: "Путь", rank1: true, rank2: true } }, [], 1, ["rank1", "rank2", "rank3"]);
  assert.deepEqual([rows[0].rank1, rows[0].rank2, rows[0].rank3], [true, true, false]);
});

test("Считает итоги по трём отметкам черт", () => {
  const rows = [
    { attraction: true, spook: false, hunger: true },
    { attraction: false, spook: true, hunger: true },
    { attraction: true, spook: true, hunger: false }
  ];
  assert.deepEqual(countFeatureMarks(rows, ["attraction", "spook", "hunger"]), {
    attraction: 2,
    spook: 2,
    hunger: 2
  });
});
