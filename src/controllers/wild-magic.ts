import { MODULE_NAME } from "../utils/constants.js";
import { getGame } from "../utils/game.js";
import { log } from "../utils/logger.js";

class WildMagic {
  static init() {
    log("Initialize WildMagic controller");
    this.settings();
    this.hooks();
  }

  private static settings() {
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

  private static hooks() {
    log("Register WildMagic hooks");

    Hooks.on("midi-qol.RollComplete", async (...args: any[]) => {
      const isWildMagicEnabled = getGame().settings.get(MODULE_NAME, "enable-wild-magic");
      if (!isWildMagicEnabled) return;

      const { actor, item, itemCardData } = args[0] as BetterRollsWorkflow;

      const isSpell = item.data.type === "spell";
      const { consumeSpellLevel } = itemCardData.flags.betterrolls5e.params;

      if (isSpell && consumeSpellLevel !== null && consumeSpellLevel !== false) {
        const { slotLevel } = itemCardData.flags.betterrolls5e.params;

        if (slotLevel >= 1) {
          const hasUncontrollableMagicFeat = actor.data.items.find((i) =>
            i.data.name.includes("Magie incontrôlable")
          );

          const controlRoll = new Roll(
            hasUncontrollableMagicFeat ? `2d30kl - ${slotLevel}` : `1d30 - ${slotLevel}`
          );
          controlRoll.evaluate();

          const controlSuccess = controlRoll.total! > 1;

          controlRoll.toMessage({
            whisper: ChatMessage.getWhisperRecipients("GM"),
            flavor: "Contrôle de la magie",
            speaker: ChatMessage.getSpeaker({
              alias: `La Toile`
            })
          });

          ChatMessage.create({
            whisper: ChatMessage.getWhisperRecipients("GM"),
            flavor: "Danger de l'effet",
            speaker: ChatMessage.getSpeaker({
              alias: `La Toile`
            }),
            content: controlSuccess
              ? `${actor.name} a réussi à contrôler la magie de <b>${item.name}</b>`
              : `${actor.name} n'a pas réussi à contrôler la magie de <b>${item.name}</b>`
          });

          if (!controlSuccess) {
            const dangerRoll = new Roll(
              hasUncontrollableMagicFeat ? `2d20kl - ${slotLevel}` : `1d20 - ${slotLevel}`
            );
            dangerRoll.evaluate();

            const danger =
              dangerRoll.total! <= 3 ? "Extrême" : dangerRoll.total! <= 9 ? "Modéré" : "Nuisance";

            dangerRoll.toMessage({
              whisper: ChatMessage.getWhisperRecipients("GM"),
              flavor: "Danger de l'effet",
              speaker: ChatMessage.getSpeaker({
                alias: `La Toile`
              })
            });

            ChatMessage.create({
              whisper: ChatMessage.getWhisperRecipients("GM"),
              flavor: "Danger de l'effet",
              speaker: ChatMessage.getSpeaker({
                alias: `La Toile`
              }),
              content: `Le niveau de danger de l'effet de ${item.name} est <b>${danger}</b>`
            });

            const tableName = `Magie sauvage (${danger})`;

            const table = getGame().tables?.getName(tableName);
            if (!table) throw new Error(`Cannot find table with name ${tableName}`);

            const result = await table.roll();

            ChatMessage.create({
              content: (result.results[0].data as any).text,
              speaker: ChatMessage.getSpeaker({
                alias: `La Toile`
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
