const fields = foundry.data.fields;

export class HKCharmData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notches: new fields.NumberField({
        required: true, nullable: false, initial: 1,
        min: 1, max: 99, integer: true
      }),
      equipped: new fields.BooleanField({
        required: true, nullable: false, initial: false
      }),
      overcharmed: new fields.BooleanField({
        required: true, nullable: false, initial: false
      })
    };
  }
}
