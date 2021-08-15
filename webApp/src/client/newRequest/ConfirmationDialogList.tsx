import * as React from "react";
import { List } from "@fluentui/react-northstar";
import { NewRequestContext } from "../contexts/NewRequestContext";

export const ConfirmationDialogList: React.FC = () => {

    const newRequestContext = React.useContext(NewRequestContext);

    const items = [
        {
            key: "teamDisplayName",
            header: "Team name:",
            content: newRequestContext.teamRequest.teamDisplayName
        },
        {
            key: "teamDescription",
            header: "Team description:",
            content: newRequestContext.teamRequest.teamDescription
        },
        {
            key: "teamVisibility",
            header: "Team visibility:",
            content: newRequestContext.teamRequest.teamVisibility
        },
        {
            key: "teamAllowGuests",
            header: "Allow guests:",
            content: newRequestContext.teamRequest.teamAllowGuests === true ? "Yes" : "No"
        },
        {
            key: "teamTemplate",
            header: "Team template:",
            content: newRequestContext.teamRequest.teamTemplate?.header
        },
        {
            key: "teamOwners",
            header: "Team owners:",
            content: newRequestContext.teamRequest.teamOwners?.map(owner => owner.header).join(", ")
        },
        {
            key: "teamMembers",
            header: "Team members:",
            content: newRequestContext.teamRequest.teamMembers ? newRequestContext.teamRequest.teamMembers?.map(member => member.header).join(", ") : "None"
        }
    ];
    return (<List items={items} />);
};
