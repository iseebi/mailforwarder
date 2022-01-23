import { Readable } from "stream";

export interface ReceiverDatastore {
  deliverMessageAsync(accountEmail: string, from: string, dataReadable: Readable): Promise<void>;
}
