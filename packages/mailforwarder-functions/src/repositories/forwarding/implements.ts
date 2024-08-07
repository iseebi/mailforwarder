import { DynamoDbDatastore } from "../../datastore/dynamodb";
import { QueueDatastore } from "../../datastore/queue";
import { ReceiverDatastore } from "../../datastore/receiver";
import { StorageDatastore } from "../../datastore/storage";
import { Forwarding, ForwardingStatus } from "../../models";
import { ForwardingRepository } from "./interface";

class ForwardingRepositoryImplementation implements ForwardingRepository {
  private readonly dynamoDb: DynamoDbDatastore;
  private readonly queue: QueueDatastore;
  private readonly storage: StorageDatastore;
  private readonly receiver: ReceiverDatastore;
  private readonly forwardingTableName: string;
  private readonly forwardingQueueUrl: string;
  private readonly receiveBucketName: string;

  public constructor(
    dynamoDb: DynamoDbDatastore,
    queue: QueueDatastore,
    storage: StorageDatastore,
    receiver: ReceiverDatastore,
    forwardingTableName: string,
    forwardingQueueUrl: string,
    receiveBucketName: string,
  ) {
    this.dynamoDb = dynamoDb;
    this.forwardingTableName = forwardingTableName;
    this.queue = queue;
    this.storage = storage;
    this.receiver = receiver;
    this.forwardingQueueUrl = forwardingQueueUrl;
    this.receiveBucketName = receiveBucketName;
  }

  public async getAsync(forwardingId: string): Promise<Forwarding | undefined> {
    try {
      return (
        await this.dynamoDb.getItemAsync<Forwarding>(this.forwardingTableName, {
          forwardingId,
        })
      ).item;
    } catch {
      return undefined;
    }
  }

  public async requestForwardAsync(forwarding: Forwarding): Promise<void> {
    await this.dynamoDb.putItemAsync(this.forwardingTableName, forwarding);
    await this.queue.enqueueAsync(this.forwardingQueueUrl, forwarding);
  }

  public async executeForwardAsync(forwarding: Forwarding, accountEmail: string): Promise<boolean> {
    try {
      const blob = await this.storage.getObjectBinaryBlobAsync(this.receiveBucketName, forwarding.objectKey);
      const from = "undisclosed-recipients";
      await this.receiver.deliverMessageAsync(accountEmail, from, blob);
      await this.markCompletedAsync(forwarding.forwardingId);
      return true;
    } catch (e) {
      console.error(`[${forwarding.forwardingId}] API call failed ${e}`);
      await this.markFailedAsync(forwarding.forwardingId);
      return false;
    }
  }

  public async markCompletedAsync(forwardingId: string): Promise<void> {
    console.info(`[${forwardingId}] mark completed`);
    await this.dynamoDb.updateItemAsync<Forwarding>(
      this.forwardingTableName,
      { forwardingId },
      {},
      {
        UpdateExpression: "set #status = :status, #forwardedAt = :forwardedAt",
        ExpressionAttributeNames: {
          "#status": "status",
          "#forwardedAt": "forwardedAt",
        },
        ExpressionAttributeValues: {
          ":status": ForwardingStatus.Completed,
          ":forwardedAt": new Date().getTime(),
        },
      },
    );
  }

  public async markFailedAsync(forwardingId: string): Promise<void> {
    try {
      console.warn(`[${forwardingId}] mark failed`);
      await this.dynamoDb.updateItemAsync<Forwarding>(
        this.forwardingTableName,
        { forwardingId },
        {},
        {
          UpdateExpression: "set #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": ForwardingStatus.Failed,
          },
        },
      );
    } catch {
      // nop
    }
  }

  public async markDroppedAsync(forwardingId: string): Promise<void> {
    try {
      console.warn(`[${forwardingId}] mark dropped`);
      await this.dynamoDb.updateItemAsync<Forwarding>(
        this.forwardingTableName,
        { forwardingId },
        {},
        {
          UpdateExpression: "set #status = :status",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": ForwardingStatus.Dropped,
          },
        },
      );
    } catch {
      // nop
    }
  }
}

export default ForwardingRepositoryImplementation;
