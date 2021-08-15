import { AuthenticationProvider } from "@microsoft/microsoft-graph-client";

export class UserAuthenticationProvider implements AuthenticationProvider {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    public async getAccessToken(): Promise<string> {
        return this.accessToken;
    }
}
