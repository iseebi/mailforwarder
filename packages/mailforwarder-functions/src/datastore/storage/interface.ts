export interface StorageDatastore {
  getObjectBinaryAsync(bucketName: string, key: string): Promise<Buffer>;
  getObjectBinaryBlobAsync(bucketName: string, key: string): Promise<Blob>;
}
