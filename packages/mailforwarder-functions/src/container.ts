import { S3 } from "@aws-sdk/client-s3";
import { SQS } from "@aws-sdk/client-sqs";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import constants from "./constants";
import { DynamoDbDatastore } from "./datastore/dynamodb";
import DynamoDbDatastoreImplementation from "./datastore/dynamodb/implements";
import { QueueDatastore } from "./datastore/queue";
import QueueDatastoreImplementation from "./datastore/queue/implements";
import { ReceiverDatastore, ReceiverDatastoreAuthorizationPlugin } from "./datastore/receiver";
import ReceiverDatastoreImplementation from "./datastore/receiver/implements";
import { StorageDatastore } from "./datastore/storage";
import StorageDatastoreImplementation from "./datastore/storage/implements";
import { AccountsRepository } from "./repositories/accounts";
import AccountsRepositoryImplementation from "./repositories/accounts/implements";
import { ForwardingRepository } from "./repositories/forwarding";
import ForwardingRepositoryImplementation from "./repositories/forwarding/implements";
import { MappingsRepository } from "./repositories/mappings";
import MappingsRepositoryImplementation from "./repositories/mappings/implements";
import ForwardingUseCaseImplementation from "./usecases/forwarding/implements";
import { ForwardingUseCase } from "./usecases/forwarding/interface";
import { ReceiveUseCase } from "./usecases/receive";
import ReceiveUseCaseImplementation from "./usecases/receive/implements";
import GoogleIAMAuthorizationPlugin from "./datastore/receiver/GoogleIAMAuthorizationPlugin";

class AppContainer {
  private receiveUseCase?: ReceiveUseCase;
  private forwardingUseCase?: ForwardingUseCase;
  private forwardingRepository?: ForwardingRepository;
  private accountsRepository?: AccountsRepository;
  private mappingsRepository?: MappingsRepository;
  private dynamoDbDatastore?: DynamoDbDatastore;
  private queueDatastore?: QueueDatastore;
  private storageDatastore?: StorageDatastore;
  private receiverDatastore?: ReceiverDatastore;

  public getReceiveUseCase(): ReceiveUseCase {
    if (!this.receiveUseCase) {
      this.receiveUseCase = new ReceiveUseCaseImplementation(
        this.getMappingsRepository(),
        this.getForwardingRepository(),
      );
    }
    return this.receiveUseCase;
  }

  public getForwardingUseCase(): ForwardingUseCase {
    if (!this.forwardingUseCase) {
      this.forwardingUseCase = new ForwardingUseCaseImplementation(
        this.getForwardingRepository(),
        this.getAccountsRepository(),
      );
    }
    return this.forwardingUseCase;
  }

  public getForwardingRepository(): ForwardingRepository {
    if (!this.forwardingRepository) {
      this.forwardingRepository = new ForwardingRepositoryImplementation(
        this.getDynamoDbDatastore(),
        this.getQueueDatastore(),
        this.getStorageDatastore(),
        this.getReceiverDatastore(),
        constants.tables.forwardingTableName,
        constants.queue.forwardingQueueUrl,
        constants.receiveBucketName,
      );
    }
    return this.forwardingRepository;
  }

  public getAccountsRepository(): AccountsRepository {
    if (!this.accountsRepository) {
      this.accountsRepository = new AccountsRepositoryImplementation(
        this.getDynamoDbDatastore(),
        constants.tables.accountsTableName,
        constants.tables.dropConfigsTableName,
      );
    }
    return this.accountsRepository;
  }

  public getMappingsRepository(): MappingsRepository {
    if (!this.mappingsRepository) {
      this.mappingsRepository = new MappingsRepositoryImplementation(
        this.getDynamoDbDatastore(),
        constants.tables.mappingTableName,
      );
    }
    return this.mappingsRepository;
  }

  public getDynamoDbDatastore(): DynamoDbDatastore {
    if (!this.dynamoDbDatastore) {
      const baseClient = new DynamoDB();
      const documentClient = DynamoDBDocumentClient.from(baseClient);
      this.dynamoDbDatastore = new DynamoDbDatastoreImplementation(documentClient);
    }
    return this.dynamoDbDatastore;
  }

  public getQueueDatastore(): QueueDatastore {
    if (!this.queueDatastore) {
      const sqs = new SQS();
      this.queueDatastore = new QueueDatastoreImplementation(sqs);
    }
    return this.queueDatastore;
  }

  public getStorageDatastore(): StorageDatastore {
    if (!this.storageDatastore) {
      const s3 = new S3();
      this.storageDatastore = new StorageDatastoreImplementation(s3);
    }
    return this.storageDatastore;
  }

  public getReceiverDatastore(): ReceiverDatastore {
    if (!this.receiverDatastore) {
      this.receiverDatastore = new ReceiverDatastoreImplementation(
        constants.delivery.url,
        constants.delivery.authorization,
        constants.delivery.authorizationHeader,
        this.receiverDatastorePlugins(),
      );
    }
    return this.receiverDatastore;
  }

  private receiverDatastorePlugins(): ReceiverDatastoreAuthorizationPlugin[] {
    const result: ReceiverDatastoreAuthorizationPlugin[] = [];

    if (constants.delivery.googleAuthorizationEnabled) {
      result.push(new GoogleIAMAuthorizationPlugin());
    }

    return result;
  }
}

export default AppContainer;
