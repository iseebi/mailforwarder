import { IReceiveUseCase } from "./usecases/receive";
import ReceiveUseCase from "./usecases/receive/implementation";

class AppContainer {
  private receiveUseCase?: IReceiveUseCase;

  public getReceiveUseCase(): IReceiveUseCase {
    if (!this.receiveUseCase) {
      this.receiveUseCase = new ReceiveUseCase();
    }
    return this.receiveUseCase;
  }
}

export default AppContainer;
