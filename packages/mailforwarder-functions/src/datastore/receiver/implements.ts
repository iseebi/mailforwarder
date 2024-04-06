import { ReceiverDatastore } from "./interface";

class ReceiverDatastoreImplementation implements ReceiverDatastore {
  private readonly deliverUrl: string;
  private readonly authorization: string;

  public constructor(deliverUrl: string, authorization: string) {
    this.deliverUrl = deliverUrl;
    this.authorization = authorization;
  }

  public async deliverMessageAsync(accountEmail: string, from: string, dataBlob: Blob): Promise<void> {
    const body = new FormData();

    body.append("mail", dataBlob, "mail.eml");
    body.append("to", accountEmail);
    body.append("from", from);
    const response = await fetch(this.deliverUrl, {
      method: "POST",
      headers: {
        authorization: this.authorization,
      },
      body: body as unknown as BodyInit,
    });
    if (!response.ok) {
      throw new Error(`Failed to deliver message: ${response.status} ${response.statusText}`);
    }

    const result = await response.text();
    console.info(`Status: ${result}`);
  }
}
export default ReceiverDatastoreImplementation;
