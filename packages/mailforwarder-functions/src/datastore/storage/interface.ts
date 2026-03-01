export interface StorageDatastore {
  getObjectBinaryAsync(bucketName: string, key: string): Promise<Uint8Array>;
  getObjectBinaryBlobAsync(bucketName: string, key: string): Promise<Blob>;
}
