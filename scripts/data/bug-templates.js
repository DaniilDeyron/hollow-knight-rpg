export const HK_BUG_TEMPLATES = {
  small: {
    label: "Маленький жук", size: "small",
    attributes: { might: 2, insight: 3, shell: 3, grace: 4 },
    resources: { heart: 6, heartMax: 6, stamina: 3, staminaMax: 3, soul: 3, soulMax: 3, hunger: -1, satiety: 15, satietyMaxOverride: 15 },
    social: { cute: 1.5, spook: 1, speed: 7 },
    bonus: 1,
    token: { width: 1, height: 1 }
  },
  medium: {
    label: "Средний жук", size: "medium",
    attributes: { might: 3, insight: 3, shell: 3, grace: 3 },
    resources: { heart: 7, heartMax: 7, stamina: 3, staminaMax: 3, soul: 3, soulMax: 3, hunger: 4, satiety: 20, satietyMaxOverride: 20 },
    social: { cute: 1, spook: 1, speed: 6 },
    bonus: 1.5,
    token: { width: 1, height: 1 }
  },
  large: {
    label: "Большой жук", size: "large",
    attributes: { might: 4, insight: 3, shell: 4, grace: 2 },
    resources: { heart: 8, heartMax: 8, stamina: 3, staminaMax: 3, soul: 3, soulMax: 3, hunger: 9, satiety: 25, satietyMaxOverride: 25 },
    social: { cute: 1, spook: 1.5, speed: 5 },
    bonus: 1,
    token: { width: 2, height: 2 }
  }
};

export function getBugTemplate(type) {
  return HK_BUG_TEMPLATES[type] ?? HK_BUG_TEMPLATES.medium;
}

export function buildBugActorDefaults(type) {
  const template = getBugTemplate(type);
  return {
    system: {
      size: template.size,
      attributes: foundry.utils.deepClone(template.attributes),
      resources: foundry.utils.deepClone(template.resources),
      social: foundry.utils.deepClone(template.social)
    },
    prototypeToken: {
      width: template.token.width,
      height: template.token.height
    }
  };
}
