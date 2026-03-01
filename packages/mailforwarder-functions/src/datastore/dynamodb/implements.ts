import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  DatabaseKey,
  DeleteItemInput,
  DynamoDbDatastore,
  DynamoDbItem,
  DynamoDbValue,
  GetItemInput,
  IDatabaseObject,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from "./interface";

class DynamoDbDatastoreImplementation implements DynamoDbDatastore {
  private client: DynamoDBDocumentClient;

  public constructor(client: DynamoDBDocumentClient) {
    this.client = client;
  }

  public async getItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key: DatabaseKey,
    options?: Partial<GetItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client.send(
      new GetCommand({
        ...options,
        Key: key,
        TableName: tableName,
      }),
    );
    return { item: res.Item as T };
  }

  public async putItemAsync<T extends DynamoDbItem>(
    tableName: string,
    item: T,
    options?: Partial<PutItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client.send(
      new PutCommand({
        ...options,
        Item: item,
        TableName: tableName,
      }),
    );

    return {
      item,
      oldItem: res.Attributes && (res.Attributes as T),
    };
  }

  public async updateItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key: DatabaseKey,
    options?: Partial<UpdateItemInput>,
  ): Promise<IDatabaseObject<T>> {
    const res = await this.client.send(
      new UpdateCommand({
        ...options,
        Key: key,
        ReturnValues: "ALL_NEW",
        TableName: tableName,
      }),
    );

    if (!res.Attributes) {
      throw new Error("Attributes must not be null");
    }

    return {
      item: res.Attributes as T,
    };
  }

  public async deleteItemAsync(tableName: string, key: DatabaseKey, options?: Partial<DeleteItemInput>): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        ...options,
        Key: key,
        TableName: tableName,
      }),
    );
  }

  public async queryItemAsync<T extends DynamoDbItem>(
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
      const keyExpressionNames = Object.keys(primaryKey).reduce<Record<string, string>>(
        (p, key) => ({
          ...p,
          [`#${key}`]: key,
        }),
        {},
      );
      const keyExpressionValues = Object.entries(primaryKey).reduce<Record<string, DynamoDbValue>>(
        (p, [key, value]) => ({
          ...p,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          [`:${key}`]: value,
        }),
        {} as Record<string, DynamoDbValue>,
      );
      const keyConditionExpression = Object.keys(primaryKey)
        .map((key) => `#${key} = :${key}`)
        .join(" AND ");
      return {
        ...options,
        ExpressionAttributeNames: {
          ...keyExpressionNames,
          ...(options?.ExpressionAttributeNames || {}),
        },
        ExpressionAttributeValues: {
          ...keyExpressionValues,
          ...(options?.ExpressionAttributeValues || {}),
        },
        KeyConditionExpression: keyConditionExpression,
        TableName: tableName,
      };
    })();

    const res = await this.client.send(new QueryCommand(params));
    return (res.Items || []).map((i) => ({ item: i as T }));
  }
}

export default DynamoDbDatastoreImplementation;
