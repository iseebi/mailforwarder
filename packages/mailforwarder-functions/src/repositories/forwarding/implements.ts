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
  private readonly mailboxBucketName: string;

  public constructor(
    dynamoDb: DynamoDbDatastore,
    queue: QueueDatastore,
    storage: StorageDatastore,
    receiver: ReceiverDatastore,
    forwardingTableName: string,
    forwardingQueueUrl: string,
    mailboxBucketName: string,
  ) {
    this.dynamoDb = dynamoDb;
    this.forwardingTableName = forwardingTableName;
    this.queue = queue;
    this.storage = storage;
    this.receiver = receiver;
    this.forwardingQueueUrl = forwardingQueueUrl;
    this.mailboxBucketName = mailboxBucketName;
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

  public async executeForwardAsync(forwarding: Forwarding, accountEmail: string): Promise<void> {
    try {
      const data = await this.storage.getObjectBinaryAsync(this.mailboxBucketName, forwarding.objectKey);
      const from =
        forwarding.headers.from && forwarding.headers.from.length > 0
          ? forwarding.headers.from[0]
          : "undisclosed-recipients";
      await this.receiver.deliverMessageAsync(accountEmail, from, data);
      await this.markCompletedAsync(forwarding.forwardingId);
    } catch {
      await this.markFailedAsync(forwarding.forwardingId);
    }
  }

  public async markCompletedAsync(forwardingId: string): Promise<void> {
    await this.dynamoDb.updateItemAsync<Forwarding>(
      this.forwardingTableName,
      { forwardingId },
      {},
      {
        UpdateExpression: "set #status = :status",
        ExpressionAttributeValues: {
          "#status": "status",
          ":status": ForwardingStatus.Completed,
        },
      },
    );
  }

  public async markFailedAsync(forwardingId: string): Promise<void> {
    try {
      await this.dynamoDb.updateItemAsync<Forwarding>(
        this.forwardingTableName,
        { forwardingId },
        {},
        {
          UpdateExpression: "set #status = :status",
          ExpressionAttributeValues: {
            "#status": "status",
            ":status": ForwardingStatus.Failed,
          },
        },
      );
    } catch {
      // nop
    }
  }
}

export default ForwardingRepositoryImplementation;
