import { DynamoDbDatastore } from "../../datastore/dynamodb";
import { AccountMapping } from "../../models";
import { MappingsRepository } from "./interface";

class MappingsRepositoryImplementation implements MappingsRepository {
  private dynamoDb: DynamoDbDatastore;
  private mappingTableName: string;

  public constructor(dynamoDb: DynamoDbDatastore, mappingTableName: string) {
    this.dynamoDb = dynamoDb;
    this.mappingTableName = mappingTableName;
  }

  public async lookupMappingAsync(accountPart: string, hostPart: string): Promise<AccountMapping | undefined> {
    try {
      return (
        await this.dynamoDb.getItemAsync<AccountMapping>(this.mappingTableName, {
          mappingKey: `${accountPart}@${hostPart}`,
        })
      ).item;
    } catch {
      // continue
    }
    try {
      return (
        await this.dynamoDb.getItemAsync<AccountMapping>(this.mappingTableName, {
          mappingKey: `@${hostPart}`,
        })
      ).item;
    } catch {
      return undefined;
    }
  }
}

export default MappingsRepositoryImplementation;
