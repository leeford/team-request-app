import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";
import { DropdownItem } from "./DropdownItem";

export interface NewTeamRequest {
    teamAllowGuests?: boolean;
    teamDisplayName?: string;
    requestedByUserId?: string;
    teamDescription?: string;
    teamMembers?: DropdownItem[];
    teamOwners?: DropdownItem[];
    teamTemplate?: DropdownItem;
    teamVisibility?: TeamVisibilityType;
}
