import { Readable } from "stream";

export interface StorageDatastore {
  getObjectBinaryAsync(bucketName: string, key: string): Promise<Buffer>;
  getObjectBinaryReadStream(bucketName: string, key: string): Readable;
}
