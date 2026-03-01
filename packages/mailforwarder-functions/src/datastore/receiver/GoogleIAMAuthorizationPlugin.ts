import { GoogleAuth } from "google-auth-library";
import * as fs from "node:fs/promises";
import { ReceiverDatastoreAuthorizationPlugin } from "./interface";

class GoogleIAMAuthorizationPlugin implements ReceiverDatastoreAuthorizationPlugin {
  private configured: boolean | undefined = undefined;
  private serviceAccountIdTokenUrl = "";

  private cachedToken: { token: string; issuedAt: Date } | null = null;
  private tokenExpiryDurationMs: number = 5 * 60 * 1000; // 5 minutes

  public async interceptRequestHeadersAsync(
    url: string,
    currentHeaders: Record<string, string>,
  ): Promise<Record<string, string>> {
    if (!(await this.detectEnvironment())) {
      return currentHeaders;
    }

    if (this.cachedToken !== null) {
      const now = new Date();
      if (now.getTime() - this.cachedToken.issuedAt.getTime() < this.tokenExpiryDurationMs) {
        return {
          ...currentHeaders,
          authorization: `Bearer ${this.cachedToken.token}`,
        };
      }
    }

    const token = await this.fetchToken(url);
    this.cachedToken = { token, issuedAt: new Date() };

    return {
      ...currentHeaders,
      authorization: `Bearer ${token}`,
    };
  }

  private async fetchToken(url: string): Promise<string> {
    const audience = new URL(url).origin;
    try {
      const auth = new GoogleAuth();
      const authClient = await auth.getClient();
      const tokenFetchResult = await authClient.fetch<{ token: string }>(this.serviceAccountIdTokenUrl, {
        method: "POST",
        body: JSON.stringify({ audience, includeEmail: true }),
      });

      return tokenFetchResult.data.token;
    } catch (err) {
      const originalMessage = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Failed to generate ID token via "${this.serviceAccountIdTokenUrl}" for audience "${audience}" when accessing "${url}": ${originalMessage}`,
      );
    }
  }

  private async detectEnvironment(): Promise<boolean> {
    if (this.configured !== undefined) {
      return this.configured;
    }

    try {
      const configPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (configPath && (await fs.stat(configPath))) {
        const configContents = await fs.readFile(configPath, { encoding: "utf8" });
        const config = JSON.parse(configContents) as { service_account_impersonation_url?: string };
        if (config.service_account_impersonation_url) {
          this.configured = true;
          this.serviceAccountIdTokenUrl = config.service_account_impersonation_url.replace(
            /:[^:]*$/,
            ":generateIdToken",
          );
          return true;
        }
      }
    } catch {
      // ignore
    }
    console.warn(
      "GoogleIAMAuthorizationPlugin is not configured properly. Missing GOOGLE_APPLICATION_CREDENTIALS environment variable or file does not exist.",
    );
    this.configured = false;
    return false;
  }
}

export default GoogleIAMAuthorizationPlugin;
