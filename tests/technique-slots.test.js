import test from "node:test";
import assert from "node:assert/strict";
import { buildTechniqueSlotCards } from "../scripts/rules/feature-sheet.js";

test("Число ячеек техник соответствует доступному количеству", () => {
  assert.equal(buildTechniqueSlotCards(5).length, 5);
  assert.equal(buildTechniqueSlotCards(0).length, 0);
  assert.equal(buildTechniqueSlotCards(20).length, 9);
});

test("Подготовленная техника отображается в своей ячейке", () => {
  const technique = {
    id: "tech-1",
    type: "technique",
    name: "Удар гвоздём",
    img: "icons/svg/sword.svg",
    system: { preparedSlot: 2, kind: "art" }
  };
  const slots = buildTechniqueSlotCards(4, [technique]);
  assert.equal(slots[0].isEmpty, true);
  assert.equal(slots[1].item.id, "tech-1");
  assert.equal(slots[1].item.name, "Удар гвоздём");
  assert.equal(slots[2].isEmpty, true);
});

test("Старая текстовая техника остаётся видимой до переноса в Item", () => {
  const legacy = [
    { number: 1, name: "Старое Искусство", type: "art" },
    { number: 3, name: "Старая Тайна", type: "arcana" }
  ];
  const slots = buildTechniqueSlotCards(3, [], legacy);
  assert.equal(slots[0].legacy.name, "Старое Искусство");
  assert.equal(slots[1].isEmpty, true);
  assert.equal(slots[2].legacy.name, "Старая Тайна");
});

test("Item занимает ячейку вместо старой записи той же позиции", () => {
  const item = { id: "item-2", type: "technique", system: { preparedSlot: 1 } };
  const slots = buildTechniqueSlotCards(1, [item], [{ number: 1, name: "Старая запись" }]);
  assert.equal(slots[0].item.id, "item-2");
  assert.equal(slots[0].legacy, null);
});
