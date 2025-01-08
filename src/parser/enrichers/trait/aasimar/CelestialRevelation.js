/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CelestialRevelation extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Unleash Celestial Energy",
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
      noeffect: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "1/turn",
          targetType: "creature",
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
      {
        constructor: {
          name: "Necrotic Shroud Save",
          type: "save",
        },
        build: {
          generateSave: true,
          generateConsumption: false,
          noeffect: true,
        },
        overrides: {
          activationType: "special",
          targetType: "enemy",
          data: {
            ability: ["cha"],
            dc: {
              calculation: "cha",
              formula: "",
            },
          },
        },
      },
    ];
  }

  // get activity() {
  //   return {
  //     noTemplate: true,
  //     data: {
  //       damage: {
  //         parts: [
  //           DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["radiant", "necrotic"] }),
  //         ],
  //       },
  //     },
  //   };
  // }

  get effects() {
    return [
      {
        name: "Heavenly Wings",
        options: {
          durationSeconds: 60,
        },
        changes: [
          this.movementChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Necrotic Shroud: Frightened",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 6,
        },
        daeSpecialDurations: ["turnEndSource"],
      },
    ];
  }

  get override() {
    return {
      descriptionSuffix: `<br><p>[[/ddbifunc functionName="innerRadiance" functionType="feat"]]{Toggle Inner Radiance Light}</div></p>`,
    };
  }

}
