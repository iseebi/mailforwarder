import { ReceiverDatastoreAuthorizationPlugin } from "./interface";
import { GoogleAuth } from "google-auth-library";
import * as fs from "node:fs/promises";

class GoogleIAMAuthorizationPlugin implements ReceiverDatastoreAuthorizationPlugin {
  private configured: boolean | undefined = undefined;
  private serviceAccountIdTokenUrl: string = "";

  public async interceptRequestHeadersAsync(url: string, currentHeaders: Record<string, string>): Promise<Record<string, string>> {
    try {
      if (!await this.detectEnvironment()) {
        return currentHeaders;
      }

      const auth = new GoogleAuth();

      const audience = new URL(url).origin;
      const authClient = await auth.getClient();
      const tokenFetchResult = await authClient.fetch<{ token: string }>(this.serviceAccountIdTokenUrl, {
        method: "POST",
        body: JSON.stringify({ audience, includeEmail: true }),
      });

      return {
        ...currentHeaders,
        authorization: `Bearer ${tokenFetchResult.data.token}`,
      };
    } catch (error) {
      throw error;
    }
  }

  private async detectEnvironment(): Promise<boolean> {
    if (this.configured !== undefined) {
      return this.configured ?? false;
    }

    try {
      const configPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (configPath && (await fs.stat(configPath))) {
        const configContents = await fs.readFile(configPath, { encoding: "utf8" });
        const config = JSON.parse(configContents) as { service_account_impersonation_url?: string };
        if (config.service_account_impersonation_url) {
          this.configured = true;
          this.serviceAccountIdTokenUrl = config.service_account_impersonation_url.replace(/:[^:]*$/, ":generateIdToken");
          return true;
        }
      }
    } catch {
      // ignore
    }
    console.warn("GoogleIAMAuthorizationPlugin is not configured properly. Missing GOOGLE_APPLICATION_CREDENTIALS environment variable or file does not exist.");
    this.configured = false;
    return false;
  }
}

export default GoogleIAMAuthorizationPlugin;
