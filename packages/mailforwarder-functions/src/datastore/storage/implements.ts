import { S3 } from "@aws-sdk/client-s3";
import { StorageDatastore } from "./interface";

class StorageDatastoreImplementation implements StorageDatastore {
  private client: S3;
  constructor(client: S3) {
    this.client = client;
  }

  public async getObjectBinaryAsync(bucketName: string, key: string): Promise<Uint8Array> {
    const result = await this.client
      .getObject({
        Bucket: bucketName,
        Key: key,
      });
    if (result.Body === undefined) {
      throw new Error(`Object not found: s3://${bucketName}/${key}`);
    }
    const bytes = await result.Body.transformToByteArray();
    return bytes;
  }

  public async getObjectBinaryBlobAsync(bucketName: string, key: string): Promise<Blob> {
    const result = await this.getObjectBinaryAsync(bucketName, key);
    return new Blob([new Uint8Array(result)]);
  }
}
export default StorageDatastoreImplementation;
