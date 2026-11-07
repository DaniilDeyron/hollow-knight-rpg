export class HKFeatureItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hkrpg", "sheet", "item", "feature-item"],
      template: "systems/hollow-knight-rpg/templates/item/feature-item-sheet.hbs",
      width: 560,
      height: 650,
      resizable: true,
      submitOnChange: true,
      tabs: [
        {
          navSelector: ".hkrpg-feature-item-tabs",
          contentSelector: ".hkrpg-feature-item-tab-content",
          initial: "description",
          group: "primary"
        }
      ]
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    const system = this.item.system;
    const actorItems = this.item.parent?.items?.contents ?? [];
    const traits = actorItems.filter((item) => item.type === "trait" && item.id !== this.item.id);

    context.system = system;
    context.isEditable = this.isEditable;
    context.isTrait = this.item.type === "trait";
    context.isPath = this.item.type === "path";
    context.parentOptions = traits
      .filter((item) => {
        if (system.kind === "subtrait") return item.system.kind === "main";
        if (system.kind === "subtrait2") return item.system.kind === "subtrait";
        return false;
      })
      .map((item) => ({ id: item.id, name: item.name }));
    return context;
  }
}
