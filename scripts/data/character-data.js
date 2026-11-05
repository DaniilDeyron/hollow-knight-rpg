import { calculateDerivedStats } from "../rules/derived.js";

const fields = foundry.data.fields;

function statField() {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial: 0,
    min: 0,
    max: 10,
    integer: false
  });
}

function resourceField() {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial: 0,
    min: 0,
    max: 999,
    integer: true
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
      attributes: new fields.SchemaField({
        might: statField(),
        insight: statField(),
        shell: statField(),
        grace: statField()
      }),
      resources: new fields.SchemaField({
        heart: resourceField(),
        heartMax: resourceField(),
        stamina: resourceField(),
        staminaMax: resourceField(),
        soul: resourceField(),
        soulMax: resourceField(),
        hunger: resourceField(),
        satiety: resourceField()
      }),
      derived: new fields.SchemaField({
        carryingCapacity: resourceField(),
        maneuverability: resourceField()
      }),
      notes: new fields.StringField({
        required: true,
        nullable: false,
        initial: ""
      })
    };
  }

  prepareDerivedData() {
    const derived = calculateDerivedStats(this.attributes);
    this.derived.carryingCapacity = derived.carryingCapacity;
    this.derived.maneuverability = derived.maneuverability;
  }
}