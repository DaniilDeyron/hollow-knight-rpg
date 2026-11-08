import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const template = readFileSync(
  new URL("../templates/actor/character-sheet.hbs", import.meta.url),
  "utf8"
);

test("Поля навыков используют ID родительской группы в корректном Handlebars-контексте", () => {
  assert.match(
    template,
    /name="system\.skillGroups\.\{\{\.\.\/id\}\}\.skills\.\{\{skill\.id\}\}\.name"/
  );
  assert.match(
    template,
    /name="system\.skillGroups\.\{\{\.\.\/id\}\}\.masterySkill"/
  );
  assert.doesNotMatch(template, /system\.skillGroups\.\{\{\.\.\/group\.id\}\}/);
});

test("Мастерство разблокируется только при третьем ранге группы и не блокируется ошибочным путём", () => {
  assert.match(template, /\{\{#unless \.\.\/canMaster\}\}disabled\{\{\/unless\}\}/);
  assert.doesNotMatch(template, /\{\{#unless \.\.\/group\.canMaster\}\}/);
});
