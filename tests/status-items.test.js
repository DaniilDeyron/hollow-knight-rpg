import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HK_EFFECT_CATALOG, getOrderedEffectStatuses } from "../scripts/data/effects-catalog.js";
import { buildStatusItemData, findStatusReferenceItem } from "../scripts/rules/status-items.js";

test("Первые семь статусов HUD совпадают с основным каталогом листа персонажа", () => {
  const existing = [
    { id: "dead" },
    { id: "grappled" },
    { id: "unconscious" },
    { id: "invisible" },
    { id: "blind" }
  ];
  const ordered = getOrderedEffectStatuses(existing);
  const expected = [
    "grappled",
    "hkrpg-off-balance",
    "hkrpg-deaths-door",
    "unconscious",
    "hkrpg-suffocation",
    "hkrpg-dot",
    "invisible"
  ];
  assert.deepEqual(ordered.slice(0, 7).map((status) => status.id), expected);
  assert.equal(new Set(ordered.map((status) => status.id)).size, ordered.length);
  assert.ok(ordered.findIndex((status) => status.id === "dead") >= 7);
});

test("Каждому основному боевому состоянию соответствует отдельный справочный Item", () => {
  assert.equal(HK_EFFECT_CATALOG.length, 7);
  for (const definition of HK_EFFECT_CATALOG) {
    const item = buildStatusItemData(definition);
    assert.equal(item.type, "status");
    assert.equal(item.name, definition.name);
    assert.equal(item.system.statusId, definition.id);
    assert.equal(item.system.page, definition.page);
    assert.equal(item.system.bookVersion, "1.8");
    assert.match(item.system.source, /русский перевод v1\.8/);
    assert.ok(item.system.rules.length > 20);
    assert.equal(item.flags.hollow-knight-rpg.statusReferenceId, definition.id);
  }
});

test("Справочный Item определяется только по ID флага статуса", () => {
  const existing = {
    id: "item-status",
    type: "status",
    getFlag: (scope, key) => scope === "hollow-knight-rpg" && key === "statusReferenceId"
      ? "hkrpg-suffocation"
      : null
  };
  const other = { id: "other", type: "trait", getFlag: () => null };
  assert.equal(findStatusReferenceItem([other, existing], "hkrpg-suffocation"), existing);
  assert.equal(findStatusReferenceItem([existing], "hkrpg-invisible"), null);
});

test("В чар-листе статусы открывают справку, но не управляют Active Effects", () => {
  const template = readFileSync(
    new URL("../templates/actor/character-sheet.hbs", import.meta.url),
    "utf8"
  );
  const sheet = readFileSync(
    new URL("../scripts/sheets/character-sheet.js", import.meta.url),
    "utf8"
  );
  const start = template.indexOf('<section class="tab hkrpg-effects-tab"');
  const end = template.indexOf('<section class="tab hkrpg-journal-tab"', start);
  const markup = template.slice(start, end);

  assert.match(markup, /data-open-status-id=/);
  assert.doesNotMatch(markup, /data-effect-(catalog-toggle|document-toggle|delete)/);
  assert.doesNotMatch(sheet, /_onEffectAction/);
  assert.match(sheet, /_onOpenStatusItem/);
  assert.match(sheet, /findStatusReferenceItem\(game\.items, statusId\)/);
  assert.doesNotMatch(sheet, /createEmbeddedDocuments\(["']ActiveEffect/);
  assert.doesNotMatch(sheet, /deleteEmbeddedDocuments\(["']ActiveEffect/);
});

test("Справочная карточка показывает правила и не содержит элементов управления эффектом", async () => {
  const template = readFileSync(
    new URL("../templates/item/status-sheet.hbs", import.meta.url),
    "utf8"
  );
  assert.match(template, /system\.rules/);
  assert.match(template, /system\.summary/);
  assert.match(template, /system\.duration/);
  assert.match(template, /system\.source/);
  assert.doesNotMatch(template, /data-effect-|type="checkbox"|type="button"/);
});

test("В релиз включены модель, лист и шаблон статуса", () => {
  const workflow = readFileSync(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../system.json", import.meta.url), "utf8"));
  assert.match(workflow, /scripts\/data\/status-data\.js/);
  assert.match(workflow, /scripts\/rules\/status-items\.js/);
  assert.match(workflow, /scripts\/sheets\/status-sheet\.js/);
  assert.match(workflow, /templates\/item\/status-sheet\.hbs/);
  assert.ok(Object.hasOwn(manifest.documentTypes.Item, "status"));
});
