const fields = foundry.data.fields;

function numberField(initial = 0, { max = 9999, integer = false } = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial,
    min: 0,
    max,
    integer
  });
}

function textField(initial = "") {
  return new fields.StringField({
    required: true,
    nullable: false,
    initial
  });
}

function optionalNumberField(initial = 0, { max = 9999, integer = false } = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial,
    min: 0,
    max,
    integer
  });
}


/**
 * Shared editable data for inventory, weapon, shield and armor Items.
 * The character sheet edits these values directly in its equipment rows.
 */
export class HKInventoryItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      weight: numberField(0),
      quantity: numberField(1, { max: 999, integer: true }),
      damage: textField(),
      range: textField(),
      protection: textField(),
      durability: numberField(0, { max: 999, integer: true }),
      quality: optionalNumberField(0, { max: 99, integer: true }),
      weaponTypes: textField(),
      grip: textField(),
      itemCategory: textField(),
      weightLabel: textField(),
      cost: optionalNumberField(0, { max: 999999, integer: true }),
      costLabel: textField(),
      damageReduction: optionalNumberField(0, { max: 99, integer: true }),
      soakBonus: optionalNumberField(0, { max: 99, integer: true }),
      soakRerolls: optionalNumberField(0, { max: 99, integer: true }),
      absorption: optionalNumberField(0, { max: 99, integer: true }),
      description: textField(),
      rules: textField(),
      modificationNotes: textField(),
      sourcePage: optionalNumberField(0, { max: 999, integer: true })
    };
  }
}
