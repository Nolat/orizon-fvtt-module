import { log } from "./utils/logger";

Hooks.once("ready", () => {
  log("Ready!");
});
