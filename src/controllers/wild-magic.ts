import { MODULE_NAME } from "../utils/constants.js";
import { getGame } from "../utils/game.js";
import { log } from "../utils/logger.js";

class WildMagic {
  static init() {
    log("Initialize WildMagic controller");
    this.settings();
    this.hooks();
  }

  static settings() {
    log("Register WildMagic settings");

    getGame().settings.register(MODULE_NAME, "enable-wild-magic", {
      name: "Magie Sauvage",
      hint: "Si activé, dès qu'un lanceur de sorts utilise un emplacement, il a une chance d'avoir un effet de magie sauvage aléatoire.",
      scope: "world",
      type: Boolean,
      config: true,
      default: true
    });
  }

  static hooks() {
    log("Register WildMagic hooks");

    Hooks.on("midi-qol.RollComplete", async (...args: any[]) => {
      if (!getGame().settings.get(MODULE_NAME, "enable-wild-magic")) return;

      log({ args });

      const { actor, item } = args[0] as BetterRolssWorkflow;
      if (actor.data.effects.find((e) => e.data.label.includes("Magie sauvage"))) return;

      const isSpell = item.data.type === "spell";

      if (isSpell) {
        const spell = item.data.data as data5e.Spell;
        const { level } = spell;

        if (level >= 1) {
          const controlRoll = new Roll("1d30");
          controlRoll.evaluate();
          const controlSuccess = controlRoll.total! - level > 1;

          if (controlSuccess) {
            const dangerRoll = new Roll("1d20");
            dangerRoll.evaluate();

            const danger =
              dangerRoll.total! - level <= 3
                ? "Extrême"
                : dangerRoll.total! - level <= 9
                ? "Modéré"
                : "Nuisance";

            const tableName = `Magie sauvage (${danger})`;

            const table = getGame().tables?.getName(tableName);
            if (!table) throw new Error(`Cannot find table with name ${tableName}`);

            const result = await table.roll();

            ChatMessage.create({
              content: (result.results[0].data as any).text,
              speaker: ChatMessage.getSpeaker({
                alias: "La Toile"
              }),
              whisper: ChatMessage.getWhisperRecipients("GM")
            });
          }
        }
      }
    });
  }
}

export default WildMagic;
