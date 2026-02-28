export interface ReceiverDatastore {
  deliverMessageAsync(accountEmail: string, from: string, dataBlob: Blob): Promise<void>;
}

export interface ReceiverDatastoreAuthorizationPlugin {
  interceptRequestHeadersAsync(url: string, currentHeaders: Record<string, string>): Promise<Record<string, string>>;
}
