import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../scripts/sheets/character-sheet.js", import.meta.url),
  "utf8"
);

test("Сохраняет Promise автоматического submitOnChange", () => {
  assert.match(source, /async _onChangeInput\(event\)/);
  assert.match(source, /this\._hkrpgPendingFormSubmission = submission/);
  assert.match(source, /return await submission/);
});

test("Сброс производной характеристики сначала дожидается сохранения формы", () => {
  const start = source.indexOf("async _onResetDerived(event)");
  const end = source.indexOf("async _onResourceFieldChange(event)", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handler = source.slice(start, end);
  const wait = handler.indexOf("await this._hkrpgPendingFormSubmission");
  const submit = handler.indexOf("await this.submit({ preventClose: true })");
  const reset = handler.indexOf("await this.actor.update({ [path]: null })");
  assert.ok(wait >= 0);
  assert.ok(submit > wait);
  assert.ok(reset > submit);
});
