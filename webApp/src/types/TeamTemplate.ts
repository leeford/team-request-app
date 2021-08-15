import { BaseEntity } from "./BaseEntity";

export interface TeamTemplate extends BaseEntity {
    displayName: string;
    shortDescription: string;
}
