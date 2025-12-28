import { ReceiverDatastore, ReceiverDatastoreAuthorizationPlugin } from "./interface";

class ReceiverDatastoreImplementation implements ReceiverDatastore {
  private readonly deliverUrl: string;
  private readonly authorizationHeader: string;
  private readonly authorization: string;
  private readonly plugins: ReceiverDatastoreAuthorizationPlugin[];

  public constructor(deliverUrl: string, authorization: string, authorizationHeader: string, plugins: ReceiverDatastoreAuthorizationPlugin[]) {
    this.deliverUrl = deliverUrl;
    this.authorization = authorization;
    this.authorizationHeader = authorizationHeader;
    this.plugins = plugins;
  }

  public async deliverMessageAsync(accountEmail: string, from: string, dataBlob: Blob): Promise<void> {
    const body = new FormData();
    let headers: Record<string, string> = {};

    for (const plugin of this.plugins) {
      headers = await plugin.interceptRequestHeadersAsync(this.deliverUrl, headers);
    }

    // 認証をセットする
    // - authorizationHeader が指定されている場合はそのヘッダー名でセット
    // - 指定されていない場合は standard な Authorization ヘッダーでセット（ただし既にセットされていない場合のみ）
    if (this.authorization) {
      if (this.authorizationHeader) {
        headers[this.authorizationHeader] = this.authorization;
      } else if (!headers.authorization) {
        headers.authorization = this.authorization;
      }
    }

    body.append("mail", dataBlob, "mail.eml");
    body.append("to", accountEmail);
    body.append("from", from);
    const response = await fetch(this.deliverUrl, {
      method: "POST",
      headers,
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
