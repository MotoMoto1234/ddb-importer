import DICTIONARY from "../../dictionary.js";
import { baseEnchantmentEffect, generateEffects } from "../../effects/effects.js";
import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import DDBHelper from "../../lib/DDBHelper.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import { parseDamageRolls, parseTags } from "../../lib/DDBReferenceLinker.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBAttackAction from "./DDBAttackAction.js";

export class DDBInfusion {

  _init() {
    logger.debug(`Generating Infusion Feature ${this.ddbInfusion.name}`);
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: utils.nameString(`Infusion: ${this.ddbInfusion.name}`),
      type: this.documentType,
      system: utils.getTemplate(this.documentType),
      effects: [],
      flags: {
        ddbimporter: {
          id: this.ddbInfusion.id,
          infusionId: this.ddbInfusion.id,
          class: "Artificer",
          type: this.tagType,
          infusionFeature: true,
          dndbeyond: {
            defintionKey: this.ddbInfusion.definitionKey,
            requiredLevel: this.ddbInfusion.level,
            modifierType: this.ddbInfusion.modifierDataType,
          },
        },
      }
    };

    this.requiredLevel = null;
    const requiredLevel = foundry.utils.getProperty(this.ddbInfusion, "level");
    if (Number.isInteger(Number.parseInt(requiredLevel))) {
      this.data.system.prerequisites = {
        level: Number.parseInt(requiredLevel),
      };
      this.requiredLevel = Number.parseInt(requiredLevel);
    }

    this.data.system.consume = {
      type: "charges",
      target: "",
      amount: "-1",
      scale: false,
    };
    this.data.system.enchantment = {
      items: {
        max: "",
        period: "",
      },
      restrictions: {
        type: "",
        allowMagical: false
      },
      classIdentifier: "",
    };
  }

  constructor({ ddbData, ddbInfusion, documentType = "feat", rawCharacter = null, noMods = false } = {}) {
    this.ddbData = ddbData;
    this.rawCharacter = rawCharacter;
    this.ddbInfusion = ddbInfusion;
    this.name = utils.nameString(this.ddbInfusion.name);
    this.type = "feat";
    this.source = DDBHelper.parseSource(ddbInfusion);
    this.isAction = false;
    this.documentType = documentType;
    this.tagType = "infusion";
    this.data = {};
    this.actions = [];
    this.grantedItems = [];
    this.noMods = noMods;
    this._init();
    this._generateDataStub();
    this.data.system.source = this.source;
    this.compendium = null;
  }

  _buildDescription() {
    const chatSnippet = this.ddbInfusion.snippet ? this.ddbInfusion.snippet : "";
    const chatAdd = game.settings.get("ddb-importer", "add-description-to-chat");
    const itemText = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text");
    const prerequisitesHeader = this.requiredLevel && this.requiredLevel > 1
      ? `<p><i>Prerequisites: ${utils.ordinalSuffixOf(this.requiredLevel)}-level artificer</i></p>`
      : "";
    const itemHeader = itemText
      ? `<p><i>Item: ${itemText}</i></p>`
      : "";

    const valueDamageText = parseDamageRolls({ text: this.ddbInfusion.description, document: this.data, actor: null });
    const chatDamageText = chatAdd ? parseDamageRolls({ text: chatSnippet, document: this.data, actor: null }) : "";
    this.data.system.description = {
      value: parseTags(prerequisitesHeader + itemHeader + valueDamageText),
      chat: chatAdd ? parseTags(chatDamageText) : "",
    };
  }

  _generateSystemType() {
    foundry.utils.setProperty(this.data, "system.type.value", "enchantment");
    foundry.utils.setProperty(this.data, "system.type.subtype", "artificerInfusion");
  }

  _generateEnchantmentType() {
    let type = "";
    const itemRule = foundry.utils.getProperty(this.ddbInfusion, "itemRuleData.text");
    if (!itemRule) return;
    if (itemRule.includes("weapon")) type = "weapon";
    else if (itemRule.includes("armor")) type = "equipment";
    else if (itemRule.includes("shield")) type = "equipment";
    else if (itemRule.includes("gem")) type = "loot";
    // tool, equipment, consumable, loot, container, weapon
    foundry.utils.setProperty(this.data, "system.enchantment.restrictions.type", type);
  }

  _generateActionType() {
    if (["augment", "replicate"].includes(this.ddbInfusion.type)) {
      this.data.system.actionType = "ench";
    } else if (this.ddbInfusion.type === "creature") {
      this.data.system.actionType = "summon";
    }
  }

  async compendiumInit() {
    this.compendiumFolders = new DDBCompendiumFolders("features");
    await this.compendiumFolders.loadCompendium("features");
  }

  static async addInfusionsToCompendium(documents) {
    const featureHandlerOptions = {
      chrisPremades: false,
      deleteBeforeUpdate: false,
      removeSRDDuplicates: false,
      filterDuplicates: false,
      matchFlags: ["infusionId"],
      useCompendiumFolders: true,
    };

    logger.debug(`Creating infusion compendium feature`, {
      documents,
      featureHandlerOptions,
    });
    const featureHandler = await DDBItemImporter.buildHandler("features", documents, true, featureHandlerOptions);
    const compendiumFeatures = await featureHandler.compendiumIndex.filter((i) =>
      featureHandler.documents.some((orig) => i.name === orig.name)
    );
    return compendiumFeatures;
  }

  _buildActions() {
    // build actions fomr this.ddbInfusion.actions
    // for example radiant weapon reaction
    if (!this.ddbInfusion.actions) return;

    for (const actionData of this.ddbInfusion.actions) {
      // const itemLookup = ddb.infusions.item.find((mapping) => mapping.definitionKey === infusionDetail.definitionKey);
      if (!actionData.name) {
        const activationType = foundry.utils.getProperty(actionData, "activation.activationType");
        const postfix = [3, 4].includes(activationType)
          ? ` (${utils.capitalize(DICTIONARY.actions.activationTypes.find((a) => a.id === activationType).value)})`
          : "";
        actionData.name = `${this.name}${postfix}`;
      }
      const action = new DDBAttackAction({ ddbData: this.ddbData, ddbDefinition: actionData, rawCharacter: this.rawCharacter, type: actionData.actionSource });
      action.build();
      this.actions.push(action.data);
    }
    logger.debug(`Generated Infusions Actions`, this.actions);
  }

  _specials() {
    // handle special cases

    // radiant weapon blindness effect?
  }

  _getEnchanmentEffect(modifierData, { forceName = false, useModifierLabelName = false } = {}) {
    const label = modifierData.name ?? this.name;
    const foundryItem = foundry.utils.deepClone(this.data);
    foundryItem.effects = [];
    const effect = baseEnchantmentEffect(foundryItem, label);
    const modifiers = foundry.utils.deepClone(modifierData.modifiers) ?? [];
    const modifierItem = {
      definition: {
        name: this.name,
        grantedModifiers: modifiers.filter((mod) =>
          !(mod.type === "bonus" && mod.subType === "armor-class")
          && !(mod.type === "bonus" && mod.subType === "magic")
        ),
      },
    };

    const mockItem = generateEffects(this.ddbData, this.rawCharacter, modifierItem, foundryItem, this.noMods, "infusion");
    if (mockItem.effects.length > 0) effect.changes = mockItem.effects.map((e) => e.changes).flat(1);

    effect.changes.push(...this._getMagicBonusChanges(modifiers));

    if (effect.changes.length === 0 && !forceName) return effect;
    effect.changes.push(
      {
        key: "name",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: ` [${useModifierLabelName ? label : this.name}] [Infusion]`,
        priority: 20,
      }
    );
    return effect;
  }

  _generateEnchantmentEffects() {
    for (const [index, effectData] of this.ddbInfusion.modifierData.entries()) {
      const forceName = ["granted"].includes(this.ddbInfusion.modifierDataType);
      const useModifierLabelName = ["damage-type-choice"].includes(this.ddbInfusion.modifierDataType);
      const effect = this._getEnchanmentEffect(effectData, { forceName, useModifierLabelName });

      switch (this.ddbInfusion.modifierDataType) {
        case "class-level": {
          const minLevel = effectData.value;
          const maxLevel = index < this.ddbInfusion.modifierData.length - 1
            ? (this.ddbInfusion.modifierData[index + 1].value ?? null)
            : null;
          const level = {
            min: minLevel,
            max: maxLevel,
          };
          foundry.utils.setProperty(effect, "flags.dnd5e.enchantment.level", level);
          break;
        }
        case "damage-type-choice": {

          break;
        }
        case "replicate": {
          effect.changes.push(
            {
              key: "name",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: ` [Infusion]`,
              priority: 20,
            }
          );
          break;
        }
        case "granted":
        default: {
          logger.debug(`Infusion ${this.name} has no additional config`);
        }
      }

      this.data.effects.push(effect);
    }

  }

  _getMagicBonusChanges(modifiers) {
    const filteredModifiers = DDBHelper.filterModifiersOld(modifiers, "bonus", "magic");
    const acMagicalBonus = DDBHelper.filterModifiersOld(modifiers, "bonus", "armor-class");
    const magicBonus = DDBHelper.getModifierSum(filteredModifiers.concat(acMagicalBonus), this.rawCharacter);

    const changes = [];
    if (magicBonus && magicBonus !== 0 && magicBonus !== "") {
      changes.push(
        {
          key: "system.magicalBonus",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: magicBonus,
          priority: 20,
        },
        {
          key: "system.properties.mgc",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: true,
          priority: 20,
        }
      );
    }
    return changes;
  }

  _generateEnchantments() {
    if ((this.data.system.actionType !== "ench")) return;

    switch (this.ddbInfusion.modifierDataType) {
      case "class-level":
      case "damage-type-choice": {
        this._generateEnchantmentEffects();
        break;
      }
      case "granted":
      default: {
        this._generateEnchantmentEffects();
      }
    }
  }

  // _generateSummons() {
  //   // summons are generated elsewhere and linked to the feature, not handled her.
  // }

  async build() {
    await this.compendiumInit();
    this._generateSystemType();
    this._generateEnchantmentType();
    this._generateActionType();
    this._buildDescription();
    this._generateEnchantments();

    // build actions
    this._buildActions();
    // add to compendium folders?

    this._specials();

    await DDBInfusion.addInfusionsToCompendium([this.data]);
    await DDBInfusion.addInfusionsToCompendium(this.actions);


  }

}
