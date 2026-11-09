import test from "node:test";
import assert from "node:assert/strict";
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
