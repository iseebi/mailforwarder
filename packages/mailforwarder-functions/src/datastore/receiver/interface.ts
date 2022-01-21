export interface ReceiverDatastore {
  deliverMessageAsync(accountEmail: string, from: string, data: Buffer): Promise<void>;
}
