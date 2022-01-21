import { SESMessage, SESReceiptS3Action } from "aws-lambda";
import { AccountMapping, Forwarding, ForwardingStatus } from "../../models";
import { ForwardingRepository } from "../../repositories/forwarding";
import { MappingsRepository } from "../../repositories/mappings";
import { ReceiveUseCase } from "./interface";

const sesToForwarding = (message: SESMessage, recipient: string, mapping: AccountMapping): Forwarding => {
  const objectKey = (message.receipt.action as SESReceiptS3Action).objectKey;
  return {
    forwardingId: `${objectKey}/${mapping.mappingKey}`,
    accountId: mapping.accountId,
    createdAt: new Date().getTime(),
    headers: message.mail.commonHeaders,
    mappingKey: mapping.mappingKey,
    objectKey,
    recipient,
    status: ForwardingStatus.Received,
    timestamp: 0,
  };
};

class ReceiveUseCaseImplementation implements ReceiveUseCase {
  private mappingsRepository: MappingsRepository;
  private forwardingRepository: ForwardingRepository;

  public constructor(mappingsRepository: MappingsRepository, forwardingRepository: ForwardingRepository) {
    this.mappingsRepository = mappingsRepository;
    this.forwardingRepository = forwardingRepository;
  }

  public async handleReceiveEventAsync(message: SESMessage): Promise<void> {
    await Promise.all(message.receipt.recipients.map((r) => this.processReceiveMessage(message, r)));
  }

  private async processReceiveMessage(message: SESMessage, recipient: string): Promise<void> {
    const match = /^([^@+]*)(?:\+[^@]+)?@(.*)$/.exec(recipient);
    if (!match) {
      console.warn(`[${message.mail.messageId}/${recipient}]: invalid recipient format`);
      return;
    }
    const accountPart = match[1];
    const hostPart = match[2];
    const mapping = await this.mappingsRepository.lookupMappingAsync(accountPart, hostPart);
    if (!mapping) {
      console.warn(`[${message.mail.messageId}/${recipient}]: mapping not found`);
      return;
    }
    const forwarding = sesToForwarding(message, recipient, mapping);
    await this.forwardingRepository.requestForwardAsync(forwarding);
    console.info(`[${message.mail.messageId}/${recipient}]: forward requested: ${forwarding.forwardingId}`);
  }
}

export default ReceiveUseCaseImplementation;
