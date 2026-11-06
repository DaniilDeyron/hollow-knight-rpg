import test from "node:test";
import assert from "node:assert/strict";
import { buildFeatureRows, buildSkillGroups, countFeatureMarks } from "../scripts/rules/feature-sheet.js";

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

test("Создаёт три группы умений по четыре строки", () => {
  const groups = buildSkillGroups({});
  assert.equal(groups.length, 3);
  assert.equal(groups[0].skills.length, 4);
  assert.equal(groups[2].skills[3].name, "");
  assert.equal(groups[2].rank, 0);
});

test("Сохраняет названия навыков, ранги групп и значения мастерства", () => {
  const groups = buildSkillGroups({
    group1: {
      rank: 2,
      skills: {
        skill1: { name: "Сражение", mastery: 3 },
        skill4: { name: "Скрытность", mastery: 1 }
      }
    },
    group3: {
      rank: 1,
      skills: {
        skill2: { name: "Исследование", mastery: 2 }
      }
    }
  });

  assert.equal(groups[0].rank, 2);
  assert.equal(groups[0].skills[0].name, "Сражение");
  assert.equal(groups[0].skills[0].mastery, 3);
  assert.equal(groups[0].skills[3].mastery, 1);
  assert.equal(groups[2].rank, 1);
  assert.equal(groups[2].skills[1].name, "Исследование");
});

test("Ограничивает ранги и мастерство диапазоном от 0 до 3", () => {
  const groups = buildSkillGroups({
    group1: { rank: 9, skills: { skill1: { name: "Навык", mastery: -2 } } }
  });
  assert.equal(groups[0].rank, 3);
  assert.equal(groups[0].skills[0].mastery, 0);
});

test("Сохраняет отдельное название каждого умения", () => {
  const groups = buildSkillGroups({
    group1: {
      name: "Боевая подготовка",
      rank: 2,
      skills: {
        skill1: { name: "Мечи", mastery: 3 },
        skill2: { name: "Копья", mastery: 1 }
      }
    },
    group2: {
      name: "Исследование",
      rank: 1,
      skills: {
        skill1: { name: "Поиск", mastery: 2 }
      }
    }
  });

  assert.equal(groups[0].name, "Боевая подготовка");
  assert.equal(groups[0].skills[0].name, "Мечи");
  assert.equal(groups[0].skills[1].name, "Копья");
  assert.equal(groups[1].name, "Исследование");
});

test("Пустое название умения не ломает отображение группы", () => {
  const groups = buildSkillGroups({ group3: { name: "", rank: 0 } });
  assert.equal(groups[2].name, "");
  assert.equal(groups[2].skills.length, 4);
});
