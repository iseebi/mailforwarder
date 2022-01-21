import { AccountMapping } from "../../models";

export interface MappingsRepository {
  lookupMappingAsync(accountPart: string, hostPart: string): Promise<AccountMapping | undefined>;
}
