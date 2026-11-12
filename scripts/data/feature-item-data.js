const fields = foundry.data.fields;

function textField(initial = "") {
  return new fields.StringField({ required: true, nullable: false, initial });
}

function booleanField(initial = false) { return new fields.BooleanField({ required: true, nullable: false, initial }); }

function signedModifierField() {
  return new fields.NumberField({
    required: true,
    nullable: false,
    initial: 0,
    min: -99,
    max: 99,
    integer: false
  });
}

export class HKTraitData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      kind: new fields.StringField({
        required: true,
        nullable: false,
        initial: "main",
        choices: {
          main: "HKRPG.Features.TraitMain",
          subtrait: "HKRPG.Features.TraitSub",
          subtrait2: "HKRPG.Features.TraitSub2"
        }
      }),
      parentId: textField(),
      selected: booleanField(true),
      libraryId: textField(),
      parentLibraryId: textField(),
      group: textField(),
      might: signedModifierField(),
      insight: signedModifierField(),
      shell: signedModifierField(),
      grace: signedModifierField(),
      heartMax: signedModifierField(),
      staminaMax: signedModifierField(),
      soulMax: signedModifierField(),
      satietyMax: signedModifierField(),
      speed: signedModifierField(),
      slot: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
        max: 7,
        integer: true
      }),
      category: new fields.StringField({
        required: true,
        nullable: false,
        initial: "unassigned",
        choices: {
          unassigned: "HKRPG.Features.TraitCategoryUnassigned",
          naturalWeapon: "HKRPG.Features.TraitCategoryNaturalWeapon",
          characteristics: "HKRPG.Features.TraitCategoryCharacteristics",
          mind: "HKRPG.Features.TraitCategoryMind",
          physiological: "HKRPG.Features.TraitCategoryPhysiological",
          senses: "HKRPG.Features.TraitCategorySenses",
          mystical: "HKRPG.Features.TraitCategoryMystical",
          body: "HKRPG.Features.TraitCategoryBody",
          movement: "HKRPG.Features.TraitCategoryMovement",
          naturalDefense: "HKRPG.Features.TraitCategoryNaturalDefense",
          custom: "HKRPG.Features.TraitCategoryCustom"
        }
      }),
      hunger: signedModifierField(),
      cute: signedModifierField(),
      spook: signedModifierField(),
      description: textField(),
      effects: textField()
    };
  }
}

export class HKPathData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      pathType: new fields.StringField({
        required: true,
        nullable: false,
        initial: "unassigned",
        choices: {
          unassigned: "HKRPG.Features.PathTypeUnassigned",
          martial: "HKRPG.Features.PathTypeMartial",
          mystic: "HKRPG.Features.PathTypeMystic"
        }
      }),
      rank: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 1,
        min: 1,
        max: 3,
        integer: true
      }),
      description: textField(),
      effects: textField()
    };
  }
}
