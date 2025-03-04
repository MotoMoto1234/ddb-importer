import { logger, utils } from "../../../lib/_module.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";

// eslint-disable-next-line no-unused-vars
const ELRITCH_CANNON_ABILITY_STUB = {
  id: 1,
  entityTypeId: 1120657896,
  limitedUse: null,
  name: "",
  description: "",
  snippet: "",
  abilityModifierStatId: 1,
  saveStatId: null,
  attackTypeRange: 1,
  actionType: 1,
  attackSubtype: 3,
  dice: null,
  value: null,
  damageTypeId: 1,
  isMartialArts: false,
  isProficient: true,
  spellRangeType: null,
  displayAsAttack: null,
  range: null,
  activation: {
    activationTime: 1,
    activationType: 1,
  },
  componentId: 0,
  componentTypeId: 0,
};

export async function getEldritchCannons({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {
  logger.verbose("getEldritchCannon", {
    ddbParser,
    document,
    raw,
    text,
  });
  const cannonStub = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB()), {
    name: "Eldritch Cannon",
    img: "icons/weapons/guns/gun-blunderbuss-gold.webp",
    system: {
      abilities: {
        str: {
          value: 10,
        },
        dex: {
          value: 10,
        },
        con: {
          value: 10,
        },
        int: {
          value: 10,
        },
        wis: {
          value: 10,
        },
        cha: {
          value: 10,
        },
      },
      attributes: {
        movement: {
          burrow: null,
          climb: "15",
          fly: null,
          swim: null,
          walk: "15",
          units: null,
          hover: true,
        },
        ac: {
          flat: 18,
          calc: "flat",
        },
        hp: {
          value: 1,
          max: 1,
        },
      },
      traits: {
        size: "sm",
        ci: {
          value: [],
        },
        di: {
          value: ["poison", "psychic"],
        },
      },
    },
    prototypeToken: {
      name: "Eldritch Cannon",
      width: 0.5,
      height: 0.5,
      texture: {
        src: "icons/weapons/guns/gun-blunderbuss-gold.webp",
      },
    },
  });

  const version = ddbParser.is2014 ? "2014" : "2024";
  const results = {};

  const cannons = [
    { name: "Force Ballista", min: null, max: 9 },
    { name: "Flamethrower", min: null, max: 9 },
    { name: "Protector", min: null, max: 9 },
    // { name: "Explosive Force Ballista", min: 9, max: null },
    // { name: "Explosive Flamethrower", min: 9, max: null },
    // { name: "Explosive Protector", min: 9, max: null },
  ];

  const doc = utils.htmlToDoc(raw);

  const cannonTable = doc.querySelectorAll("tbody")[0];

  const actionData = [];
  const rows = cannonTable.querySelectorAll("tr");
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    const name = cells[0].textContent.trim();
    const content = cells[1].textContent.trim();
    actionData.push({ name, content });
  });

  for (const cannon of cannons) {
    let stub = foundry.utils.deepClone(cannonStub);

    stub.name = `${cannon.name}`;
    stub.prototypeToken.name = `${cannon.name}`;

    const actionText = actionData.find((a) => cannon.name.includes(a.name))?.content ?? "";
    const description = `<p><em><strong>${cannon.name}.</strong></em> ${actionText}`;
    const manager = new DDBCompanionMixin(description, { forceRulesVersion: version }, { addMonsterEffects: true });
    manager.npc = stub;
    const features = await manager.getFeature(description, "special");
    stub.items = features;
    stub = await DDBCompanionMixin.addEnrichedImageData(stub);
    const enriched = foundry.utils.getProperty(document, "flags.monsterMunch.enrichedImages");

    results[`EldritchCannon${utils.idString(cannon.name)}${version}`] = {
      name: cannon.name,
      version: enriched ? "2" : "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Eldritch Cannon",
      data: stub,
    };
  }

  // console.warn("EldritchCannon result", results);
  logger.verbose("Eldritch Cannon results", results);
  return results;
}
