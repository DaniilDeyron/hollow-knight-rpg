import { calculateDerivedStats } from "../rules/derived.js";
import { countPathRanks } from "../rules/charm-tracker.js";
import { calculateTraitBonuses } from "../rules/trait-bonuses.js";
import { getBugTemplate } from "./bug-templates.js";

const fields = foundry.data.fields;

function signedTraitBonus() { return new fields.NumberField({ required: true, nullable: false, initial: 0, min: -99, max: 99, integer: false }); }

function statField(initial = 0) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial,
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

function booleanField() {
  return new fields.BooleanField({
    required: true,
    nullable: false,
    initial: false
  });
}

function traitSheetRowField() {
  return new fields.SchemaField({
    name: textField(),
    attraction: booleanField(),
    spook: booleanField(),
    hunger: booleanField()
  });
}

function pathSheetRowField() {
  return new fields.SchemaField({
    name: textField(),
    rank1: booleanField(),
    rank2: booleanField(),
    rank3: booleanField()
  });
}

function techniqueSheetRowField() {
  return new fields.SchemaField({
    name: textField(),
    kind: new fields.StringField({
      required: true,
      nullable: false,
      initial: "art",
      choices: { art: "HKRPG.Features.TechniqueArt", arcana: "HKRPG.Features.TechniqueArcana" }
    }),
    marked: booleanField()
  });
}

function masterySkillField() {
  return new fields.SchemaField({
    name: textField(),
    mastery: valueField({ max: 3 })
  });
}

function proficiencySkillGroupField() {
  const skills = {};
  for (let index = 1; index <= 4; index += 1) {
    skills[`skill${index}`] = masterySkillField();
  }

  return new fields.SchemaField({
    name: textField(),
    rank: valueField({ max: 3 }),
    masterySkill: textField(),
    skills: new fields.SchemaField(skills)
  });
}

function fixedRowSlots(factory, count) {
  const schema = {};
  for (let index = 1; index <= count; index += 1) {
    schema[`slot${index}`] = factory();
  }
  return new fields.SchemaField(schema);
}

export class HKCharacterData extends foundry.abstract.TypeDataModel {
  static get bugTemplateKey() { return null; }

  static defineSchema() {
    const template = this.bugTemplateKey ? getBugTemplate(this.bugTemplateKey) : null;
    const initial = (key, fallback = 0) => Number(template?.resources?.[key] ?? fallback);
    return {
      size: new fields.StringField({
        required: true,
        nullable: false,
        initial: template?.size ?? "medium",
        choices: {
          small: "HKRPG.Size.Small",
          medium: "HKRPG.Size.Medium",
          large: "HKRPG.Size.Large"
        }
      }),
      profile: new fields.SchemaField({
        // Legacy data retained for older actor records; the current sheet no longer displays it.
        player: textField(),
        milestone: valueField(),
        minorAdvancements: valueField(),
        description: textField()
      }),
      attributes: new fields.SchemaField({
        might: statField(template?.attributes.might ?? 0),
        insight: statField(template?.attributes.insight ?? 0),
        shell: statField(template?.attributes.shell ?? 0),
        grace: statField(template?.attributes.grace ?? 0)
      }),
      attributeTemps: new fields.SchemaField({
        might: valueField({ max: 100, integer: false }),
        insight: valueField({ max: 100, integer: false }),
        shell: valueField({ max: 100, integer: false }),
        grace: valueField({ max: 100, integer: false })
      }),
      social: new fields.SchemaField({
        cute: valueField({ initial: template?.social.cute ?? 0, integer: false }),
        spook: valueField({ initial: template?.social.spook ?? 0, integer: false }),
        bonus: valueField({ initial: template?.bonus ?? 0, integer: false }),
        speed: valueField({ initial: template?.social.speed ?? 0 }),
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
        notchesBonus: valueField({ max: 99 }),
        techniqueSlotsBonus: valueField({ max: 99 }),
        heart: valueField({ initial: initial("heart") }),
        heartMax: valueField({ initial: initial("heartMax") }),
        heartTemp: valueField(),
        stamina: valueField({ initial: initial("stamina") }),
        staminaMax: valueField({ initial: initial("staminaMax") }),
        staminaTemp: valueField(),
        soul: valueField({ initial: initial("soul") }),
        soulMax: valueField({ initial: initial("soulMax") }),
        soulTemp: valueField(),
        hunger: new fields.NumberField({ required: true, nullable: false, initial: initial("hunger"), min: -99, max: 999, integer: false }),
        satiety: valueField({ initial: initial("satiety") }),
        satietyMaxOverride: new fields.NumberField({
          required: false,
          nullable: true,
          initial: template?.resources.satietyMaxOverride ?? null,
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
        satietyMax: valueField(),
        notchesMax: valueField(),
        effectiveHunger: signedTraitBonus(),
        traitBonuses: new fields.SchemaField({
          might: signedTraitBonus(), insight: signedTraitBonus(), shell: signedTraitBonus(), grace: signedTraitBonus(),
          heartMax: signedTraitBonus(), staminaMax: signedTraitBonus(), soulMax: signedTraitBonus(), satietyMax: signedTraitBonus(),
          carryingCapacity: signedTraitBonus(),
          hunger: signedTraitBonus(), cute: signedTraitBonus(), spook: signedTraitBonus(), speed: signedTraitBonus()
        })
      }),
      featureSheet: new fields.SchemaField({
        traits: fixedRowSlots(traitSheetRowField, 10),
        paths: fixedRowSlots(pathSheetRowField, 6),
        techniques: fixedRowSlots(techniqueSheetRowField, 9)
      }),
      skillGroups: new fields.SchemaField({
        group1: proficiencySkillGroupField(),
        group2: proficiencySkillGroupField(),
        group3: proficiencySkillGroupField()
      }),
      names: textField(),
      notes: textField(),
      diary: textField()
    };
  }

  prepareDerivedData() {
    const pathRanks = countPathRanks(this.featureSheet.paths);

    const derived = calculateDerivedStats(this.attributes, this.resources, {
      maneuverability: this.social.maneuverabilityOverride,
      satietyMax: this.resources.satietyMaxOverride,
      pathRanks,
      notchBonus: this.resources.notchesBonus
    });
    const traitBonuses = calculateTraitBonuses(this.parent?.items?.contents ?? []);
    Object.assign(this.derived, derived, { traitBonuses });
    this.derived.satietyMax = Math.max(0, derived.satietyMax + traitBonuses.satietyMax);
    this.derived.carryingCapacity = Math.max(0, derived.carryingCapacity + traitBonuses.carryingCapacity);
    this.derived.effectiveHunger = Number(this.resources.hunger ?? 0) + traitBonuses.hunger;
  }
}

export class HKSmallBugData extends HKCharacterData {
  static get bugTemplateKey() { return "small"; }
}

export class HKMediumBugData extends HKCharacterData {
  static get bugTemplateKey() { return "medium"; }
}

export class HKLargeBugData extends HKCharacterData {
  static get bugTemplateKey() { return "large"; }
}
