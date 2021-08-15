import { BaseEntity } from "./BaseEntity";
import { TeamRequestStatus } from "./TeamRequestStatus";
import { TeamRequestStatusHistory } from "./TeamRequestStatusHistory";
import { TeamTemplate } from "./TeamTemplate";
import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";
import { GraphRequest } from "./GraphRequest";

export interface TeamRequestItem extends BaseEntity {
    createdTeamId?: string;
    error?: string;
    requestedDateTime: string;
    requestedByUserId: string;
    requestStatus: TeamRequestStatus;
    requestStatusHistory: TeamRequestStatusHistory[];
    teamAllowGuests: boolean;
    teamDescription: string;
    teamDisplayName: string;
    teamMembers: string[];
    teamOwners: string[];
    teamTemplate: TeamTemplate;
    graphRequests: GraphRequest[];
    teamVisibility: TeamVisibilityType;
}
