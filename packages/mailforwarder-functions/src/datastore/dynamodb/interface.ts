import { DocumentClient } from "aws-sdk/clients/dynamodb";

export interface IDatabaseObject<T> {
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
  getItemAsync<T>(tableName: string, key: DatabaseKey, options?: Partial<GetItemInput>): Promise<IDatabaseObject<T>>;
  putItemAsync<T>(tableName: string, item: T, options?: Partial<PutItemInput>): Promise<IDatabaseObject<T>>;
  updateItemAsync<T>(
    tableName: string,
    key: DatabaseKey,
    item: Partial<T>,
    options?: Partial<UpdateItemInput>,
  ): Promise<IDatabaseObject<T>>;
  deleteItemAsync<T>(tableName: string, key: DatabaseKey, options?: Partial<DeleteItemInput>): Promise<void>;
  queryItemAsync<T>(
    tableName: string,
    key?: DatabaseKey,
    options?: Partial<QueryInput>,
  ): Promise<Array<IDatabaseObject<T>>>;
}
