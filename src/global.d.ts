import { ChatMessageData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";

declare global {
  declare namespace ClientSettings {
    interface Values {
      "orizon-fvtt-module.enable-wild-magic": boolean;
    }
  }

  interface BetterRollsWorkflow {
    actor: Actor5e;
    item: Item5e;
    itemCardData: ChatMessageData & {
      flags: Record<string, unknown> & {
        betterrolls5e: {
          params: { consumeSpellLevel: string | boolean; slotLevel: number };
        };
      };
    };
  }
}
