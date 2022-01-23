import { SESMessage } from "aws-lambda";

export interface ReceiveUseCase {
  handleReceiveEventAsync(message: SESMessage): Promise<void>;
}
