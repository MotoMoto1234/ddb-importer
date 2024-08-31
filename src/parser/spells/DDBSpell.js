import DDBHelper from "../../lib/DDBHelper.js";
import DICTIONARY from "../../dictionary.js";
import logger from "../../logger.js";
import SETTINGS from "../../settings.js";
import utils from "../../lib/utils.js";

// Import parsing functions
import { generateTable } from "../../lib/DDBTable.js";
import { parseTags } from "../../lib/DDBReferenceLinker.js";
import { spellEffectAdjustment } from "../../effects/specialSpells.js";
import DDBCompanionFactory from "../companions/DDBCompanionFactory.js";
import DDBSpellActivity from "./DDBSpellActivity.js";
import DDBSpellEnricher from "../enrichers/DDBSpellEnricher.js";

export default class DDBSpell {

  _generateDataStub() {
    this.data = {
      _id: utils.namedIDStub(this.name, { postfix: this.namePostfix }),
      type: "spell",
      system: utils.getTemplate("spell"),
      name: this.name,
      flags: {
        ddbimporter: {
          id: this.spellData.id,
          definitionId: this.spellDefinition.id,
          entityTypeId: this.spellData.entityTypeId,
          dndbeyond: this.spellData.flags.ddbimporter.dndbeyond,
          originalName: this.originalName,
          sources: this.spellDefinition.sources,
          tags: this.spellDefinition.tags,
          version: CONFIG.DDBI.version,
        },
        "midi-qol": {
          removeAttackDamageButtons: "default",
        },
        midiProperties: {
          confirmTargets: "default",
          magicdam: true,
          magiceffect: true,
        },
        "spell-class-filter-for-5e": this.spellData.flags["spell-class-filter-for-5e"],
        "tidy5e-sheet": this.spellData.flags["tidy5e-sheet"],
      },
    };
  }

  getCustomName(data) {
    if (!this.rawCharacter
      || (this.rawCharacter && !foundry.utils.hasProperty(this.rawCharacter, "flags.ddbimporter.dndbeyond.characterValues"))
    ) return null;
    const characterValues = this.rawCharacter.flags.ddbimporter.dndbeyond.characterValues;
    const customValue = characterValues.filter((value) => value.valueId == data.id && value.valueTypeId == data.entityTypeId);

    if (customValue) {
      const customName = customValue.find((value) => value.typeId == 8);

      if (customName) {
        data.name = customName.vale;
        return customName.value;
      }
      if (customName) return customName.value;
    }
    return null;
  }


  getName() {
    // spell name
    const customName = this.getCustomName(this.spellData);
    if (customName) {
      return utils.nameString(customName);
    } else if (this.nameOverride) {
      return utils.nameString(this.nameOverride);
    } else {
      return utils.nameString(this.spellDefinition.name);
    }
  }


  constructor({
    ddbData, spellData, rawCharacter = null, namePostfix = null, isGeneric = null, updateExisting = null,
    limitedUse = null, forceMaterial = null, klass = null, lookup = null, lookupName = null, ability = null,
    spellClass = null, dc = null, overrideDC = null, nameOverride = null, isHomebrew = null,
  } = {}) {
    this.ddbData = ddbData;
    this.spellData = spellData;
    this.spellDefinition = spellData.definition;
    this.rawCharacter = rawCharacter;
    this.namePostfix = namePostfix;
    this.nameOverride = nameOverride ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.nameOverride");
    this.originalName = utils.nameString(this.spellDefinition.name);
    this.name = this.getName(this.spellData, this.rawCharacter);
    this.data = {};
    this.activities = [];
    this.activityTypes = [];
    this.activityType = null;
    this.additionalActivities = [];

    this.healingParts = [];

    this.isGeneric = isGeneric ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.generic");
    this.addSpellEffects = isGeneric
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-spell-effects")
      : game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects");
    foundry.utils.setProperty(this.data, "flags.ddbimporter.addSpellEffects", this.addSpellEffects);

    this.updateExisting = updateExisting ?? this.isGeneric
      ? game.settings.get("ddb-importer", "munching-policy-update-existing")
      : false;
    this.pactSpellsPrepared = game.settings.get("ddb-importer", "pact-spells-prepared");
    this.limitedUse = limitedUse ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.limitedUse");
    this.forceMaterial = forceMaterial ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.forceMaterial");
    this.spellClass = klass ?? spellClass ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.class");
    this.lookup = lookup ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.lookup");
    this.lookupName = lookupName ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.lookupName");
    this.ability = ability ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.ability");
    this.school = DICTIONARY.spell.schools.find((s) => s.name === this.spellDefinition.school.toLowerCase());
    this.dc = dc ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.dc");
    this.overrideDC = overrideDC ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.overrideDC");
    this.isHomebrew = isHomebrew ?? foundry.utils.getProperty(this.spellData, "flags.ddbimporter.dndbeyond.homebrew");

    this._generateDataStub();

    this.enricher = new DDBSpellEnricher({
      document: this.data,
      name: this.originalName,
    });
    this.DDBCompanionFactory = null; // lazy init
  }

  _generateProperties() {
    if (this.spellDefinition.components.includes(1)) this.data.system.properties.push("vocal");
    if (this.spellDefinition.components.includes(2)) this.data.system.properties.push("somatic");
    if (this.spellDefinition.components.includes(3) || this.forceMaterial) {
      this.data.system.properties.push("material");
    }
    if (this.spellDefinition.ritual) this.data.system.properties.push("ritual");
    if (this.spellDefinition.concentration) this.data.system.properties.push("concentration");
  }

  _generateMaterials() {
    // this is mainly guessing
    if (this.spellDefinition.componentsDescription && this.spellDefinition.componentsDescription.length > 0) {
      let cost = 0;
      let matches = this.spellDefinition.componentsDescription.toLowerCase().match(/([\d.,]+)\s*gp/);
      if (matches) {
        cost = parseInt(matches[1].replace(/,|\./g, ""));
      }

      this.data.system.materials = {
        value: this.spellDefinition.componentsDescription,
        consumed: this.spellDefinition.componentsDescription.toLowerCase().indexOf("consume") !== -1,
        cost: cost,
        supply: 0,
      };
    } else {
      this.data.system.materials = {
        value: "",
        consumed: false,
        cost: 0,
        supply: 0,
      };
    }
  }

  _generateClassPreparationMode() {
    const classPrepMode = utils.findByProperty(
      DICTIONARY.spell.preparationModes,
      "name",
      this.spellClass,
    );

    if (this.spellData.restriction === "As Ritual Only"
      || this.spellData.castOnlyAsRitual
      || this.spellData.ritualCastingType !== null
    ) {
      this.data.system.preparation.mode = "ritual";
      this.data.system.preparation.prepared = false;
    } else if (!this.spellData.usesSpellSlot && this.spellDefinition.level !== 0) {
      // some class features such as druid circle of stars grants x uses of a spell
      // at the lowest level. for these we add as an innate.
      this.data.system.preparation.mode = "innate";
    } else if (this.spellData.alwaysPrepared) {
      this.data.system.preparation.mode = "always";
    } else if (this.data.system.preparation.mode && classPrepMode) {
      this.data.system.preparation.mode = classPrepMode.value;
    }
    // Warlocks should use Pact spells
    // but lets mark level 0 as regular spells so they show up as cantrips
    if (this.data.system.preparation.mode === "pact" && this.spellDefinition.level === 0) {
      this.data.system.preparation.mode = "prepared";
      this.data.system.preparation.prepared = true;
    } else if (this.data.system.preparation.mode === "pact" && this.pactSpellsPrepared) {
      this.data.system.preparation.prepared = true;
    }
  }

  _generateSpellPreparationMode() {
    // default values
    this.data.system.preparation = {
      mode: "prepared",
      // If always prepared mark as such, if not then check to see if prepared
      prepared: this.spellData.alwaysPrepared || this.spellData.prepared,
    };

    // handle classSpells
    const featureClass = this.lookup === "classFeature"
      && this.spellClass;

    if (this.lookup === "classSpell" || featureClass) {
      this._generateClassPreparationMode();
    } else if (this.lookup === "race" && this.spellDefinition.level !== 0) {
      // set race spells as innate
      this.data.system.preparation.mode = "innate";
      if (this.spellData.usesSpellSlot) {
        // some racial spells allow the spell to also be added to spell lists
        this.data.system.preparation.mode = "always";
      }
    } else if (
      // Warlock Mystic Arcanum are passed in as Features
      this.lookupName.startsWith("Mystic Arcanum")
    ) {
      // these have limited uses (set with getUses())
      this.data.system.preparation.mode = "pact";
      this.data.system.preparation.prepared = false;
    } else if (this.lookup === "item " && this.spellDefinition.level !== 0) {
      this.data.system.preparation.mode = "prepared";
      this.data.system.preparation.prepared = false;
    } else {
      // If spell doesn't use a spell slot and is not a cantrip, mark as always preped
      let always = !this.spellData.usesSpellSlot && this.spellDefinition.level !== 0;
      let ritaulOnly = this.spellData.ritualCastingType !== null || this.spellData.castOnlyAsRitual; // e.g. Book of ancient secrets & totem barb
      if (always && ritaulOnly) {
        // in this case we want the spell to appear in the spell list unprepared
        this.data.system.preparation.mode = "ritual";
        this.data.system.preparation.prepared = false;
      } else if (always) {
        // these spells are always prepared, and have a limited use that's
        // picked up by getUses() later
        // this was changed to "atwill"
        this.data.system.preparation.mode = "atwill";
      }
      if (this.lookup === "classFeature") {
        if (this.spellData.alwaysPrepared) {
          this.data.system.preparation.mode = "always";
        }
      }
    }
  }

  async _generateDescription() {
    let description = await generateTable(this.data.name, this.spellDefinition.description, this.updateExisting);
    this.data.system.description = {
      value: parseTags(description),
      chat: "",
    };
  }

  _generateActivation() {
    // for newer override spells, activation is at higher level
    const activation = this.spellData.activation ?? this.spellDefinition.activation;
    const activationType = DICTIONARY.spell.activationTypes.find(
      (type) => type.activationType === activation.activationType,
    );
    if (activationType && activation.activationTime) {
      this.data.system.activation = {
        type: activationType.value,
        value: activation.activationTime,
        condition: this.spellDefinition.castingTimeDescription ?? "",
      };
    } else {
      this.data.system.activation = {
        type: "action",
        value: 1,
        condition: this.spellDefinition.castingTimeDescription ?? "",
      };
    }
  }

  _generateDuration() {
    if (this.spellDefinition.duration) {
      let units = "";
      if (this.spellDefinition.duration.durationUnit !== null) {
        units = this.spellDefinition.duration.durationUnit.toLowerCase();
      } else {
        units = this.spellDefinition.duration.durationType.toLowerCase().substring(0, 4);
      }
      this.data.system.duration = {
        concentration: this.spellDefinition.concentration,
        value: this.spellDefinition.duration.durationInterval ?? "",
        units: units,
      };
    }
  }


  // Does the spell target creatures?
  targetsCreature() {
    const creature = /You touch (?:a|one) (?:willing |living )?creature|affecting one creature|creature you touch|a creature you|creature( that)? you can see|interrupt a creature|would strike a creature|creature of your choice|creature or object within range|cause a creature|creature must be within range|a creature in range/gi;
    const creaturesRange = /(humanoid|monster|creature|target|beast)(s)? (or loose object )?(of your choice )?(that )?(you can see )?within range/gi;
    const targets = /spell attack against the target|at a target in range/gi;
    return this.spellDefinition.description.match(creature)
      || this.spellDefinition.description.match(creaturesRange)
      || this.spellDefinition.description.match(targets);
  }

  /**
   * Get Target Value
   * Uses regex magic to try and determine the number of creatures affected
   */
  _getTargetValue() {
    const numCreatures = /(?!At Higher Levels.*)(\w*) (falling )?(willing )?(creature|target|monster|celestial|fiend|fey|corpse(s)? of|humanoid)(?!.*you have animated)/gim;
    const targets = [...this.spellDefinition.description.matchAll(numCreatures)];
    const targetValues = targets
      .filter((target) => {
        const matches = DICTIONARY.numbers.filter((n) => n.natural === target[1].toLowerCase());
        return Array.isArray(matches) && !!matches.length;
      })
      .map((target) => DICTIONARY.numbers.find((n) => n.natural === target[1].toLowerCase()).num);

    if (Array.isArray(targetValues) && !!targetValues.length) {
      return Math.max(...targetValues);
    } else {
      return null;
    }
  }

  // eslint-disable-next-line complexity
  _generateTarget() {
    let target = {
      prompt: true,
      affects: {
        count: "",
        type: "",
        choice: false,
        special: "",
      },
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
    };

    const thickReg = new RegExp(/ (\d*) foot (thick|wide)/);
    const thickMatch = this.spellDefinition.description.match(thickReg);
    if (thickMatch && thickMatch[1] > 5) {
      target.template.width = parseInt(thickMatch[1]);
    }

    const heightReg = new RegExp(/ (\d*) foot (tall|high)/);
    const heightMatch = this.spellDefinition.description.match(heightReg);
    if (heightMatch && heightMatch[1] > 5) {
      target.template.height = parseInt(heightMatch[1]);
    }

    // if spell is an AOE effect get some details
    if (this.spellDefinition.range.aoeType && this.spellDefinition.range.aoeValue) {
      target.template.size = parseInt(this.spellDefinition.range.aoeValue);
      target.template.type = this.spellDefinition.range.aoeType.toLowerCase();
      this.data.system.target = target;
      return;
    }

    // does the spell target a creature?
    const targetsCreatures = this.targetsCreature();

    if (targetsCreatures) {
      target.affects.count = this._getTargetValue();
    }

    const rangeValue = foundry.utils.getProperty(this.spellDefinition, "range.rangeValue");

    switch (this.spellDefinition.range.origin) {
      case "Touch":
        if (targetsCreatures) {
          target.affects.count = "1";
          target.affects.type = "creature";
        }
        break;
      case "Self": {
        const dmgSpell = this.spellDefinition.modifiers.some((mod) => mod.type === "damage");
        if (dmgSpell && rangeValue) {
          this.data.system.range.value = rangeValue;
          this.data.system.range.units = "ft";
          target.template.type = "radius";
        } else if (dmgSpell) {
          target.affects.type = "creature";
        } else {
          target.affects.type = "self";
        }
        break;
      }
      case "None":
        target.affects.type = "none";
        break;
      case "Ranged":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Feet":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Miles":
        if (targetsCreatures) target.affects.type = "creature";
        break;
      case "Sight":
      case "Special":
        this.data.system.range.units = "spec";
        break;
      case "Any":
        this.data.system.range.units = "any";
        break;
      case undefined:
        target.affects.type = "";
        break;
      // no default
    }

    // wall type spell?
    if (this.spellDefinition.name.includes("Wall")) {
      target.template.type = "wall";
      target.template.units = "ft";

      if (this.spellDefinition.description.includes("ten 10-foot-")) {
        target.template.size = 100;
      } else {
        const wallReg = new RegExp(/ (\d*) feet long/);
        const matches = this.spellDefinition.description.match(wallReg);
        if (matches) {
          target.template.size = parseInt(matches[1]);
        }
      }
    }

    this.data.system.target = target;
  }

  _generateRange() {
    let value = this.spellDefinition.range.rangeValue ?? null;
    let units = "ft";

    switch (this.spellDefinition.range.origin) {
      case "Touch":
        value = null;
        units = "touch";
        break;
      case "Self":
        value = null;
        units = "self";
        break;
      case "None":
        units = "none";
        break;
      case "Ranged":
        units = "ft";
        break;
      case "Feet":
        units = "ft";
        break;
      case "Miles":
        units = "ml";
        break;
      case "Sight":
      case "Special":
        units = "spec";
        break;
      case "Any":
        units = "any";
        break;
      case undefined:
        units = null;
        break;
      // no default
    }

    this.data.system.range = {
      value: value,
      units: units,
    };
  }

  _generateUses() {
    this.data.system.uses = {
      spent: null,
      max: null,
      recovery: [],
    };

    // we check this, as things like items have useage attached to the item, not spell
    const limitedUse = this.limitedUse ?? this.spellData.limitedUse;

    if (!limitedUse) return;
    const resetType = DICTIONARY.resets.find((reset) => reset.id == limitedUse.resetType);
    if (!resetType) {
      logger.warn("Unknown reset type", {
        resetType: limitedUse.resetType,
        spell: this,
      });
      return;
    }

    if (limitedUse.maxUses || limitedUse.statModifierUsesId || limitedUse.useProficiencyBonus) {
      let maxUses = (limitedUse.maxUses && limitedUse.maxUses !== -1) ? limitedUse.maxUses : "";

      if (limitedUse.statModifierUsesId) {
        const ability = DICTIONARY.character.abilities.find(
          (ability) => ability.id === limitedUse.statModifierUsesId,
        ).value;

        switch (limitedUse.operator) {
          case 2: {
            // maxUses *= character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            maxUses = `${maxUses} * @abilities.${ability}.mod`;
            break;
          }
          case 1:
          default:
            // maxUses += character.flags.ddbimporter.dndbeyond.effectAbilities[ability].mod;
            maxUses = `${maxUses} + @abilities.${ability}.mod`;
        }
      }

      if (limitedUse.useProficiencyBonus) {
        switch (limitedUse.proficiencyBonusOperator) {
          case 2: {
            // maxUses *= character.system.attributes.prof;
            maxUses = `${maxUses} * @prof`;
            break;
          }
          case 1:
          default:
            // maxUses += character.system.attributes.prof;
            maxUses = `${maxUses} + @prof`;
        }
      }

      const finalMaxUses = (maxUses !== "") ? maxUses : null;

      this.data.system.uses = {
        spent: limitedUse.numberUsed ?? null,
        max: finalMaxUses,
        recovery: resetType
          ? [{
            // TODO: if charges returned here maybe don't?
            period: resetType.value,
            type: 'recoverAll',
          }]
          : [],
      };
    }
  }

  #generateHealingParts() {
    const activityParser = new DDBSpellActivity({
      type: "heal",
      ddbParent: this,
    });

    const heals = this.spellDefinition.modifiers.filter((mod) =>
      mod.type === "bonus"
      && ["temporary-hit-points", "hit-points"].includes(mod.subType),
    );

    heals.forEach((heal) => {
      let healingPart = {
        part: null,
        chatFlavor: null,
      };
      const restrictionText = heal.restriction && heal.restriction !== "" ? heal.restriction : "";
      if (restrictionText !== "") {
        healingPart.chatFlavor = `Restriction: ${restrictionText}`;
      }

      const healValue = (heal.die.diceString) ? heal.die.diceString : heal.die.fixedValue;
      const diceString = heal.usePrimaryStat
        ? `${healValue} + @mod${activityParser.healingBonus}`
        : `${healValue}${activityParser.healingBonus}`;
      if (diceString && diceString.trim() !== "" && diceString.trim() !== "null") {
        const damage = activityParser.buildDamagePart({
          damageString: diceString,
          type: heal.subType === "hit-points" ? "healing" : "temphp",
        });
        healingPart.part = damage;
        this.healingParts.push(healingPart);
      }
    });
  }

  _getSaveActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const saveActivity = new DDBSpellActivity({
      name,
      type: "save",
      ddbParent: this,
      nameIdPrefix: "save",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    saveActivity.build(foundry.utils.mergeObject({
      generateSave: true,
      generateDamage: true,
    }, options));

    return saveActivity;
  }

  _getAttackActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const attackActivity = new DDBSpellActivity({
      name,
      type: "attack",
      ddbParent: this,
      nameIdPrefix: "attack",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    attackActivity.build(foundry.utils.mergeObject({
      generateAttack: true,
      generateDamage: true,
    }, options));
    return attackActivity;
  }

  _getUtilityActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const utilityActivity = new DDBSpellActivity({
      name,
      type: "utility",
      ddbParent: this,
      nameIdPrefix: "utility",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    utilityActivity.build(foundry.utils.mergeObject({
      generateDamage: false,
    }, options));

    return utilityActivity;
  }

  _getHealActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const healActivity = new DDBSpellActivity({
      name,
      type: "heal",
      ddbParent: this,
      nameIdPrefix: "heal",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    healActivity.build(foundry.utils.mergeObject({
      generateDamage: false,
      generateHealing: true,
    }, options));

    return healActivity;
  }

  _getDamageActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const damageActivity = new DDBSpellActivity({
      name,
      type: "damage",
      ddbParent: this,
      nameIdPrefix: "damage",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    damageActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: true,
    }, options));
    return damageActivity;
  }

  _getEnchantActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const enchantActivity = new DDBSpellActivity({
      name,
      type: "enchant",
      ddbParent: this,
      nameIdPrefix: "enchant",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    enchantActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: false,
    }, options));
    return enchantActivity;
  }

  async #generateSummons() {
    if (!SETTINGS.COMPANIONS.COMPANION_SPELLS.includes(this.originalName)) return;
    this.ddbCompanionFactory = new DDBCompanionFactory(this.spellDefinition.description, {
      type: "spell",
      originDocument: this.data,
    });
    await this.ddbCompanionFactory.parse();
    // always update compendium imports, but respect player import disable
    if (this.isGeneric || game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions")) {
      await this.ddbCompanionFactory.updateOrCreateCompanions();
    }

    logger.debug(`parsed companions for ${this.data.name}`, {
      factory: this.ddbCompanionFactory,
      parsed: this.ddbCompanionFactory.companions,
    });
  }

  async _getSummonActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const summonActivity = new DDBSpellActivity({
      name,
      type: "summon",
      ddbParent: this,
      nameIdPrefix: "summon",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    summonActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateDamage: false,
    }, options));

    await this.ddbCompanionFactory.addCompanionsToDocuments([], summonActivity.data);
    return summonActivity;
  }

  _getCheckActivity({ name = null, nameIdPostfix = null } = {}, options = {}) {
    const checkActivity = new DDBSpellActivity({
      name,
      type: "check",
      ddbParent: this,
      nameIdPrefix: "check",
      nameIdPostfix: nameIdPostfix ?? this.type,
    });

    checkActivity.build(foundry.utils.mergeObject({
      generateAttack: false,
      generateRange: false,
      generateDamage: false,
      generateCheck: true,
      generateActivation: true,
    }, options));
    return checkActivity;
  }

  _getActivitiesType() {
    if (SETTINGS.COMPANIONS.COMPANION_SPELLS.includes(this.originalName)) {
      return "summon";
    }
    if (this.spellDefinition.requiresSavingThrow && !this.spellDefinition.requiresAttackRoll) {
      return "save";
    } else if (this.spellDefinition.tags.includes("Damage") && this.spellDefinition.requiresAttackRoll) {
      return "attack";
    } else if (this.spellDefinition.tags.includes("Damage")) {
      return "damage";
    } else if (this.spellDefinition.tags.includes("Healing") && this.healingParts.length === 0) {
      return "utility"; // e.g. things like lesser restoration
    } else if (this.spellDefinition.tags.includes("Buff")) {
      return "utility";
    }
    // TODO: Enchants like for magic weapon etc
    // TODO: Summoning
    return undefined;
  }

  async getActivity({ typeOverride = null, typeFallback = null, name = null, nameIdPostfix = null } = {}, options = {}) {
    const type = typeOverride ?? this._getActivitiesType();
    this.activityTypes.push(type);
    const data = { name, nameIdPostfix };
    switch (type) {
      case "save":
        return this._getSaveActivity(data, options);
      case "attack":
        return this._getAttackActivity(data, options);
      case "damage":
        return this._getDamageActivity(data, options);
      case "heal":
        return this._getHealActivity(data, options);
      case "utility":
        return this._getUtilityActivity(data, options);
      case "enchant":
        return this._getEnchantActivity(data, options);
      case "summon": {
        const activity = await this._getSummonActivity(data, options);
        return activity;
      }
      case "check":
        return this._getCheckActivity(data, options);
      case "spell":
      case "teleport":
      case "transform":
      case "forward":
      default:
        if (typeFallback) {
          const activity = await this.getActivity({ typeOverride: typeFallback, name, nameIdPostfix }, options);
          return activity;
        }
        // return undefined;
        // spells should always generate an activity
        return this._getUtilityActivity(data, options);
    }
  }

  async _generateActivity({ hintsOnly = false, name = null, nameIdPostfix = null, typeOverride = null } = {},
    optionsOverride = {},
  ) {
    if (hintsOnly && !this.enricher.activity) return undefined;

    const activity = await this.getActivity({
      typeOverride: typeOverride ?? this.enricher.activity?.type,
      name,
      nameIdPostfix,
    }, optionsOverride);

    console.warn(`Spell Activity Check for ${this.data.name}`, {
      this: this,
      activity,
      typeOverride,
      enricherHint: this.enricher.activity?.type,
      activityType: activity?.data?.type,
      optionsOverride,
      name,
      hintsOnly,
      nameIdPostfix,
    });

    if (!activity) {
      logger.debug(`No Activity type found for ${this.data.name}`, {
        this: this,
      });
      return undefined;
    }

    if (!this.activityType) this.activityType = activity.data.type;

    this.enricher.applyActivityOverride(activity.data);
    this.activities.push(activity);
    foundry.utils.setProperty(this.data, `system.activities.${activity.data._id}`, activity.data);

    return activity.data._id;
  }

  async _applyEffects() {
    //TODO: once spell effects adjusted
    // await spellEffectAdjustment(this.data, this.addSpellEffects);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.effectsApplied", true);

    let effect = this.enricher.createEffect();
    if (effect) {
      this.data.effects.push(effect);
    }
  }

  #addHealAdditionalActivities() {
    for (const part of this.healingParts) {
      this.additionalActivities.push({
        type: "heal",
        options: {
          generateDamage: false,
          includeBaseDamage: false,
          generateHealing: true,
          healingPart: part,
        },
      });
    }
  }

  async #generateAdditionalActivities() {
    if (this.additionalActivities.length === 0) return;
    logger.debug(`Additional Spell Activities for ${this.data.name}`, this.additionalActivities);
    let i = 0;
    for (const activityData of this.additionalActivities) {
      i++;
      const id = this._generateActivity({
        hintsOnly: false,
        name: activityData.name,
        nameIdPostfix: i,
        typeOverride: activityData.type,
      }, activityData.options);
      logger.debug(`Generated additional Activity with id ${id}`, {
        this: this,
        activityData,
        id,
      });
    }
  }

  async parse() {
    this.data.system.level = this.spellDefinition.level;
    this.data.system.school = (this.school) ? this.school.id : null;
    this.data.system.source = DDBHelper.parseSource(this.spellDefinition);

    if (this.spellClass) {
      this.data.system.sourceClass = this.spellClass;
    }
    this._generateProperties();
    this._generateMaterials();
    this._generateSpellPreparationMode();
    this._generateDescription();
    this._generateActivation();
    this._generateDuration();
    this._generateRange();
    this._generateTarget();
    this._generateUses();
    this.#generateHealingParts(); // used in activity

    await this.#generateSummons();
    await this._generateActivity();
    this.#addHealAdditionalActivities();
    await this.#generateAdditionalActivities();
    this.enricher.addAdditionalActivities(this);

    // TO DO: activities
    // this.data.system.save = getSave(this.spellData);

    await this._applyEffects();

    // ensure the spell ability id is correct for the spell
    // this.data.system.spellcasting = {
    // progression: spellProgression.value,
    // ability: spellCastingAbility,
    if (this.rawCharacter && !this.spellClass) {
      this.data.system.ability = this.ability;
      // if (this.data.system.save.scaling == "spell") {
      //   this.data.system.save.scaling = this.ability;
      // }
    }


    this.enricher.addDocumentOverride();
  }

  static async parseSpell(data, character, { namePostfix = null } = {}) {
    const spell = new DDBSpell({
      ddbData: null,
      spellData: data,
      rawCharacter: character,
      namePostfix: namePostfix,
    });
    await spell.parse();

    return spell.data;
  }


}
