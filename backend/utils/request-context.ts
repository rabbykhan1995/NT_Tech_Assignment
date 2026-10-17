import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  payload: any;
  requestId: string;
}

/**
 * Per-request async context. The authenticated token payload is stored here so
 * that repositories/services deeper in the call chain can read the current
 * identity without threading it through every function signature.
 */
class RequestContextStoreFactory {
  private readonly als = new AsyncLocalStorage<RequestContext>();

  run<T>(context: RequestContext, callback: () => T): T {
    return this.als.run(context, callback);
  }

  get(): RequestContext | undefined {
    return this.als.getStore();
  }

  getPayload<T = any>(): T | null {
    return (this.als.getStore()?.payload ?? null) as T | null;
  }

  getRequestID(): string | null {
    return this.als.getStore()?.requestId ?? null;
  }

  getTenantID(): number | null {
    return this.getPayload()?.tenantID ?? null;
  }

  getLocationID(): number | null {
    return this.getPayload()?.locationID ?? null;
  }
}

export const RequestContextStore = new RequestContextStoreFactory();
