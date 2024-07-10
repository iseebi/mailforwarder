import { DocumentClient } from "aws-sdk/clients/dynamodb";

export type DynamoDbValue = any;
export type DynamoDbItem = Record<string, DynamoDbValue>;

export interface IDatabaseObject<T> {
  // FIXME: itemがundefinedになることがある(undefinedにならないように、戻り値がIDatabaseObject<T>?になるようにする等の対策をする)
  item: T;
  oldItem?: T;
}
export type DatabaseKey = DocumentClient.Key;
export type GetItemInput = DocumentClient.GetItemInput;
export type PutItemInput = DocumentClient.PutItemInput;
export type UpdateItemInput = DocumentClient.UpdateItemInput;
export type DeleteItemInput = DocumentClient.DeleteItemInput;
export type QueryInput = DocumentClient.QueryInput;

export interface DynamoDbDatastore {
  getItemAsync<T extends DynamoDbItem>(tableName: string, key: DatabaseKey, options?: Partial<GetItemInput>): Promise<IDatabaseObject<T>>;
  putItemAsync<T extends DynamoDbItem>(tableName: string, item: T, options?: Partial<PutItemInput>): Promise<IDatabaseObject<T>>;
  updateItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key: DatabaseKey,
    item: Partial<T>,
    options?: Partial<UpdateItemInput>,
  ): Promise<IDatabaseObject<T>>;
  deleteItemAsync(tableName: string, key: DatabaseKey, options?: Partial<DeleteItemInput>): Promise<void>;
  queryItemAsync<T extends DynamoDbItem>(
    tableName: string,
    key?: DatabaseKey,
    options?: Partial<QueryInput>,
  ): Promise<Array<IDatabaseObject<T>>>;
}
