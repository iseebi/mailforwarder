import { SQS } from "@aws-sdk/client-sqs";
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
      });
  }
}

export default QueueDatastoreImplementation;
