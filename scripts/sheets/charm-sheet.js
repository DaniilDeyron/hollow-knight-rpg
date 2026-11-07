export class HKCharmSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "item", "charm"],
      template: "systems/hollow-knight-rpg/templates/item/charm-sheet.hbs",
      width: 560, height: 620, resizable: true, submitOnChange: true,
      tabs: [
        {
          navSelector: ".hkrpg-charm-tabs",
          contentSelector: ".hkrpg-charm-tab-content",
          initial: "description",
          group: "primary"
        }
      ]
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    context.system = this.item.system;
    context.isEditable = this.isEditable;
    return context;
  }
}
