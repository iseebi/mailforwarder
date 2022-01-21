import { SESMessage } from "aws-lambda";

export interface IReceiveUseCase {
  handleReceiveEventAsync(message: SESMessage): Promise<void>;
}
