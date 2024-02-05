export interface ReceiverDatastore {
  deliverMessageAsync(accountEmail: string, from: string, dataBlob: Blob): Promise<void>;
}
