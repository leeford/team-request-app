import { TeamTemplate } from "../TeamTemplate";
import { BaseEntity } from "../BaseEntity";
import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";

export interface AppConfigItem extends BaseEntity {
    teamAllowGuestsDefault: boolean;
    teamVisbilityDefault: TeamVisibilityType;
    minimumTeamOwners: number;
    teamTemplates: TeamTemplate[];
}
