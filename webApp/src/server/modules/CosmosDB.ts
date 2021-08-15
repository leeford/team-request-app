import { CosmosClient, CosmosClientOptions, FeedOptions, SqlQuerySpec } from "@azure/cosmos";
import { AppConfigItem } from "../../types/App/AppConfigItem";
import { BaseEntity } from "../../types/BaseEntity";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";

export class CosmosDB {

    private database: string;
    private client: CosmosClient;

    private containerTeamRequests: string = "teamRequests";
    private containerAppConfig: string = "appConfig";

    constructor() {

        const endpoint = process.env.CosmosDbUri as string;
        const key = process.env.CosmosDbKey as string;
        this.database = process.env.CosmosDbDatabase as string;

        const cosmosClientOptions: CosmosClientOptions = { endpoint, key };
        this.client = new CosmosClient(cosmosClientOptions);

        // Create DB (if it doesn't exist)
        this.client.databases.createIfNotExists({ id: this.database });

        // Create Containers (if they doesn't exist)
        this.ensureContainer(this.containerTeamRequests, "/requestedByUserId");
        this.ensureContainer(this.containerAppConfig, "/id");

    }

    /**
     * Ensure container exists before operation
     *
     * @param container Container
     * @param partitionKey Property to be used as partition key
     */
    private async ensureContainer(container: string, partitionKey?: string): Promise<void> {
        await this.client.database(this.database).containers.createIfNotExists({ id: container, partitionKey: partitionKey || "/id" });
    }

    /**
     * Generic method for retuning all items of a container using a query. Returns results or an empty type array
     *
     * @param containerName Container
     * @param query SQL-like query
     * @param feedOptions Cosmos feed options
     * @returns Array of typed items
     */
    private async getItems<T extends BaseEntity>(containerName: string, query: SqlQuerySpec, feedOptions?: FeedOptions): Promise<T[]> {
        const result = await this.client
            .database(this.database)
            .container(containerName)
            .items
            .query(query, feedOptions)
            .fetchAll();

        if (result.resources && result.resources.length > 0) {
            return result.resources;
        }

        // return an empty array if no results are received from Cosmos
        return [] as T[];
    }

    /**
     * Generic method for getting an item from a Cosmos container
     *
     * @param id Id of item
     * @param containerName Container
     * @param partitionKey Partition key of item
     * @returns Item
     */
    private async getItem<T extends BaseEntity>(id: string, containerName: string, partitionKey?: string): Promise<T> {
        const { resource: item } = await this.client
            .database(this.database)
            .container(containerName)
            .item(id, (partitionKey || id))
            .read();

        return item;
    }

    /**
     * Generic method for upserting (update if exists, otherwise create) item into a Cosmos container
     *
     * @param itemToUpsert Item
     * @param containerName Container
     * @returns Upserted item
     */
    private async upsertItem<T extends BaseEntity>(itemToUpsert: T, containerName: string): Promise<any> {
        const { resource: upsertedItem } = await this.client
            .database(this.database)
            .container(containerName)
            .items
            .upsert(itemToUpsert);

        return upsertedItem;
    }

    /**
     * Get single team request
     *
     * @param teamRequestId ID of teamRequest item
     * @param requestedByUserId ID of user who made request (partition key)
     * @returns teamRequest item
     */
    async getTeamRequest(teamRequestId: string, requestedByUserId: string): Promise<TeamRequestItem> {
        return await this.getItem<TeamRequestItem>(teamRequestId, this.containerTeamRequests, requestedByUserId);
    }

    /**
     * Get all team requests for a single user
     *
     * @param userId Id of user
     * @returns teamRequest items
     */
    async getUserTeamRequestAll(userId: string, top: number = 25): Promise<TeamRequestItem[]> {
        const querySpec: SqlQuerySpec = {
            query: "SELECT TOP @top r.id, r.requestedDateTime, r.teamAllowGuests, r.teamDisplayName, r.requestedByUserId, r.requestStatus, r.requestStatusHistory, r.teamDescription, r.teamMembers, r.teamOwners, r.teamTemplate, r.teamVisibility FROM r WHERE r.requestedByUserId = @userId ORDER BY r.requestedDateTime DESC",
            parameters: [
                { name: "@userId", value: userId },
                { name: "@top", value: top }
            ]
        };
        return await this.getItems<TeamRequestItem>(this.containerTeamRequests, querySpec);
    }

    // Create/update team request
    async upsertTeamRequest(request: TeamRequestItem): Promise<TeamRequestItem> {
        return await this.upsertItem<TeamRequestItem>(request, this.containerTeamRequests);
    }

    /**
     * Get the app config (if it exists, if not creates default)
     *
     * @returns App config item
     */
    async getAppConfig(): Promise<AppConfigItem> {
        const item = await this.getItem<AppConfigItem>("0", this.containerAppConfig);
        if (item) {
            return item;
        } else {
            // Precreate system configuration from the default configuration
            const defaultConfiguration: AppConfigItem = {
                id: "0",
                teamAllowGuestsDefault: false,
                teamVisbilityDefault: "private",
                minimumTeamOwners: 2,
                teamTemplates: [
                    {
                        id: "standard",
                        displayName: "Standard",
                        shortDescription: "Standard Team"
                    }
                ]
            };
            return await this.upsertConfiguration(defaultConfiguration);
        }
    }

    /**
     * Upsert app config
     *
     * @param config App config item to upsert
     * @returns Upserted app config item
     */
    async upsertConfiguration(config: AppConfigItem): Promise<AppConfigItem> {
        return await this.upsertItem<AppConfigItem>(config, this.containerAppConfig);
    }

}
