export class HKInventoryItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "item", "inventory-item"],
      template: "systems/hollow-knight-rpg/templates/item/inventory-item-sheet.hbs",
      width: 560,
      height: 640,
      resizable: true,
      submitOnChange: true
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.system = this.item.system;
    context.isEditable = this.isEditable;
    context.isWeapon = this.item.type === "weapon";
    context.isShield = this.item.type === "shield";
    context.isArmor = this.item.type === "armor";
    context.categoryLabel = context.isWeapon ? "Боевое оружие" :
      context.isShield ? "Щит" : "Доспехи";
    context.costDisplay = this.item.system.costLabel || "—";
    context.weightDisplay = this.item.system.weightLabel || String(this.item.system.weight ?? 0);
    return context;
  }
}
