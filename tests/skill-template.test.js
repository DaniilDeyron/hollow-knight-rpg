import test from "node:test";
import assert from "node:assert/strict";
import { buildSkillGroups } from "../scripts/rules/feature-sheet.js";
import { readFileSync } from "node:fs";

const template = readFileSync(
  new URL("../templates/actor/character-sheet.hbs", import.meta.url),
  "utf8"
);
const sheet = readFileSync(
  new URL("../scripts/sheets/character-sheet.js", import.meta.url),
  "utf8"
);

test("Каждый навык имеет независимый переключатель мастерства", () => {
  assert.match(
    template,
    /type="checkbox" data-skill-mastery="{{\.\.\/id}}\.{{skill\.id}}"/
  );
  assert.doesNotMatch(template, /type="radio" name="system\.skillGroups\.\{\{\.\.\/id\}\}\.masterySkill"/);
  assert.match(sheet, /async _onSkillMasteryChange\(event\)/);
  assert.match(sheet, /updates\[\`system\.skillGroups\.\${groupId}\.skills\.\${skillId}\.mastery\`\] = input\.checked \? 3 : 0/);
});

test("Мастерство доступно только при третьем ранге группы", () => {
  assert.match(template, /\{\{#unless \.\.\/canMaster\}\}disabled\{\{\/unless\}\}/);
  assert.match(sheet, /Number\(group\.rank\) !== 3/);
});

test("Старое одиночное мастерство переносится в индивидуальные отметки", () => {
  assert.match(sheet, /const legacySkillId = String\(group\.masterySkill \?\? ""\)/);
  assert.match(sheet, /system\.skillGroups\.\${groupId}\.masterySkill/);
});

test("Несколько навыков одной группы могут одновременно иметь мастерство", () => {
  const [group] = buildSkillGroups({
    group1: {
      rank: 3,
      skills: {
        skill1: { name: "Парирование", mastery: 3 },
        skill2: { name: "Уклонение", mastery: 3 },
        skill3: { name: "Скрытность", mastery: 0 }
      }
    }
  });
  assert.deepEqual(group.skills.map((skill) => skill.isMastered), [true, true, false, false]);
});

test("Старое одиночное мастерство остаётся отмеченным после обновления", () => {
  const [group] = buildSkillGroups({
    group1: { rank: 3, masterySkill: "skill3", skills: {} }
  });
  assert.equal(group.skills[2].isMastered, true);
  assert.equal(group.skills[0].isMastered, false);
});


test("Мастерство переключается через capture click по нативному состоянию чекбокса", () => {
  const handler = sheet.slice(sheet.indexOf("hkrpgMasteryCapture"), sheet.indexOf('bind("[data-create-equipment-row]'));
  assert.match(handler, /closest\?\.\("\[data-skill-mastery\]"\)/);
  assert.match(handler, /event\.preventDefault\(\)/);
  assert.match(handler, /await this\._onSkillMasteryChange\(\{ currentTarget: input \}\)/);
  assert.doesNotMatch(handler, /input\.checked = !input\.checked/);
  assert.doesNotMatch(sheet, /bind\("\[data-skill-mastery\]", "change"/);
});

test("Отмеченное мастерство имеет заметное визуальное состояние", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../styles/system.css", import.meta.url), "utf8");
  assert.match(css, /input\.hkrpg-skill-entry__mastery\[type="checkbox"\]:checked/);
  assert.match(css, /radial-gradient\(circle, #f7f9fc/);
});
