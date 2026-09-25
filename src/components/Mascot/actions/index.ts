import type { MascotAction } from "../types";
import type { ActionDefinition } from "./types";
import eat from "./eat";
import happy from "./happy";
import idle from "./idle";
import nap from "./nap";
import stretch from "./stretch";
import wag from "./wag";
import walk from "./walk";

export const ACTIONS: Record<MascotAction, ActionDefinition> = {
  idle,
  walk,
  happy,
  wag,
  stretch,
  nap,
  eat,
};
