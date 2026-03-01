import {
  DeleteCommandInput,
  GetCommandInput,
  NativeAttributeValue,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

export type DynamoDbValue = NativeAttributeValue;
export type DynamoDbItem = Record<string, DynamoDbValue>;

export interface IDatabaseObject<T> {
  item: T;
  oldItem?: T;
}
export type DatabaseKey = Record<string, NativeAttributeValue>;
export type GetItemInput = GetCommandInput;
export type PutItemInput = PutCommandInput;
export type UpdateItemInput = UpdateCommandInput;
export type DeleteItemInput = DeleteCommandInput;
export type QueryInput = QueryCommandInput;

export interface DynamoDbDatastore {
  getItemAsync<T extends DynamoDbItem>(tableName: string, key: DatabaseKey, options?: Partial<GetItemInput>): Promise<IDatabaseObject<T>>;
  putItemAsync<T extends DynamoDbItem>(tableName: string, item: T, options?: Partial<PutItemInput>): Promise<IDatabaseObject<T>>;
  updateItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key: DatabaseKey,
    options?: Partial<UpdateItemInput>,
  ): Promise<IDatabaseObject<T>>;
  deleteItemAsync(tableName: string, key: DatabaseKey, options?: Partial<DeleteItemInput>): Promise<void>;
  queryItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key?: DatabaseKey,
    options?: Partial<QueryInput>,
  ): Promise<Array<IDatabaseObject<T>>>;
}
