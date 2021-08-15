import moment from "moment";
import { CosmosDB } from "./CosmosDB";
import { Graph } from "./Graph";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { TeamRequestStatus } from "../../types/TeamRequestStatus";
import { Group, GroupSetting, TeamsAsyncOperation } from "@microsoft/microsoft-graph-types";

export class CreateTeam {

    private cosmos: CosmosDB;
    private graph: Graph;

    constructor() {
        this.cosmos = new CosmosDB();
        this.graph = new Graph();
    }

    /**
     * Create new Team from request in Cosmos
     *
     * @param teamRequestId Id of teamRequest (in Cosmos)
     * @param requestedByUserId User who made request (used as PK in Cosmos)
     */
    public async create(teamRequestId: string, requestedByUserId: string, attempt: number = 1): Promise<void> {
        // Get request from Cosmos
        let teamRequest: TeamRequestItem = await this.cosmos.getTeamRequest(teamRequestId, requestedByUserId);
        // Retry parameters
        const maxRetries: number = 3;
        // Update Cosmos that the creation has started
        teamRequest = await this.updateRequestStatus(teamRequest, TeamRequestStatus.Creating);
        // Create Graph request object
        const teamObjectBody: any = {
            "template@odata.bind": `https://graph.microsoft.com/v1.0/teamsTemplates('${teamRequest.teamTemplate.id}')`,
            description: teamRequest.teamDescription,
            displayName: teamRequest.teamDisplayName,
            members: [{
                "@odata.type": "#microsoft.graph.aadUserConversationMember",
                roles: ["owner"],
                "user@odata.bind": teamRequest.teamOwners[0]
            }],
            visibility: teamRequest.teamVisibility
        };

        // Update Request with Graph request
        teamRequest.graphRequests.push({
            uri: "/teams",
            body: teamObjectBody
        });

        // Create Team using Graph
        await this.graph.createTeam(teamObjectBody)
            .then((response: any): Promise<TeamsAsyncOperation> => {
                // Check that Team has been provisioned
                const teamLocation: string = response.headers.get("Location");
                if (response.ok === true) {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            this.waitForTeamProvisioning(teamLocation, resolve, reject);
                        }, 5000);
                    });
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((response: TeamsAsyncOperation): Promise<Group> => {
                if (response.targetResourceId) {
                    teamRequest.createdTeamId = response.targetResourceId;
                    return new Promise((resolve, reject) => {
                        this.graph.checkGroupProvisioned(teamRequest.createdTeamId as string)
                            .then((group: Group) => resolve(group))
                            .catch((error) => {
                                if (error && error.statusCode === 404) {
                                    setTimeout(() => {
                                        this.waitForGroupProvisioning(teamRequest.createdTeamId as string, resolve, reject);
                                    }, 10000);
                                } else {
                                    reject(error);
                                }
                            });
                    });
                } else {
                    throw new Error("No targetResourceId");
                }
            })
            .then(async (response: Group) => {
                if (response.id) {
                    // Add All Members
                    teamRequest.teamMembers.forEach((member) => {
                        const memberObjectBody: any = {
                            "@odata.type": "#microsoft.graph.aadUserConversationMember",
                            roles: ["member"],
                            "user@odata.bind": member
                        };
                        teamRequest.graphRequests.push({
                            uri: `/teams/${response.id}/members`,
                            body: memberObjectBody
                        });
                        this.graph.addTeamMember(response.id as string, memberObjectBody);
                    });
                    // Add All Owners
                    teamRequest.teamOwners.forEach((owner) => {
                        const ownerObjectBody: any = {
                            "@odata.type": "#microsoft.graph.aadUserConversationMember",
                            roles: ["owner"],
                            "user@odata.bind": owner
                        };
                        teamRequest.graphRequests.push({
                            uri: `/teams/${response.id}/owners`,
                            body: ownerObjectBody
                        });
                        this.graph.addTeamMember(response.id as string, ownerObjectBody);
                    });
                    // Disable Guest Access
                    if (teamRequest.teamAllowGuests === false) {
                        const groupSettingObject: GroupSetting = {
                            displayName: "GroupSettings",
                            templateId: "08d542b9-071f-4e16-94b0-74abb372e3d9",
                            values: [
                                {
                                    name: "AllowToAddGuests",
                                    value: "false"
                                }
                            ]
                        };
                        teamRequest.graphRequests.push({
                            uri: `/groups/${response.id}/settings`,
                            body: groupSettingObject
                        });
                        this.graph.createGroupSetting(response.id as string, groupSettingObject);
                    }
                    // Update Request
                    teamRequest = await this.updateRequestStatus(teamRequest, TeamRequestStatus.Complete);
                } else {
                    throw new Error("No teamId");
                }
            })
            .catch(async (error) => {
                // Remove any remnant of failed attempt (Team)
                if (teamRequest.createdTeamId) {
                    this.graph.deleteTeam(teamRequest.createdTeamId as string);
                    teamRequest.createdTeamId = undefined;
                }
                // Retry on failure
                if (attempt < maxRetries) {
                    attempt++;
                    // Wait 30 seconds and try again
                    setTimeout(() => {
                        this.create(teamRequestId, requestedByUserId, attempt);
                    }, 30000);
                } else {
                    // Update Request
                    teamRequest.error = error.message || error;
                    teamRequest = await this.updateRequestStatus(teamRequest, TeamRequestStatus.Failed);
                }
            });
    }

    /**
     * Check if the Team has finished provisioning, if not wait for pre-determined amount of time and run recursively
     *
     * @param teamLocation Location of TeamsAsyncOperation
     * @param resolve Resolve on Team creation
     * @param reject Reject on error
     */
    private waitForTeamProvisioning(teamLocation: string, resolve: (value: TeamsAsyncOperation) => void, reject: (error: any) => void): void {
        if (teamLocation) {
            const graph = new Graph();
            graph.checkTeamProvisioned(teamLocation)
                .then((teamsAsyncOperation: TeamsAsyncOperation) => {
                    if (teamsAsyncOperation.status === "succeeded") {
                        resolve(teamsAsyncOperation);
                        return;
                    }
                    setTimeout(() => {
                        this.waitForTeamProvisioning(teamLocation, resolve, reject);
                    }, 10000);
                })
                .catch((error) => {
                    reject(error);
                });
        } else {
            reject("No team location found");
        }
    }

    /**
     * Check if the Group has finished provisioning, if not wait for pre-determined amount of time and run recursively
     *
     * @param groupId Id of group to check
     * @param resolve Resolve on Group creation
     * @param reject Reject on error
     */
    private waitForGroupProvisioning(groupId: string, resolve: (value: Group) => void, reject: (error: any) => void): void {
        if (groupId) {
            const graph = new Graph();
            graph.checkGroupProvisioned(groupId)
                .then((group: Group) => {
                    resolve(group);
                })
                .catch(error => {
                    if (error && error.statusCode === 404) {
                        setTimeout(() => {
                            this.waitForGroupProvisioning(groupId, resolve, reject);
                        }, 10000);
                    } else {
                        reject(error);
                    }
                });
        } else {
            reject("No group id found");
        }
    }

    private async updateRequestStatus(teamRequest: TeamRequestItem, status: TeamRequestStatus): Promise<TeamRequestItem> {
        teamRequest.requestStatus = status;
        teamRequest.requestStatusHistory.push(
            {
                status,
                statusDateTime: moment().toISOString()
            }
        );
        const updatedTeamRequest = await this.cosmos.upsertTeamRequest(teamRequest);
        return updatedTeamRequest;
    }

}
