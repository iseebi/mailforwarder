import { Account } from "../../models";

export interface AccountsRepository {
  getAsync(accountId: string): Promise<Account | undefined>;
  isDropAsync(accountId: string, recipient: string): Promise<boolean | undefined>;
}
