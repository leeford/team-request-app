import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";
import { DropdownItem } from "../Form/DropdownItem";
export interface AppConfigResponse {
    teamAllowGuestsDefault: boolean;
    teamVisbilityDefault: TeamVisibilityType;
    minimumTeamOwners: number;
    teamTemplates: DropdownItem[];
}
