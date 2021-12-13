import WildMagic from "./controllers/wild-magic.js";

Hooks.once("ready", () => {
  WildMagic.init();
});
