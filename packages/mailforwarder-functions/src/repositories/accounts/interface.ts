import { Account } from "../../models";

export interface AccountsRepository {
  getAsync(accountId: string): Promise<Account | undefined>;
}
