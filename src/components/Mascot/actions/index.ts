import type { MascotAction } from "../types";
import type { ActionDefinition } from "./types";
import idle from "./idle";
import jump from "./jump";

export const ACTIONS: Record<MascotAction, ActionDefinition> = {
  idle,
  jump,
};
