import { API } from "./API";

export class Application {
    private static _token: string;
    private static _API: API;

    public static get token(): string {
        return this._token;
    }

    public static set token(token: string) {
        this._token = token;
    }

    public static get API(): API {
        return this._API;
    }

    public static set API(api: API) {
        this._API = api;
    }

}
