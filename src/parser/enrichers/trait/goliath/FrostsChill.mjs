/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FrostsChill extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              type: "cold",
            }),
          ],
        },
      },
    };
  }

  get effects() {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.uses": this._getUsesWithSpent({
          type: "race",
          name: this.ddbParser.originalName,
          max: "@prof",
          period: "lr",
        }),
      },
    };
  }
}
