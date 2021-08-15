import * as React from "react";
import moment from "moment";
import { Label, AcceptIcon, SendIcon, SyncIcon, CloseIcon, Tooltip, List } from "@fluentui/react-northstar";
import { TeamRequestStatus } from "../../types/TeamRequestStatus";
import { TeamRequestStatusHistory } from "../../types/TeamRequestStatusHistory";

interface RequestStatusLabelProps {
    status: TeamRequestStatus
    statusHistory: TeamRequestStatusHistory[]
}

export const RequestStatusLabel: React.FC<RequestStatusLabelProps> = (props: RequestStatusLabelProps) => {

    const historyItems = props.statusHistory.map((status) => {
        return {
            key: status.statusDateTime,
            header: `${status.status}:`,
            content: moment(status.statusDateTime).format("lll")
        };
    });

    let icon;
    let color;

    switch (props.status) {
        case TeamRequestStatus.Requested:
            icon = <SendIcon />;
            color = "orange";
            break;
        case TeamRequestStatus.Creating:
            icon = <SyncIcon />;
            color = "brand";
            break;
        case TeamRequestStatus.Complete:
            icon = <AcceptIcon />;
            color = "green";
            break;
        case TeamRequestStatus.Failed:
            icon = <CloseIcon />;
            color = "red";
            break;
        default:
            break;
    }

    return (
        <Tooltip
            content={
                <List items={historyItems} />
            }
            trigger={
                <Label
                    styles={{
                        color: "#ffffff"
                    }}
                    content={props.status}
                    icon={icon}
                    color={color}
                    iconPosition="start"
                />
            }
        />
    );
};
