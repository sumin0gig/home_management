import type { MascotAction } from "../types";
import type { ActionDefinition } from "./types";
import idle from "./idle";
import jump from "./jump";
import walk from "./walk";

export const ACTIONS: Record<MascotAction, ActionDefinition> = {
  idle,
  jump,
  walk,
};
