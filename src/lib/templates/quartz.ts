import type { Template } from "@/types/template";
import { createRandom, pick } from "./random";

const GRAIN_SIZE = 2;

type QuartzOptions = {
  seed: number;
  /** Grain colours; list a colour twice to make it twice as common. */
  grains: readonly [string, ...string[]];
};

/** Quartz broadcast: a dense, even layer of fine coloured sand grains. */
export function createQuartz({ seed, grains }: QuartzOptions): Template["draw"] {
  return (context, size) => {
    const random = createRandom(seed);
    for (let y = 0; y < size; y += GRAIN_SIZE) {
      for (let x = 0; x < size; x += GRAIN_SIZE) {
        context.fillStyle = pick(random, grains);
        context.fillRect(x, y, GRAIN_SIZE, GRAIN_SIZE);
      }
    }
  };
}
