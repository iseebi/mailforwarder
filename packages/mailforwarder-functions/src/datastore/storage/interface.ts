export interface StorageDatastore {
  getObjectBinaryAsync(bucketName: string, key: string): Promise<Buffer>;
}
