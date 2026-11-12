const fields = foundry.data.fields;

function textField(initial = "") {
  return new fields.StringField({
    required: true,
    nullable: false,
    initial
  });
}

export class HKStatusData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      statusId: textField(),
      summary: textField(),
      rules: textField(),
      duration: textField(),
      source: textField(),
      page: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
        max: 999,
        integer: true
      }),
      bookVersion: textField("1.8")
    };
  }
}
