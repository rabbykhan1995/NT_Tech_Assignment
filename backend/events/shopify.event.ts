import redis from "../config/redis.config";

const STREAM_KEY = "shopify:events";

export type ShopifyEventType =
  | "product:sync"
  | "variant:sync"
  | "inventory:sync";

export interface ShopifyEventPayload {
  event: ShopifyEventType;
  productID: number;
  variantID?: number;
  timestamp: number;
}

async function emitEvent(payload: ShopifyEventPayload) {
  try {
    await redis.xadd(
      STREAM_KEY,
      "*",
      "event",
      payload.event,
      "productID",
      String(payload.productID),
      "variantID",
      String(payload.variantID ?? ""),
      "timestamp",
      String(payload.timestamp)
    );
  } catch (err) {
    console.error(`❌ Failed to emit ${payload.event}:`, err);
  }
}

export function emitProductSync(productID: number) {
  return emitEvent({
    event: "product:sync",
    productID,
    timestamp: Date.now(),
  });
}

export function emitVariantSync(productID: number, variantID: number) {
  return emitEvent({
    event: "variant:sync",
    productID,
    variantID,
    timestamp: Date.now(),
  });
}

export function emitInventorySync(productID: number, variantID?: number) {
  return emitEvent({
    event: "inventory:sync",
    productID,
    variantID,
    timestamp: Date.now(),
  });
}
