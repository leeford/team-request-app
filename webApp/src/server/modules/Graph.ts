import "isomorphic-fetch";
import { Client, ClientOptions, ResponseType } from "@microsoft/microsoft-graph-client";
import { ClientCredentialAuthenticationProvider } from "./AuthenticationProvider";
import { ValidationProperties } from "../../types/Graph/ValidationProperties";
import { ConversationMember, Group, GroupSetting, Team, TeamsAsyncOperation, User } from "@microsoft/microsoft-graph-types";

export class Graph {

    client: Client;

    constructor() {
        const clientOptions: ClientOptions = {
            defaultVersion: "v1.0",
            debugLogging: false,
            authProvider: new ClientCredentialAuthenticationProvider()
        };
        this.client = Client.initWithMiddleware(clientOptions);
    }

    /**
     * Get users based on search string
     *
     * @param searchQuery Search query (typed by user)
     */
    async getUsers(searchQuery: string): Promise<User[]> {
        const request = await this.client.api("/users")
            .header("ConsistencyLevel", "Eventual")
            .select("id, displayName, jobTitle")
            .search(`"displayName:${searchQuery}"`)
            .filter("userType eq 'Member' and accountEnabled eq true")
            .orderby("displayName")
            .top(25)
            .get();
        return request.value;
    }

    /**
     * Check if any Teams already exist with display name
     *
     * @param teamName displayName of Team that is being checked
     * @returns An array of existing Teams with the specified displayName
     */
    async getTeams(teamName: string): Promise<Team[]> {
        // URI encode teamName and escape any single quote ' => ''
        const encodedName = encodeURIComponent(teamName).replace("'", "''");
        const request = await this.client.api("/groups")
            .version("beta") // Required to to filter groups to 'Team'
            .select("displayName")
            .filter(`resourceProvisioningOptions/Any(x:x eq 'Team') and displayName eq '${encodedName}'`)
            .get();
        return request.value;
    }

    /**
     * Validate chosen group properties will pass validation BEFORE the attempt to creat the Team
     *
     * @param groupProperties Group properties that include the display name and user ID who the group/Team is for
     * @returns Either a 204 (No content) or an 422 if failed validation
     */
    async validateProperties(groupProperties: ValidationProperties): Promise<any> {
        const request = await this.client.api("/directoryObjects/validateProperties")
            .post(groupProperties);
        return request;
    }

    /**
     * Create Team with template
     *
     * @param team Object containing the team name, one owner, template etc.
     * @returns RAW HTTP response so the location header of the TeamsAsyncOperation can be found
     */
    async createTeam(team: Team): Promise<any> {
        const request = await this.client.api("/teams")
            .responseType(ResponseType.RAW)
            .post(team);
        return request;
    }

    /**
     * Add a owner/member to a Team
     *
     * @param teamId Id of the Team where a member is being added
     * @param teamMember Member being added
     * @returns Member who was added
     */
    async addTeamMember(teamId: string, teamMember: ConversationMember): Promise<ConversationMember> {
        const request = await this.client.api(`/teams/${teamId}/members`)
            .post(teamMember);
        return request;
    }

    /**
     * Check current provisiong state of a Team creation (TeamsAsyncOperation)
     *
     * @param teamLocation Location URI to check current status of TeamsAsyncOperation
     * @returns Current status of the TeamsAsyncOperation
     */
    async checkTeamProvisioned(teamLocation: string): Promise<TeamsAsyncOperation> {
        const request = await this.client.api(teamLocation)
            .get();
        return request;
    }

    /**
     * Create group setting against a group/Team
     *
     * @param groupId Id of group to apply group setting
     * @param groupSetting Definition of group setting
     * @returns Created group setting
     */
    async createGroupSetting(groupId: string, groupSetting: GroupSetting): Promise<GroupSetting> {
        const request = await this.client.api(`/groups/${groupId}/settings`)
            .post(groupSetting);
        return request;
    }

    /**
     * Check current provisiong state of a Team creation (TeamsAsyncOperation)
     *
     * @param groupId Group Id to check group is provisioned
     * @returns Current status of the TeamsAsyncOperation
     */
    async checkGroupProvisioned(groupId: string): Promise<Group> {
        const request = await this.client.api(`/groups/${groupId}`)
            .get();
        return request;
    }

    /**
     * Delete Team
     *
     * @param teamId Id of Team to delete
     */
    async deleteTeam(teamId: string): Promise<void> {
        await this.client.api(`/teams/${teamId}`)
            .delete();
    }

}
