export interface QueueDatastore {
  enqueueAsync<T>(queueUrl: string, item: T): Promise<void>;
}
