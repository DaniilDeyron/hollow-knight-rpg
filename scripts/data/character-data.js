import { calculateDerivedStats } from "../rules/derived.js";

const fields = foundry.data.fields;

function statField() {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial: 0,
    min: 0,
    max: 7,
    integer: false
  });
}

function valueField({ initial = 0, max = 999, integer = true } = {}) {
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

function customReserveField() {
  return new fields.SchemaField({
    label: textField("Свой запас"),
    current: valueField(),
    max: valueField(),
    temporary: valueField()
  });
}

export class HKCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      size: new fields.StringField({
        required: true,
        nullable: false,
        initial: "medium",
        choices: {
          small: "HKRPG.Size.Small",
          medium: "HKRPG.Size.Medium",
          large: "HKRPG.Size.Large"
        }
      }),
      profile: new fields.SchemaField({
        player: textField(),
        milestone: valueField(),
        minorAdvancements: valueField(),
        description: textField()
      }),
      attributes: new fields.SchemaField({
        might: statField(),
        insight: statField(),
        shell: statField(),
        grace: statField()
      }),
      attributeTemps: new fields.SchemaField({
        might: valueField({ max: 100, integer: false }),
        insight: valueField({ max: 100, integer: false }),
        shell: valueField({ max: 100, integer: false }),
        grace: valueField({ max: 100, integer: false })
      }),
      social: new fields.SchemaField({
        cute: valueField({ integer: false }),
        spook: valueField({ integer: false }),
        speed: valueField(),
        maneuverabilityOverride: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
          max: 999,
          integer: true
        })
      }),
      resources: new fields.SchemaField({
        heart: valueField(),
        heartMax: valueField(),
        heartTemp: valueField(),
        stamina: valueField(),
        staminaMax: valueField(),
        staminaTemp: valueField(),
        soul: valueField(),
        soulMax: valueField(),
        soulTemp: valueField(),
        hunger: valueField(),
        satiety: valueField(),
        satietyMaxOverride: new fields.NumberField({
          required: false,
          nullable: true,
          initial: null,
          min: 0,
          max: 999,
          integer: true
        })
      }),
      customReserves: new fields.SchemaField({
        reserve1: customReserveField(),
        reserve2: customReserveField(),
        reserve3: customReserveField()
      }),
      inventory: new fields.SchemaField({
        currency: valueField({ max: 999999 })
      }),
      derived: new fields.SchemaField({
        carryingCapacity: valueField(),
        maneuverability: valueField(),
        techniqueSlots: valueField(),
        beltSize: valueField(),
        satietyMax: valueField()
      }),
      notes: textField()
    };
  }

  prepareDerivedData() {
    const derived = calculateDerivedStats(this.attributes, this.resources, {
      maneuverability: this.social.maneuverabilityOverride,
      satietyMax: this.resources.satietyMaxOverride
    });
    Object.assign(this.derived, derived);
  }
}