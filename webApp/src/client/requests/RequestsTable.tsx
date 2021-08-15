import * as React from "react";
import { Table, Text } from "@fluentui/react-northstar";
import moment from "moment";
import { TeamsContext } from "../contexts/TeamsContext";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { RequestStatusLabel } from "./RequestStatusLabel";

interface RequestsTableProps {
    requests: TeamRequestItem[]
}

export const RequestsTable: React.FC<RequestsTableProps> = (props: RequestsTableProps) => {

    const teamsContext = React.useContext(TeamsContext);

    const isMobile = !!(teamsContext.hostClientType === "android" || teamsContext.hostClientType === "ios");

    let header;
    let rows;
    if (isMobile) {
        header = {
            items: ["Date", "Name", "Status"]
        };
        rows = props.requests.map((request) => {
            return {
                key: request.id,
                items: [
                    {
                        key: `${request.id}-date`,
                        content: <Text content={moment(request.requestedDateTime).format("lll")} title={moment(request.requestedDateTime).format("LLLL")} timestamp />,
                        truncateContent: true
                    },
                    {
                        key: `${request.id}-teamDisplayName`,
                        content: <Text content={request.teamDisplayName} title={request.teamDisplayName} />,
                        truncateContent: true
                    },
                    {
                        key: `${request.id}-requestStatus`,
                        content: <RequestStatusLabel status={request.requestStatus} statusHistory={request.requestStatusHistory} />
                    }
                ]
            };
        });
    } else {
        header = {
            items: ["Date", "Name", "Visibility", "Allow guests", "Template", "Owners", "Members", "Status"]
        };
        rows = props.requests.map((request) => {
            return {
                key: request.id,
                items: [
                    {
                        key: `${request.id}-date`,
                        content: <Text content={moment(request.requestedDateTime).format("lll")} title={moment(request.requestedDateTime).format("LLLL")} timestamp />,
                        truncateContent: true
                    },
                    {
                        key: `${request.id}-teamDisplayName`,
                        content: <Text content={request.teamDisplayName} title={request.teamDisplayName} />,
                        truncateContent: true
                    },
                    {
                        key: `${request.id}-teamVisibility`,
                        content: <Text content={request.teamVisibility} title={request.teamVisibility} />
                    },
                    {
                        key: `${request.id}-teamAllowGuests`,
                        content: <Text content={request.teamAllowGuests === true ? "Yes" : "No"} title={request.teamAllowGuests === true ? "Yes" : "No"} />
                    },
                    {
                        key: `${request.id}-teamTemplate`,
                        content: <Text content={request.teamTemplate.displayName} title={request.teamTemplate.displayName} />,
                        truncateContent: true
                    },
                    {
                        key: `${request.id}-teamOwners`,
                        content: <Text content={request.teamOwners.length} title={request.teamOwners.length.toString()} />
                    },
                    {
                        key: `${request.id}-teamMembers`,
                        content: <Text content={request.teamMembers.length} title={request.teamMembers.length.toString()} />
                    },
                    {
                        key: `${request.id}-requestStatus`,
                        content: <RequestStatusLabel status={request.requestStatus} statusHistory={request.requestStatusHistory} />
                    }
                ]
            };
        });
    }

    return (
        <Table compact header={header} rows={rows} />
    );
};
