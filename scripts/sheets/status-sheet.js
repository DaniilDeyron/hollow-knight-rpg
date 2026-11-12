export class HKStatusSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "item", "status"],
      template: "systems/hollow-knight-rpg/templates/item/status-sheet.hbs",
      width: 520,
      height: 590,
      resizable: true
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.system = this.item.system;
    return context;
  }
}
