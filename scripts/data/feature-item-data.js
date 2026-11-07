const fields = foundry.data.fields;

function textField(initial = "") {
  return new fields.StringField({ required: true, nullable: false, initial });
}

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
