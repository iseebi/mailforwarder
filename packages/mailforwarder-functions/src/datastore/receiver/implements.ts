import axios from "axios";
import { ReceiverDatastore } from "./interface";

class ReceiverDatastoreImplementation implements ReceiverDatastore {
  private readonly deliverUrl: string;
  private readonly authorization: string;

  public constructor(deliverUrl: string, authorization: string) {
    this.deliverUrl = deliverUrl;
    this.authorization = authorization;
  }

  public async deliverMessageAsync(accountEmail: string, from: string, data: Buffer): Promise<void> {
    const params = new FormData();

    params.append("mail", new Blob([data.buffer]), "mail.eml");
    params.append("to", accountEmail);
    params.append("from", from);
    await axios.post(this.deliverUrl, params, {
      headers: {
        "content-type": "multipart/form-data",
        authorization: this.authorization,
      },
    });
  }
}
export default ReceiverDatastoreImplementation;
