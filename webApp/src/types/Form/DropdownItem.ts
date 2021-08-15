import { BaseEntity } from "../BaseEntity";

export interface DropdownItem extends BaseEntity {
    header: string;
    content: string;
}
