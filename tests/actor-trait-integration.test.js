import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Manifest registers three bug templates and keeps legacy character type for existing worlds", () => {
  const manifest = JSON.parse(readFileSync(new URL("../system.json", import.meta.url), "utf8"));
  assert.ok(manifest.documentTypes.Actor.largeBug);
  assert.ok(manifest.documentTypes.Actor.mediumBug);
  assert.ok(manifest.documentTypes.Actor.smallBug);
  assert.ok(manifest.documentTypes.Actor.character);
});

test("Actor creation hook applies type-specific template data", () => {
  const source = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(source, /Hooks\.on\("preCreateActor"/);
  assert.match(source, /buildBugActorDefaults\(actor\.type\)/);
  assert.match(source, /types: \["character", "largeBug", "mediumBug", "smallBug"\]/);
});

test("Trait cards allow nested child drops and independent selection", () => {
  const template = readFileSync(new URL("../templates/actor/character-sheet.hbs", import.meta.url), "utf8");
  const sheet = readFileSync(new URL("../scripts/sheets/character-sheet.js", import.meta.url), "utf8");
  assert.match(template, /data-trait-child-dropzone=/);
  assert.match(template, /data-trait-select=/);
  assert.match(sheet, /parentLibraryId/);
  assert.match(sheet, /_onTraitSelectionChange/);
});

test("Trait Item sheet exposes all numeric modifier fields", () => {
  const template = readFileSync(new URL("../templates/item/feature-item-sheet.hbs", import.meta.url), "utf8");
  for (const field of ["hunger","might","insight","shell","grace","heartMax","staminaMax","soulMax","satietyMax","speed","cute","spook"]) {
    assert.match(template, new RegExp(`name="system\\.${field}"`));
  }
});
