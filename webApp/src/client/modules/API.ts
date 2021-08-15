import axios, { AxiosResponse } from "axios";
import { NewTeamRequest } from "../../types/Form/NewTeamRequest";
import { AppConfigResponse } from "../../types/API/AppConfigResponse";
import { ValidationResponse } from "../../types/API/ValidationResponse";
import { UserResponse } from "../../types/API/UserResponse";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { Application } from "./Application";
import * as msTeams from "@microsoft/teams-js";

enum HTTPMethod {
    GET = "GET",
    POST = "POST"
}

export class API {

    /** Base API Call to back-end
     *
     * @param method HTTP method
     * @param url URL of API call
     * @param params Query parameters
     * @param body HTTP body payload
     * @returns HTTP response
     */
    private async callAPI(method: HTTPMethod, url: string, params?: any, body?: any): Promise<any> {
        // Check current token is still valid
        await this.checkTokenExpiry();
        const headers: object = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Application.token}`
        };
        try {
            let request: Promise<AxiosResponse<any>>;
            switch (method) {
                case HTTPMethod.GET:
                    request = axios.get(url, { headers, params });
                    break;
                case HTTPMethod.POST:
                    request = axios.post(url, body, { headers, params });
                    break;
            }
            return request.then((response) => response.data);
        } catch (error) {
            throw new Error(error);
        };
    }

    /**
     * Ensure the existing auth token has not expired
     */
    private async checkTokenExpiry() {
        // Ask for a new token (if needed)
        msTeams.authentication.getAuthToken({
            successCallback: (token: string) => {
                Application.token = token;
            },
            failureCallback: (message: string) => {
                throw new Error("Cannot refresh authorization token: " + message);
            },
            resources: [process.env.WebAppFQDN as string]
        });
    }

    /**
     * Get Application configuration
     *
     * @returns Application configuration
     */
    public async getAppConfig(): Promise<AppConfigResponse> {
        const url: string = "/api/config";
        return this.callAPI(HTTPMethod.GET, url);
    };

    /**
     * Get a list of users based on search string
     *
     * @param searchQuery Query string (name)
     * @returns List of users
     */
    public async getUsers(searchQuery: string): Promise<UserResponse> {
        const url: string = "/api/users";
        const params = {
            searchQuery
        };
        return this.callAPI(HTTPMethod.GET, url, params);
    };

    /**
     * Get a list of all Team requests user has made
     *
     * @returns Array of Team requests
     */
    public async getUserTeamRequestAll(): Promise<TeamRequestItem[]> {
        const url: string = "/api/me/teamRequests";
        return this.callAPI(HTTPMethod.GET, url);
    };

    /** Validate teamName provided by user
     *
     * @param teamName teamName provided by user
     * @returns "full" team displayName based on validation (naming convention) and any validation errors (e.g. name already in use)
     */
    public async validateGroup(teamName: string): Promise<ValidationResponse> {
        const url: string = "/api/validateGroup";
        const params = {
            teamName
        };
        return this.callAPI(HTTPMethod.GET, url, params);
    };

    /**
     * Send completed Team request form for processing
     *
     * @param teamRequest Completed Team request
     * @returns Standard HTTP response e.g. 200 - OK
     */
    public async requestTeam(teamRequest: NewTeamRequest): Promise<any> {
        const url: string = "/api/teamRequest";
        const body = JSON.stringify(teamRequest);
        return this.callAPI(HTTPMethod.POST, url, undefined, body);
    };

}
