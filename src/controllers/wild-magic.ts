import { MODULE_NAME } from "../utils/constants.js";
import { getGame } from "../utils/game.js";
import { log } from "../utils/logger.js";

class WildMagic {
  static init() {
    log("Initialize WildMagic controller");
    this.settings();
  }

  static settings() {
    log("Register WildMagic settings");

    getGame().settings.register(MODULE_NAME, "enable-wild-magic", {
      name: getGame().i18n.localize("setting.EnableWildMagic.name"),
      hint: getGame().i18n.localize("setting.EnableWildMagic.hint"),
      scope: "world",
      type: Boolean,
      config: true,
      default: true
    });
  }

  static hooks() {
    log("Register WildMagic hooks");
  }
}

export default WildMagic;
