import { Forwarding } from "../../models";

export interface ForwardingRepository {
  getAsync(forwardingId: string): Promise<Forwarding | undefined>;
  requestForwardAsync(forwarding: Forwarding): Promise<void>;
  markFailedAsync(forwardingId: string): Promise<void>;
  markDroppedAsync(forwardingId: string): Promise<void>;
  executeForwardAsync(forwarding: Forwarding, accountEmail: string): Promise<boolean>;
}
