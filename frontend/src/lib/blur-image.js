import { IMAGE_DOMINANT_TONES, IMAGE_PLACEHOLDER, IMAGE_STATUS } from "./blur-image.constant";

export function imageNodeReady(node) {
  return Boolean(node && node.complete && node.naturalWidth > 0);
}

export function imageStatusFromNode(node) {
  if (!node) return IMAGE_STATUS.loading;
  if (node.complete && node.naturalWidth === 0) return IMAGE_STATUS.error;
  if (imageNodeReady(node)) return IMAGE_STATUS.ready;
  return IMAGE_STATUS.loading;
}

/** Deterministic soft tone from src path (LQIP stand-in without decoding pixels). */
export function dominantColorForSrc(src) {
  if (typeof src !== "string" || !src) return IMAGE_PLACEHOLDER;
  let hash = 0;
  for (let index = 0; index < src.length; index += 1) {
    hash = (hash * 33 + src.charCodeAt(index)) % 9973;
  }
  return IMAGE_DOMINANT_TONES[hash % IMAGE_DOMINANT_TONES.length] ?? IMAGE_PLACEHOLDER;
}
