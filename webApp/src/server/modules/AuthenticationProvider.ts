import { AuthenticationProvider } from "@microsoft/microsoft-graph-client";
import { DefaultAzureCredential } from "@azure/identity";

export class ClientCredentialAuthenticationProvider implements AuthenticationProvider {
    public async getAccessToken(): Promise<string> {
        try {
            const credential = new DefaultAzureCredential();
            const accessToken = await credential.getToken("https://graph.microsoft.com/.default");
            if (accessToken?.token) {
                return accessToken.token;
            } else {
                throw new Error("Error obtaining token...");
            }
        } catch (error) {
            throw new Error("Error obtaining token...");
        }
    }
}
