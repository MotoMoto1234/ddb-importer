/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FrostRune extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Invoke Rune",
      activationType: "bonus",
      targetSelf: true,
      data: {
        duration: {
          units: "minute",
          value: 10,
        },
      },
    };
  }

  get effects() {
    return [
      {
        noCreate: true,
        name: "Frost Rune: Passive Bonuses",
        options: {
          transfer: true,
          description: `You have advantage on Wisdom (Animal Handling) checks and Charisma (Intimidation) checks.`,
        },
      },
      {
        activityMatch: "Invoke Rune",
        name: "Frost Rune",
        options: {
          transfer: false,
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.con.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.con.bonuses.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.str.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+2", 20, "system.abilities.str.bonuses.save"),
        ],
      },
    ];
  }

  get override() {
    const uses = this._getUsesWithSpent({
      name: "Frost Rune",
      type: "class",
      max: "@scale.rune-knight.rune-uses",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
