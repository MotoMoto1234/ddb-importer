import utils from "../../lib/utils.js";
import { baseEnchantmentEffect } from "../effects.js";

export function elementalWeaponEffect(document) {
  document.system.damage.parts = [];
  document.system.chatFlavor = "";

  const elementTypes = [
    { type: "acid", img: "icons/magic/acid/dissolve-bone-white.webp" },
    { type: "cold", img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
    { type: "fire", img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
    { type: "lightning", img: "icons/magic/lightning/bolt-strike-blue.webp" },
    { type: "thunder", img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
  ];

  const enchantments = [
    { bonus: "1", min: null, max: 3 },
    { bonus: "2", min: 5, max: 6 },
    { bonus: "3", min: 7, max: null },
  ];
  document.system.actionType = "ench";
  foundry.utils.setProperty(document, "system.enchantment", {
    restrictions: {
      allowMagical: false,
      type: "weapon",
    },
  });
  for (const element of elementTypes) {
    for (const e of enchantments) {
      let effect = baseEnchantmentEffect(document, `${document.name}: ${utils.capitalize(element.type)} +${e.bonus}`);
      e.img = element.img;
      foundry.utils.setProperty(effect, "flags.dnd5e.enchantment.level", { min: e.min, max: e.max });
      effect.changes.push(
        {
          key: "name",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `{}, +${e.bonus} (${utils.capitalize(element.type)})`,
          priority: 20,
        },
        {
          key: "system.properties",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: "mgc",
          priority: 20,
        },
        {
          key: "system.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: e.bonus,
          priority: 20,
        },
        {
          key: "system.damage.parts",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: `[["${e.bonus}d4[${element.type}]", "${element.type}"]]`,
          priority: 20,
        }
      );
      e.description = `This weapon has become a +${e.bonus} magic weapon, granting a bonus to attack and damage rolls.`;
      document.effects.push(effect);
    }
  }

  return document;
}
