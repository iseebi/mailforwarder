import { SQS } from "aws-sdk";
import { QueueDatastore } from "./interface";

class QueueDatastoreImplementation implements QueueDatastore {
  private client: SQS;

  public constructor(client: SQS) {
    this.client = client;
  }

  public async enqueueAsync<T>(queueUrl: string, item: T): Promise<void> {
    await this.client
      .sendMessage({
        MessageBody: JSON.stringify(item),
        QueueUrl: queueUrl,
      })
      .promise();
  }
}

export default QueueDatastoreImplementation;
