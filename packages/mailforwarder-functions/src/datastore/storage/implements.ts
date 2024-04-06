import { S3 } from "aws-sdk";
import { StorageDatastore } from "./interface";

class StorageDatastoreImplementation implements StorageDatastore {
  private client: S3;
  constructor(client: S3) {
    this.client = client;
  }

  public async getObjectBinaryAsync(bucketName: string, key: string): Promise<Buffer> {
    const result = await this.client
      .getObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();
    return result.Body as Buffer;
  }

  public async getObjectBinaryBlobAsync(bucketName: string, key: string): Promise<Blob> {
    const result = await this.getObjectBinaryAsync(bucketName, key);
    return new Blob([result]);
  }
}
export default StorageDatastoreImplementation;
