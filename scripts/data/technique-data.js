const fields = foundry.data.fields;

export class HKTechniqueData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      kind: new fields.StringField({
        required: true,
        nullable: false,
        initial: "art",
        choices: {
          art: "HKRPG.Features.TechniqueArt",
          arcana: "HKRPG.Features.TechniqueArcana"
        }
      }),
      preparedSlot: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
        max: 9,
        integer: true
      }),
      description: new fields.StringField({
        required: true,
        nullable: false,
        initial: ""
      }),
      effects: new fields.StringField({
        required: true,
        nullable: false,
        initial: ""
      })
    };
  }
}
