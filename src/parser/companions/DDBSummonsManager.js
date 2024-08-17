import { DDBCompendiumFolders } from "../../lib/DDBCompendiumFolders.js";
import DDBItemImporter from "../../lib/DDBItemImporter.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import { addNPC } from "../../muncher/importMonster.js";

// TODO: SUmmons are now activities

const SUMMONS_ACTOR_STUB = {
  "type": "npc",
  "system": {
    "abilities": {
      "str": {
        "value": 100,
      },
      "dex": {
        "value": 100,
      },
      "con": {
        "value": 100,
      },
      "int": {
        "value": 100,
      },
      "wis": {
        "value": 100,
      },
      "cha": {
        "value": 100,
      },
    },
    "attributes": {
      "movement": {
        "burrow": null,
        "climb": null,
        "fly": null,
        "swim": null,
        "walk": null,
        "units": null,
        "hover": true,
      },
      "ac": {
        "flat": 1000,
        "calc": "flat",
      },
      "hp": {
        "value": 1000,
        "max": 1000,
        "temp": 0,
        "tempmax": 0,
        "bonuses": {},
      },
    },
    "traits": {
      "size": "tiny",
    },
  },
  "items": [],
  "effects": [],
  "folder": null,
  "prototypeToken": {
    "actorLink": false,
    "appendNumber": true,
    "prependAdjective": false,
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "anchorX": 0.5,
      "anchorY": 0.5,
      "offsetX": 0,
      "offsetY": 0,
      "fit": "contain",
      "scaleX": 1,
      "scaleY": 1,
      "rotation": 0,
      "tint": "#ffffff",
      "alphaThreshold": 0.75,
    },
    "hexagonalShape": 0,
    "lockRotation": false,
    "rotation": 0,
    "alpha": 1,
    "disposition": CONST.TOKEN_DISPOSITIONS.SECRET,
    "displayBars": 0,
    "bar1": {
      "attribute": null,
    },
    "bar2": {
      "attribute": null,
    },
    "ring": {
      "enabled": false,
    },
    "randomImg": false,
  },
};

const DANCING_LIGHTS_BASE = {
  "name": "Dancing Lights",
  "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
  "system": {
    "attributes": {
      "movement": {
        "fly": 60,
      },
    },
  },

  "prototypeToken": {
    "name": "Dancing Lights",
    "width": 0.5,
    "height": 0.5,
    "texture": {
      "src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
    },
    "light": {
      "negative": false,
      "priority": 0,
      "alpha": 0.5,
      "angle": 360,
      "bright": 0,
      "color": null,
      "coloration": 1,
      "dim": 10,
      "attenuation": 0.5,
      "luminosity": 0.5,
      "saturation": 0,
      "contrast": 0,
      "shadows": 0,
      "animation": {
        "type": "torch",
        "speed": 3,
        "intensity": 3,
        "reverse": false,
      },
      "darkness": {
        "min": 0,
        "max": 1,
      },
    },
  },
};


async function getSRDActors() {
  const results = {};
  const pack = game.packs.get("dnd5e.monsters");
  if (!pack) return results;

  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";

  const arcaneHand = await pack.getDocument("iHj5Tkm6HRgXuaWP");
  if (arcaneHand) {
    results["ArcaneHandRed"] = {
      name: "Arcane Hand (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Red)",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp",
      }),
    };
    results["ArcaneHandPurple"] = {
      name: "Arcane Hand (Purple)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Purple)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp`,
      }),
    };
    results["ArcaneHandGreen"] = {
      name: "Arcane Hand (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp`,
      }),
    };
    results["ArcaneHandBlue"] = {
      name: "Arcane Hand (Blue)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Blue)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp`,
      }),
    };
    results["ArcaneHandRock"] = {
      name: "Arcane Hand (Rock)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Rock)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp`,
      }),
    };
    results["ArcaneHandRainbow"] = {
      name: "Arcane Hand (Rainbow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Arcane Hand",
      data: foundry.utils.mergeObject(arcaneHand.toObject(), {
        "name": "Arcane Hand (Rainbow)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp`,
      }),
    };
  }

  const arcaneSword = await pack.getDocument("Tac7eq0AXJco0nml");
  if (arcaneHand) {
    results["ArcaneSwordSpectralGreen"] = {
      name: "Arcane Sword (Spectral Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Arcane Sword",
      data: foundry.utils.mergeObject(arcaneSword.toObject(), {
        "name": "Arcane Sword (Spectral Green)",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/SpiritualWeapon_Shortsword01_02_Spectral_Green_Thumb.webp",
      }),
    };

    results["ArcaneSwordAstralBlue"] = {
      name: "Arcane Sword (Astral Blue)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Arcane Sword",
      data: foundry.utils.mergeObject(arcaneSword.toObject(), {
        "name": "Arcane Sword (Astral Blue)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Shortsword01_01_Astral_Blue_Thumb.webp`,
      }),
    };
  }

  return results;
}

async function getSummonActors() {
  const jb2aMod = game.modules.get('jb2a_patreon')?.active
    ? "jb2a_patreon"
    : "JB2A_DnD5e";

  const dancingLightsBase = foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), foundry.utils.deepClone(DANCING_LIGHTS_BASE));
  const localActors = {
    ArcaneEye: {
      name: "Arcane Eye",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Arcane Eye",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Arcane Eye",
        "prototypeToken.name": "Arcane Eye",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/Marker_01_Regular_BlueYellow_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
        "effects": [
          (await ActiveEffect.implementation.fromStatusEffect("invisible")).toObject(),
        ],
      }),
    },
    DancingLightsYellow: {
      name: "Dancing Lights (Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Yellow)",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_200x200.webm",
        "prototypeToken.light": {
          "color": "#ffed7a",
          "alpha": 0.25,
        },
        "img": "modules/ddb-importer/img/jb2a/DancingLights_01_Yellow_Thumb.webp",
      }),
    },
    DancingLightsGreen: {
      name: "Dancing Lights (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a7ff7a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Green_Thumb.webp`,
      }),
    },
    DancingLightsBlueTeal: {
      name: "Dancing Lights (Blue Teal)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Teal)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_200x200.webm`,
        "prototypeToken.light": {
          "color": "#80ffff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueTeal_Thumb.webp`,
      }),
    },
    DancingLightsBlueYellow: {
      name: "Dancing Lights (Blue Yellow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Blue Yellow)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_200x200.webm`,
        "prototypeToken.light": {
          "color": "#c1e6e6",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_BlueYellow_Thumb.webp`,
      }),
    },
    DancingLightsPink: {
      name: "Dancing Lights (Pink)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Pink)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_200x200.webm`,
        "prototypeToken.light": {
          "color": "#f080ff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Pink_Thumb.webp`,
      }),
    },
    DancingLightsPurpleGreen: {
      name: "Dancing Lights (Purple Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Purple Green)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_200x200.webm`,
        "prototypeToken.light": {
          "color": "#a66bff",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_PurpleGreen_Thumb.webp`,
      }),
    },
    DancingLightsRed: {
      name: "Dancing Lights (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Dancing Lights",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(dancingLightsBase), {
        "name": "Dancing Lights (Red)",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_200x200.webm`,
        "prototypeToken.light": {
          "color": "#ff817a",
          "alpha": 0.25,
        },
        "img": `modules/${jb2aMod}/Library/Cantrip/Dancing_Lights/DancingLights_01_Red_Thumb.webp`,
      }),
    },
    MageHandRed: {
      name: "Mage Hand (Red)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: false,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Red)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_400x400.webm",
        "img": "modules/ddb-importer/img/jb2a/ArcaneHand_Human_01_Idle_Red_Thumb.webp",
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandPurple: {
      name: "Mage Hand (Purple)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Purple)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Purple_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandGreen: {
      name: "Mage Hand (Green)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Green)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Green_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandBlue: {
      name: "Mage Hand (Blue)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Blue)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Blue_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRock: {
      name: "Mage Hand (Rock)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Rock)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rock01_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
    MageHandRainbow: {
      name: "Mage Hand (Rainbow)",
      version: "1",
      required: null,
      isJB2A: true,
      needsJB2A: true,
      needsJB2APatreon: true,
      folderName: "Mage Hand",
      data: foundry.utils.mergeObject(foundry.utils.deepClone(SUMMONS_ACTOR_STUB), {
        "name": "Mage Hand (Rainbow)",
        "prototypeToken.name": "Mage Hand",
        "prototypeToken.texture.src": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_400x400.webm`,
        "img": `modules/${jb2aMod}/Library/5th_Level/Arcane_Hand/ArcaneHand_Human_01_Idle_Rainbow_Thumb.webp`,
        "system": {
          "attributes": {
            "movement": {
              "fly": 30,
            },
          },
        },
      }),
    },
  };

  const srdActors = await getSRDActors();
  return foundry.utils.mergeObject(srdActors, localActors);
}

const JB2A_LICENSE = `<p>The assets in this actor are kindly provided by JB2A and are licensed by <a href="https://creativecommons.org/licenses/by-nc-sa/4.0">Attribution-NonCommercial-ShareAlike 4.0 International</a>.</p>
<p>Check them out at <a href="https://jb2a.com">https://jb2a.com</a> they have a free and patreon supported Foundry module providing wonderful animations and assets for a variety of situations.</p>
<p>You can learn more about their Foundry modules <a href="https://jb2a.com/home/install-instructions/">here</a>.</p>`;


export default class DDBSummonsManager {

  constructor() {
    this.indexFilter = { fields: [
      "name",
      "flags.ddbimporter.compendiumId",
      "flags.ddbimporter.id",
      "flags.ddbimporter.summons",
    ] };
    this.itemHandler = null;
  }

  async init() {
    this.compendiumFolders = new DDBCompendiumFolders("summons");
    await this.compendiumFolders.loadCompendium("summons");

    this.itemHandler = new DDBItemImporter("summons", [], {
      indexFilter: this.indexFilter,
    });
    await this.itemHandler.init();
  }

  async addToCompendium(companion) {
    const results = [];
    if (!game.user.isGM) return results;
    const compendiumCompanion = foundry.utils.deepClone(companion);
    delete compendiumCompanion.folder;
    const folderName = this.compendiumFolders.getSummonFolderName(compendiumCompanion);
    const folder = await this.compendiumFolders.createSummonsFolder(folderName.name);
    compendiumCompanion.folder = folder._id;
    const npc = await addNPC(compendiumCompanion, "summons");
    results.push(npc);
    return results;
  }

  static async generateFixedSummons() {
    if (!game.user.isGM) return;
    const manager = new DDBSummonsManager();
    await manager.init();
    logger.debug("Generating Fixed summons");

    const generatedSummonedActors = await getSummonActors();
    for (const [key, value] of Object.entries(generatedSummonedActors)) {
      // check for JB2A modules
      if (value.needsJB2A
        && !game.modules.get('jb2a_patreon')?.active
        && !game.modules.get('JB2A_DnD5e')?.active
      ) continue;
      if (value.needsJB2APatreon && !game.modules.get('jb2a_patreon')?.active) continue;
      const existingSummons = manager.itemHandler.compendium.index.find((i) =>
        i.flags?.ddbimporter?.summons?.summonsKey === key,
      );

      if (existingSummons && existingSummons.flags.ddbimporter.summons.version >= value.version) continue;

      // set summons data
      const companion = foundry.utils.deepClone(value.data);
      foundry.utils.setProperty(companion, "flags.ddbimporter.summons", {
        summonsKey: key,
        version: value.version,
        folder: value.folderName,
      });
      companion._id = utils.namedIDStub(value.name, { prefix: "ddbSum" });

      if (value.isJB2A) {
        foundry.utils.setProperty(companion, "system.details.biography", {
          value: JB2A_LICENSE,
          public: JB2A_LICENSE,
        });
      }

      logger.debug(`Creating ${key}`, companion);

      await manager.addToCompendium(companion);
    }
  }


}
