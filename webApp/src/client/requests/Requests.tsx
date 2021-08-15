import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import { Button, Flex, Header, Loader, Text, RetryIcon } from "@fluentui/react-northstar";
import moment from "moment";
import { TeamsContext } from "../contexts/TeamsContext";
import { AppContext } from "../contexts/AppContext";
import { Application } from "../modules/Application";
import { RequestsTable } from "./RequestsTable";
import { TeamRequestItem } from "../../types/TeamRequestItem";
import { AppAlertType } from "../../types/App/AppAlertType";

export const Requests: React.FC = () => {

    const [teamRequests, setTeamRequests] = useState<TeamRequestItem[]>([]);
    const [isLoadingTeamRequests, setIsLoadingTeamRequests] = useState<boolean>(false);

    // Context
    const teamsContext = React.useContext(TeamsContext);
    const appContext = React.useContext(AppContext);

    /**
     * Return all Teams requests for logged in user
     */
    const getUserTeamRequestAll = useCallback(async () => {
        if (teamsContext.userObjectId) {
            setIsLoadingTeamRequests(true);
            await Application.API.getUserTeamRequestAll()
                .then((response) => {
                    setTeamRequests(response);
                })
                .catch((error) => {
                    appContext.setAppAlert({ message: `Unable to get Team requests: ${error.message}`, type: AppAlertType.Error });
                });
            setIsLoadingTeamRequests(false);
        }
    }, [appContext, teamsContext.userObjectId]);

    useEffect(() => {
        getUserTeamRequestAll();
    }, [appContext, getUserTeamRequestAll, teamsContext.userObjectId]);

    return (
        <Flex
            column
        >
            <Flex gap="gap.small" vAlign="center">
                <Header as="h2" content="Team request history" />
                <Button
                    icon={<RetryIcon />}
                    iconOnly
                    text
                    title="Refresh"
                    onClick={(_event) => {
                        getUserTeamRequestAll();
                    }}
                />
                {!isLoadingTeamRequests && <Text
                    content={`Last updated: ${moment().format("LT")}`}
                    weight="light"
                    size="small"
                />}
            </Flex>
            {isLoadingTeamRequests && <Loader label="Please wait..." />}
            {!isLoadingTeamRequests && teamRequests.length > 0 && <Flex column><Text content={`You have ${teamRequests.length} previous Team request(s):`} /><RequestsTable requests={teamRequests} /></Flex>}
            {!isLoadingTeamRequests && teamRequests.length === 0 && <Text align="center" content="You have no pervious Team requests" />}
        </Flex>
    );
};
