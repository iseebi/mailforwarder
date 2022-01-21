import { DocumentClient } from "aws-sdk/clients/dynamodb";
import {
  DatabaseKey,
  DeleteItemInput,
  DynamoDbDatastore,
  GetItemInput,
  IDatabaseObject,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from "./interface";

class DynamoDbDatastoreImplementation implements DynamoDbDatastore {
  private client: DocumentClient;

  public constructor(client: DocumentClient) {
    this.client = client;
  }

  public async getItemAsync<T>(
    tableName: string,
    key: DatabaseKey,
    options?: Partial<GetItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client
      .get({
        ...options,
        Key: key,
        TableName: tableName,
      })
      .promise();
    return { item: res.Item as T };
  }

  public async putItemAsync<T>(
    tableName: string,
    item: T,
    options?: Partial<PutItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client
      .put({
        ...options,
        Item: item,
        TableName: tableName,
      })
      .promise();

    return {
      item,
      oldItem: res.Attributes && (res.Attributes as T),
    };
  }

  public async updateItemAsync<T>(
    tableName: string,
    key: DatabaseKey,
    item: Partial<T>,
    options?: Partial<UpdateItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client
      .update({
        ...options,
        Key: key,
        ReturnValues: "ALL_NEW",
        TableName: tableName,
      })
      .promise();

    if (!res.Attributes) {
      throw new Error("Attributes must not be null");
    }

    return {
      item: res.Attributes as T,
    };
  }

  public async deleteItemAsync<T>(
    tableName: string,
    key: DatabaseKey,
    options?: Partial<DeleteItemInput>,
  ): Promise<void> {
    await this.client
      .delete({
        ...options,
        Key: key,
        TableName: tableName,
      })
      .promise();
  }

  public async queryItemAsync<T>(
    tableName: string,
    primaryKey?: DatabaseKey,
    options?: Partial<QueryInput>,
  ): Promise<Array<IDatabaseObject<T>>> {
    const params: QueryInput = (() => {
      if (!primaryKey) {
        return {
          ...options,
          TableName: tableName,
        };
      }
      const KeyConditions: DocumentClient.KeyConditions = Object.entries(primaryKey).reduce((p, [key, value]) => {
        return {
          ...p,
          [key]: {
            AttributeValueList: [value],
            ComparisonOperator: "EQ",
          },
        };
      }, {});
      return {
        ...options,
        KeyConditions,
        TableName: tableName,
      };
    })();

    const res = await this.client.query(params).promise();
    return (res.Items || []).map((i) => ({ item: i as T }));
  }
}

export default DynamoDbDatastoreImplementation;
