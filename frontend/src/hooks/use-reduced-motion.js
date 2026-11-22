import { useMediaQuery } from "./use-media-query";
import { REDUCE_MOTION_QUERY } from "../lib/media.constant";

export function useReducedMotion() {
  return useMediaQuery(REDUCE_MOTION_QUERY);
}
