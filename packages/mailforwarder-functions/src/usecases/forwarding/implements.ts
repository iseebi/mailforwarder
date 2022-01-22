import { Forwarding, ForwardingStatus } from "../../models";
import { AccountsRepository } from "../../repositories/accounts";
import { ForwardingRepository } from "../../repositories/forwarding";
import { ForwardingUseCase } from "./interface";

class ForwardingUseCaseImplementation implements ForwardingUseCase {
  private forwardingRepository: ForwardingRepository;
  private accountsRepository: AccountsRepository;

  public constructor(forwardingRepository: ForwardingRepository, accountsRepository: AccountsRepository) {
    this.forwardingRepository = forwardingRepository;
    this.accountsRepository = accountsRepository;
  }

  public async handleForwardEventAsync(inputForwarding: Forwarding): Promise<void> {
    const forwarding = await this.forwardingRepository.getAsync(inputForwarding.forwardingId);
    if (!forwarding) {
      console.warn(`[${inputForwarding.forwardingId}] forwarding not found`);
      return;
    }
    if (forwarding.status === ForwardingStatus.Completed) {
      console.warn(`[${inputForwarding.forwardingId}] already finished`);
      return;
    }
    const account = await this.accountsRepository.getAsync(forwarding.accountId);
    if (!account) {
      console.warn(`[${inputForwarding.forwardingId}] account not found`);
      await this.forwardingRepository.markFailedAsync(forwarding.forwardingId);
      return;
    }
    console.info(`[${inputForwarding.forwardingId}] forwarding start`);
    await this.forwardingRepository.executeForwardAsync(forwarding, account.accountEmail);
    console.info(`[${inputForwarding.forwardingId}] forwarding end`);
  }
}

export default ForwardingUseCaseImplementation;
