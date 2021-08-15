import * as React from "react";
import { useState } from "react";
import { Flex, Header } from "@fluentui/react-northstar";
import jwtDecode from "jwt-decode";
import { NewTeamRequest } from "../../types/Form/NewTeamRequest";
import { RequestForm } from "./RequestForm";
import { InputValidationErrors } from "../../types/Form/InputValidationError";
import { AppContext } from "../contexts/AppContext";
import { Application } from "../modules/Application";
import { TeamsContext } from "../contexts/TeamsContext";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { NewRequestContext } from "../contexts/NewRequestContext";

export const NewRequest: React.FC = () => {

    const appContext = React.useContext(AppContext);
    const teamsContext = React.useContext(TeamsContext);

    const decodedToken = jwtDecode<any>(Application.token);
    const [inputValidationErrors, setInputValidationErrors] = useState<InputValidationErrors>({ teamName: [], teamOwners: [], teamDescription: [] });
    const [teamRequest, setTeamRequest] = useState<NewTeamRequest>({
        teamAllowGuests: appContext.appConfig.teamAllowGuestsDefault,
        teamVisibility: appContext.appConfig.teamVisbilityDefault,
        requestedByUserId: teamsContext.userObjectId,
        teamOwners: [
            {
                header: decodedToken.name as string,
                content: "logged in user",
                id: decodedToken.oid as string
            }
        ]
    });

    return (
        <NewRequestContext.Provider value={{ inputValidationErrors, setInputValidationErrors, teamRequest, setTeamRequest }}>
            <Flex
                column
                gap="gap.medium"
            >
                <Header as="h2" content="New Team request" />
                <Flex.Item>
                    <RequestForm />
                </Flex.Item>
                <Flex.Item>
                    <div>
                        <ConfirmationDialog />
                    </div>
                </Flex.Item>
            </Flex>
        </NewRequestContext.Provider>
    );
};
