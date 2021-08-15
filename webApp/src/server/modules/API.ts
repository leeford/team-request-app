import { Request, Response } from "express";
import moment from "moment";
import * as jwt from "jsonwebtoken";
import { AppConfigResponse } from "../../types/API/AppConfigResponse";
import { UserResponse } from "../../types/API/UserResponse";
import { ValidationResponse } from "../../types/API/ValidationResponse";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { TeamRequestStatus } from "../../types/TeamRequestStatus";
import { ValidationErrorDetails } from "../../types/Graph/ValidationErrorDetails";
import { ValidationProperties } from "../../types/Graph/ValidationProperties";
import { DropdownItem } from "../../types/Form/DropdownItem";
import { CosmosDB } from "./CosmosDB";
import { CreateTeam } from "./CreateTeam";
import { Graph } from "./Graph";
import { TeamTemplate } from "../../types/TeamTemplate";
import { NewTeamRequest } from "../../types/Form/NewTeamRequest";
import { User } from "@microsoft/microsoft-graph-types";

export class API {

    private static cosmos: CosmosDB;
    private static graph: Graph;

    /**
     * Create Cosmos DB client
     */
    private static async ensureCosmosClient(): Promise<void> {
        if (!this.cosmos) {
            this.cosmos = new CosmosDB();
        }
    }

    /**
     * Create MS Graph client
     */
    private static async ensureGraphClient(): Promise<void> {
        if (!this.graph) {
            this.graph = new Graph();
        }
    }

    /**
     * Processes each API call by initialising any clients as required
     *
     * @param response HTTP response to API call
     * @param requiresCosmosClient Is a Cosmos client required
     * @param requiresGraphClient Is a MS Graph client required
     */
    private static async processAPICall(response: Response, requiresCosmosClient: boolean, requiresGraphClient: boolean): Promise<void> {
        if (requiresCosmosClient) {
            await this.ensureCosmosClient()
                .catch((error) => {
                    response.sendStatus(500);
                    throw new Error(error);
                });
        }
        if (requiresGraphClient) {
            await this.ensureGraphClient()
                .catch((error) => {
                    response.sendStatus(500);
                    throw new Error(error);
                });
        }
    }

    /**
     * Returns user ID (oid) taken from the autorization token
     *
     * @param request HTTP request
     * @returns User ID (oid) taken from the autorization token
     */
    private static async getUserIdFromAuthToken(request: Request): Promise<string> {
        const token = this.getAuthToken(request);
        return token.payload.oid;
    }

    /**
     * Get Auth Token from HTTP request header
     *
     * @param request HTTP Request
     * @returns Auth token from HTTP request header
     */
    private static getAuthToken(request: Request): any {
        if (!request.headers.authorization) {
            throw new Error("No authorization token can be found");
        } else {
            const tokenString = request.headers.authorization.replace("Bearer ", "");
            const token: any = jwt.decode(tokenString, { complete: true });
            if (!token.payload.oid) {
                throw new Error("Invalid authorization token");
            }
            return token;
        }
    }

    /**
     * Get Application configuration from Cosmos
     *
     * @param request HTTP request of API call
     * @param response HTTP response of API call
     */
    public static async getAppConfig(request: Request, response: Response): Promise<void> {
        await this.processAPICall(response, true, false)
            .then(async () => {
                await this.cosmos.getAppConfig()
                    .then((result) => {
                        const teamTemplates: DropdownItem[] = [];
                        result.teamTemplates.forEach((template: TeamTemplate) => {
                            const templateItem: DropdownItem = {
                                header: template.displayName,
                                content: template.shortDescription,
                                id: template.id
                            };
                            teamTemplates.push(templateItem);
                        });
                        const appConfigResponse: AppConfigResponse = {
                            teamAllowGuestsDefault: result.teamAllowGuestsDefault,
                            teamVisbilityDefault: result.teamVisbilityDefault,
                            minimumTeamOwners: result.minimumTeamOwners,
                            teamTemplates
                        };
                        response.status(200).json(appConfigResponse);
                    });
            })
            .catch((error) => {
                response.status(400).send(error);
                throw new Error(error);
            });
    }

    /**
     * Find Users in MS Graph based on search string
     *
     * @param request HTTP request of API call
     * @param response HTTP response of API call
     */
    public static async getUsers(request: Request, response: Response): Promise<void> {
        await this.processAPICall(response, false, true)
            .then(async () => {
                if (request.query.searchQuery) {
                    await this.graph.getUsers(request.query.searchQuery as string)
                        .then((result) => {
                            const users: DropdownItem[] = [];
                            result.forEach((user: User) => {
                                if (user.id && user.displayName) {
                                    const userItem: DropdownItem = {
                                        header: user.displayName as string,
                                        content: user.jobTitle as string || "",
                                        id: user.id as string
                                    };
                                    users.push(userItem);
                                }
                            });
                            const UserResponse: UserResponse = {
                                query: request.query.searchQuery as string,
                                value: users
                            };
                            response.status(200).json(UserResponse);
                        });
                } else {
                    throw new Error("Invalid request");
                }
            })
            .catch((error) => {
                response.status(400).send(error.message);
                throw new Error(error);
            });
    }

    /**
     * Get all Team requests for a given user
     *
     * @param request HTTP request of API call
     * @param response HTTP response of API call
     */
    public static async getUserTeamRequestAll(request: Request, response: Response): Promise<void> {
        await this.processAPICall(response, true, false)
            .then(async () => {
                const userId = await this.getUserIdFromAuthToken(request);
                await this.cosmos.getUserTeamRequestAll(userId)
                    .then((result) => {
                        response.status(200).json(result);
                    });
            })
            .catch((error) => {
                response.status(400).send(error);
                throw new Error(error);
            });
    }

    /**
     * Validate name user has chosen is valid
     * This is validated in MS Graph
     *
     * @param request HTTP request of API call
     * @param response HTTP response of API call
     */
    public static async validateGroup(request: Request, response: Response): Promise<void> {
        await this.processAPICall(response, false, true)
            .then(async (): Promise<ValidationResponse> => {
                if (request.query.teamName) {
                    const userId = await this.getUserIdFromAuthToken(request);
                    const query = request.query.teamName as string;
                    const groupProperties: ValidationProperties = {
                        entityType: "Group",
                        displayName: request.query.teamName as string,
                        onBehalfOfUserId: userId
                    };
                    return new Promise((resolve, reject) => {
                        this.validateProperties(query, groupProperties, resolve, reject);
                    });
                } else {
                    throw new Error("Invalid request");
                }
            })
            .then(async (result: ValidationResponse) => {
                const validationResponse: ValidationResponse = result;
                // Check name is unique
                await this.graph.getTeams(validationResponse.teamDisplayName)
                    .then((teams) => {
                        if (teams && teams.length > 0) {
                            validationResponse.errors.push("Sorry, this Team name is already in use");
                        }
                    }).then(() => {
                        // Return team name to be used along with any errors
                        response.status(200).json(validationResponse);
                    });
            })
            .catch((error) => {
                response.status(400).send(error.message);
                throw new Error(error);
            });
    }

    /**
     * Validate Group properties in MS Graph
     *
     * @param query Original team name sent in query
     * @param groupProperties Validation properties that will be validated in MS Graph
     * @param resolve Resolve promise
     * @param reject Reject promise
     */
    private static async validateProperties(query: string, groupProperties: ValidationProperties, resolve: (value: ValidationResponse) => void, reject: (error: any) => void) {

        const errors: string[] = [];

        await this.graph.validateProperties(groupProperties)
            .then(() => {
                // Return original name with no errors
                resolve({
                    query,
                    teamDisplayName: groupProperties.displayName,
                    errors
                });
            })
            .catch(async (error) => {
                // Failed validation (code 422)
                if (error.statusCode === 422) {
                    let newteamDisplayName: string | undefined;
                    JSON.parse(error.body).details.forEach((validationErrorDetails: ValidationErrorDetails) => {
                        // Find out what error type it is and provide a user friendly message back to user
                        switch (validationErrorDetails.code) {
                            case "ContainsBlockedWord":
                                errors.push(`Team name cannot contain the blocked word '${validationErrorDetails.blockedWord}'`);
                                break;
                            case "MissingPrefixSuffix":
                                if (validationErrorDetails.target === "displayName") {
                                    newteamDisplayName = groupProperties.displayName;
                                    // Add missing prefix and suffix to display name
                                    if (validationErrorDetails.prefix) { newteamDisplayName = validationErrorDetails.prefix + newteamDisplayName; }
                                    if (validationErrorDetails.suffix) { newteamDisplayName = newteamDisplayName + validationErrorDetails.suffix; }
                                }
                                break;
                            default:
                                errors.push(validationErrorDetails.message);
                                break;
                        }
                    });
                    // If display name has changed, re-run validation
                    if (newteamDisplayName) {
                        groupProperties.displayName = newteamDisplayName;
                        await this.validateProperties(query, groupProperties, resolve, reject);
                    } else {
                        // Return original name with errors
                        resolve({
                            query,
                            teamDisplayName: groupProperties.displayName,
                            errors
                        });
                    }
                    // Non 422 code
                } else {
                    reject(error.message);
                }
            });

    }

    /**
     * Process new Team request
     *
     * @param request HTTP request of API call
     * @param response HTTP response of API call
     */
    public static async teamRequest(request: Request, response: Response): Promise<void> {
        await this.processAPICall(response, true, false)
            .then(async () => {

                const receivedTeamRequest = request.body as NewTeamRequest;

                if (receivedTeamRequest.teamAllowGuests !== undefined &&
                    receivedTeamRequest.requestedByUserId !== undefined &&
                    receivedTeamRequest.teamDescription !== undefined &&
                    receivedTeamRequest.teamDisplayName !== undefined &&
                    receivedTeamRequest.teamOwners !== undefined &&
                    receivedTeamRequest.teamTemplate !== undefined &&
                    receivedTeamRequest.teamVisibility !== undefined) {

                    // Loop through owners
                    const teamOwners: string[] = [];
                    receivedTeamRequest.teamOwners.forEach((owner: DropdownItem) => {
                        const teamOwner: string = `https://graph.microsoft.com/v1.0/users('${owner.id}')`;
                        // Add to owners list
                        teamOwners.push(teamOwner);
                    });

                    // Loop through members (if provided)
                    const teamMembers: string[] = [];
                    if (receivedTeamRequest.teamMembers && receivedTeamRequest.teamMembers.length > 0) {
                        receivedTeamRequest.teamMembers.forEach((member: DropdownItem) => {
                            const teamMember: string = `https://graph.microsoft.com/v1.0/users('${member.id}')`;
                            // Add to members list
                            teamMembers.push(teamMember);
                        });

                    }

                    // Add request to Cosmos
                    const teamRequestItem: TeamRequestItem = {
                        graphRequests: [],
                        requestedDateTime: moment().toISOString(),
                        requestedByUserId: receivedTeamRequest.requestedByUserId,
                        requestStatus: TeamRequestStatus.Requested,
                        requestStatusHistory: [
                            {
                                status: TeamRequestStatus.Requested,
                                statusDateTime: moment().toISOString()
                            }
                        ],
                        teamAllowGuests: receivedTeamRequest.teamAllowGuests,
                        teamDescription: receivedTeamRequest.teamDescription,
                        teamDisplayName: receivedTeamRequest.teamDisplayName,
                        teamMembers,
                        teamOwners,
                        teamTemplate: {
                            id: receivedTeamRequest.teamTemplate.id,
                            displayName: receivedTeamRequest.teamTemplate.header,
                            shortDescription: receivedTeamRequest.teamTemplate.content
                        },
                        teamVisibility: receivedTeamRequest.teamVisibility
                    };
                    await this.cosmos.upsertTeamRequest(teamRequestItem)
                        .then((result: TeamRequestItem) => {
                            if (result.id) {
                                // Start creation of Team
                                const createTeam = new CreateTeam();
                                createTeam.create(result.id, result.requestedByUserId);
                            } else {
                                throw new Error("No request ID found");
                            }
                        });
                    response.status(200).json();
                } else {
                    throw new Error("Invalid request");
                }
            })
            .catch((error) => {
                response.status(400).send(error.message);
                throw new Error(error);
            });
    }
}
