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
      const result = (
        await this.dynamoDb.getItemAsync<AccountMapping>(this.mappingTableName, {
          mappingKey: `${accountPart}@${hostPart}`,
        })
      ).item;
      if (result) {
        return result;
      }
    } catch (e) {
      console.log(`Lookup failed key: ${accountPart}@${hostPart} ${e}`);
      // continue
    }
    try {
      const result = (
        await this.dynamoDb.getItemAsync<AccountMapping>(this.mappingTableName, {
          mappingKey: `@${hostPart}`,
        })
      ).item;
      if (result) {
        return result;
      }
    } catch (e) {
      console.log(`Lookup failed key: @${hostPart} ${e}`);
      // continue
    }
    return undefined;
  }
}

export default MappingsRepositoryImplementation;
