import axios from "axios";
import { Readable } from "stream";
import { ReceiverDatastore } from "./interface";
import * as FormData from "form-data";

class ReceiverDatastoreImplementation implements ReceiverDatastore {
  private readonly deliverUrl: string;
  private readonly authorization: string;

  public constructor(deliverUrl: string, authorization: string) {
    this.deliverUrl = deliverUrl;
    this.authorization = authorization;
  }

  public async deliverMessageAsync(accountEmail: string, from: string, dataReadable: Readable): Promise<void> {
    const params = new FormData();

    params.append("mail", dataReadable, "mail.eml");
    params.append("to", accountEmail);
    params.append("from", from);
    const result = await axios.post(this.deliverUrl, params, {
      headers: params.getHeaders({
        authorization: this.authorization,
      }),
    });
    console.info(`Status: ${result.status}`);
  }
}
export default ReceiverDatastoreImplementation;
