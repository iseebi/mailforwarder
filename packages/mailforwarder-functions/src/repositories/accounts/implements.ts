import { DynamoDbDatastore } from "../../datastore/dynamodb";
import {Account, DropConfig} from "../../models";
import { AccountsRepository } from "./interface";

class AccountsRepositoryImplementation implements AccountsRepository {
  private readonly dynamoDb: DynamoDbDatastore;
  private readonly accountsTableName: string;
  private readonly dropConfigsTableName: string;

  public constructor(dynamoDb: DynamoDbDatastore, accountsTableName: string, dropConfigsTableName: string) {
    this.dynamoDb = dynamoDb;
    this.accountsTableName = accountsTableName;
    this.dropConfigsTableName = dropConfigsTableName;
  }

  public async getAsync(accountId: string): Promise<Account | undefined> {
    try {
      return (
        await this.dynamoDb.getItemAsync<Account>(this.accountsTableName, {
          accountId: accountId,
        })
      ).item;
    } catch {
      return undefined;
    }
  }

  public async isDropAsync(accountId: string, recipient: string): Promise<boolean | undefined> {
    try {
      const item = await this.dynamoDb.getItemAsync<DropConfig>(this.dropConfigsTableName, {
        dropConfigId: `${accountId}/${recipient}`,
      });
      return item.item !== undefined;
    } catch {
      // TODO: Not Found のときはfalse、それ以外はundefinedを返す
      return false;
    }
  }
}

export default AccountsRepositoryImplementation;
