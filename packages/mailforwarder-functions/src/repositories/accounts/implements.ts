import { DynamoDbDatastore } from "../../datastore/dynamodb";
import { Account } from "../../models";
import { AccountsRepository } from "./interface";

class AccountsRepositoryImplementation implements AccountsRepository {
  private readonly dynamoDb: DynamoDbDatastore;
  private readonly accountsTableName: string;

  public constructor(dynamoDb: DynamoDbDatastore, accountsTableName: string) {
    this.dynamoDb = dynamoDb;
    this.accountsTableName = accountsTableName;
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
}

export default AccountsRepositoryImplementation;
