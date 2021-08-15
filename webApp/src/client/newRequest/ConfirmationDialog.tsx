import * as React from "react";
import { useState } from "react";
import { Button, Dialog, Flex, Text } from "@fluentui/react-northstar";
import { Redirect } from "react-router-dom";
import { ConfirmationDialogList } from "./ConfirmationDialogList";
import { AppAlertType } from "../../types/App/AppAlertType";
import { Application } from "../modules/Application";
import { NewRequestContext } from "../contexts/NewRequestContext";
import { AppContext } from "../contexts/AppContext";

export const ConfirmationDialog: React.FC = () => {

    const appContext = React.useContext(AppContext);
    const newRequestContext = React.useContext(NewRequestContext);

    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

    /**
     * Handle form submission
     */
    async function handleSubmit(): Promise<void> {
        await Application.API.requestTeam(newRequestContext.teamRequest)
            .then(() => {
                appContext.setAppAlert({ message: `Team '${newRequestContext.teamRequest.teamDisplayName}' successfully submitted`, type: AppAlertType.Success });
                setFormSubmitted(true);
            })
            .catch((error) => {
                appContext.setAppAlert({ message: `Unable to submit request: ${error.message}`, type: AppAlertType.Error });
            });
    }

    if (formSubmitted === true) {
        appContext.setAppActiveIndex(1);
        return (
            <Redirect to="/requests" />
        );
    }

    return (
        <Dialog
            style={{ width: "100%" }}
            cancelButton="Cancel"
            confirmButton="Confirm"
            content={
                <Flex
                    column
                >
                    <Text>Are you sure you want to request this Team?</Text>
                    <ConfirmationDialogList />
                </Flex>
            }
            header="Please confirm"
            onConfirm={() => handleSubmit()}
            trigger={
                <Button
                    content="Request"
                    primary
                    disabled={
                        newRequestContext.inputValidationErrors.teamDescription.length > 0 ||
                        newRequestContext.inputValidationErrors.teamName.length > 0 ||
                        newRequestContext.inputValidationErrors.teamOwners.length > 0 ||
                        newRequestContext.teamRequest.teamAllowGuests === undefined ||
                        newRequestContext.teamRequest.requestedByUserId === undefined ||
                        newRequestContext.teamRequest.teamDescription === undefined ||
                        newRequestContext.teamRequest.teamDisplayName === undefined ||
                        newRequestContext.teamRequest.teamTemplate === undefined ||
                        newRequestContext.teamRequest.teamVisibility === undefined
                    }
                />
            }
        />
    );
};
