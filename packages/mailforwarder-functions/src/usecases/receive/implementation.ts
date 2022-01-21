import { SESMessage } from "aws-lambda";
import { IReceiveUseCase } from "./interface";

class ReceiveUseCase implements IReceiveUseCase {
  public async handleReceiveEventAsync(message: SESMessage): Promise<void> {}
}

export default ReceiveUseCase;
