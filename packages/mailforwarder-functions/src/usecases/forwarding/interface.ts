import { Forwarding } from "../../models";

export interface ForwardingUseCase {
  handleForwardEventAsync(message: Forwarding): Promise<void>;
}
