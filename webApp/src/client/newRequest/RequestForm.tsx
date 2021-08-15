import * as React from "react";
import { useCallback, useState, useEffect, useRef } from "react";
import { Flex, Form, FormCheckbox, FormDropdown, FormInput, FormRadioGroup, InfoIcon, Loader, Text, Tooltip } from "@fluentui/react-northstar";
import debounce from "lodash.debounce";
import { DropdownItem } from "../../types/Form/DropdownItem";
import { ValidationResponse } from "../../types/API/ValidationResponse";
import { TeamsContext } from "../contexts/TeamsContext";
import { AppContext } from "../contexts/AppContext";
import { AppAlertType } from "../../types/App/AppAlertType";
import { Application } from "../modules/Application";
import { NewRequestContext } from "../contexts/NewRequestContext";
import { teamVisibilityItems } from "./TeamVisibilityItems";
import { TeamVisibilityType } from "@microsoft/microsoft-graph-types";

export const RequestForm: React.FC = () => {

    const teamsContext = React.useContext(TeamsContext);
    const appContext = React.useContext(AppContext);
    const newRequestContext = React.useContext(NewRequestContext);

    const [isLoadingMemberList, setIsLoadingMemberList] = useState<boolean>(false);
    const [isLoadingOwnerList, setIsLoadingOwnerList] = useState<boolean>(false);
    const [isLoadingTeamName, setIsLoadingTeamName] = useState<boolean>(false);
    const [memberItems, setMemberItems] = useState<DropdownItem[]>();
    const [memberSearchQuery, setMemberSearchQuery] = useState<string>();
    const [ownerItems, setOwnerItems] = useState<DropdownItem[]>();
    const [ownerSearchQuery, setOwnerSearchQuery] = useState<string>();
    const [teamNameSearchQuery, setTeamNameSearchQuery] = useState<string>();
    const [teamNameValidationResponse, setTeamNameValidationResponse] = useState<ValidationResponse>();

    const teamNameSearchQueryRef = useRef<string>();
    const ownerSearchQueryRef = useRef<string>();
    const memberSearchQueryRef = useRef<string>();

    const getOwnerList = useCallback(debounce(async (ownerSearchQuery: string) => {
        if (teamsContext.userObjectId) {
            // Use reference to store current value (prevent race conditions)
            ownerSearchQueryRef.current = ownerSearchQuery;
            // Enable loading indicator
            setIsLoadingOwnerList(true);
            await Application.API.getUsers(ownerSearchQuery)
                .then((response) => {
                    // If response is in relation to current query (text in input), use it
                    // This is to stop race conditions
                    if (response.query === ownerSearchQueryRef.current) {
                        // Populate dropdown list
                        setOwnerItems(response.value);
                    }
                }).catch((error) => {
                    appContext.setAppAlert({ message: `Unable to get owners: ${error.message}`, type: AppAlertType.Error });
                })
                .finally(() => {
                    // Disable loading indicator
                    setIsLoadingOwnerList(false);
                });
        }
    }, 500), []
    );

    const getMemberList = useCallback(debounce(async (memberSearchQuery: string) => {
        if (teamsContext.userObjectId) {
            // Use reference to store current value (prevent race conditions)
            memberSearchQueryRef.current = memberSearchQuery;
            // Enable loading indicator
            setIsLoadingMemberList(true);
            await Application.API.getUsers(memberSearchQuery)
                .then((response) => {
                    // If response is in relation to current query (text in input), use it
                    // This is to stop race conditions
                    if (response.query === memberSearchQueryRef.current) {
                        // Populate dropdown list
                        setMemberItems(response.value);
                    }
                })
                .catch((error) => {
                    appContext.setAppAlert({ message: `Unable to get members: ${error.message}`, type: AppAlertType.Error });
                })
                .finally(() => {
                    // Disable loading indicator
                    setIsLoadingMemberList(false);
                });
        }
    }, 500), []
    );

    const validateTeamName = useCallback(debounce(async (teamNameSearchQuery: string | undefined) => {
        // Use reference to store current value (prevent race conditions)
        teamNameSearchQueryRef.current = teamNameSearchQuery;
        if (teamsContext.userObjectId && teamNameSearchQuery) {
            // Add "Loading icon" next to input
            setIsLoadingTeamName(true);
            // Check name is not use group passes validation based on name
            await Application.API.validateGroup(teamNameSearchQuery)
                .then((response: ValidationResponse) => {
                    // If response is in relation to current query (text in input), use it
                    // This is to stop race conditions
                    if (response.query === teamNameSearchQueryRef.current) {
                        setTeamNameValidationResponse(response);
                    }
                })
                .catch((error) => {
                    appContext.setAppAlert({ message: `Unable to validate Team name '${teamNameSearchQuery}': ${error.message}`, type: AppAlertType.Error });
                })
                .finally(() => {
                    // Clear Loading under input
                    setIsLoadingTeamName(false);
                });
        } else {
            // Clear Loading under input
            setIsLoadingTeamName(false);
        }
    }, 500), []
    );

    useEffect(() => {
        // If no errors found
        if (teamNameValidationResponse && teamNameValidationResponse.errors.length === 0) {
            // Set teamName
            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamDisplayName: teamNameValidationResponse.teamDisplayName });
        } else if (teamNameValidationResponse && teamNameValidationResponse.errors.length > 0) {
            // Set teamName to undefined
            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamDisplayName: undefined });
            // Update with any errors
            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamName: [...teamNameValidationResponse.errors] });
        }
    }, [teamNameValidationResponse]);

    // Team name updated
    useEffect(() => {
        if (teamNameSearchQuery && teamNameSearchQuery.length > 2) {
            validateTeamName(teamNameSearchQuery);
            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamName: [] });
        } else {
            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamName: ["Please provide a Team name at least 3 characters long"] });
        }
    }, [teamNameSearchQuery, validateTeamName]);

    // Get Owner User List
    useEffect(() => {
        if (ownerSearchQuery) {
            getOwnerList(ownerSearchQuery);
        }
    }, [ownerSearchQuery]);

    // Get Member User List
    useEffect(() => {
        if (memberSearchQuery) {
            getMemberList(memberSearchQuery);
        }
    }, [memberSearchQuery]);

    // Check if minimum owners satisfied
    useEffect(() => {
        if (!newRequestContext.teamRequest?.teamOwners || (Object.keys(newRequestContext.teamRequest?.teamOwners).length < appContext.appConfig.minimumTeamOwners)) {
            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamOwners: [`Please choose at least ${appContext.appConfig.minimumTeamOwners} Team owners`] });
        } else {
            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamOwners: [] });
        }
    }, [appContext.appConfig.minimumTeamOwners, newRequestContext.teamRequest?.teamOwners]);

    return (
        <Flex>
            <Form
                styles={{
                    width: "25rem"
                }}
            >
                <FormInput
                    fluid
                    label={<Flex vAlign="center"><Text content="Team name" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="The visible name for the Team. This name will be validated to ensure conforms to the company naming convention" /></Flex>}
                    name="teamName"
                    value={teamNameSearchQuery}
                    message={isLoadingTeamName
                        ? <Loader inline size="smallest" label="Checking name..." labelPosition="end" />
                        : newRequestContext.teamRequest?.teamDisplayName && <Flex vAlign="center"><Text content={`The Team will appear as '${newRequestContext.teamRequest.teamDisplayName}' in Teams`} styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="The full Team name may contain company enforced prefixes and suffixes" /></Flex>}
                    errorMessage={newRequestContext.inputValidationErrors.teamName.length > 0 && newRequestContext.inputValidationErrors.teamName.join(". ")}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setTeamNameSearchQuery(event.target.value);
                    }}
                    showSuccessIndicator={false}
                />
                <FormInput
                    fluid
                    label={<Flex vAlign="center"><Text content="Team description" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="Description of what the Team will be used for" /></Flex>}
                    name="teamDescription"
                    value={newRequestContext.teamRequest.teamDescription}
                    errorMessage={newRequestContext.inputValidationErrors.teamDescription.length > 0 && newRequestContext.inputValidationErrors.teamDescription.join(". ")}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamDescription: event.target.value });
                        if (event.target.value.length > 2) {
                            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamDescription: [] });
                        } else {
                            newRequestContext.setInputValidationErrors({ ...newRequestContext.inputValidationErrors, teamDescription: ["Please provide a Team description at least 3 characters long"] });
                        }
                    }}
                    showSuccessIndicator={false}
                />
                <FormRadioGroup
                    label={<Flex vAlign="center"><Text content="Team visibility" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="Private Team will be invite only. Public Team can be joined without an invite" /></Flex>}
                    defaultCheckedValue={appContext.appConfig.teamVisbilityDefault}
                    checkedValue={newRequestContext.teamRequest.teamVisibility}
                    items={teamVisibilityItems}
                    onCheckedValueChange={(event, data) => {
                        switch (data?.value as TeamVisibilityType) {
                            case "public":
                                newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamVisibility: "public" });
                                break;
                            case "private":
                                newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamVisibility: "private" });
                                break;
                        }
                    }}
                />
                <FormCheckbox
                    label={<Flex vAlign="center"><Text content="Allow guests" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="Allow guests (external users) to be invited to the Team" /></Flex>}
                    defaultChecked={appContext.appConfig.teamAllowGuestsDefault}
                    checked={newRequestContext.teamRequest.teamAllowGuests}
                    onClick={(_event, data) => {
                        if (typeof data?.checked === "boolean") {
                            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamAllowGuests: data.checked });
                        }
                    }}
                />
                <FormDropdown
                    fluid
                    label={<Flex vAlign="center"><Text content="Team template" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="Template with predefined channels and apps for your Team" /></Flex>}
                    value={newRequestContext.teamRequest.teamTemplate}
                    items={appContext.appConfig.teamTemplates}
                    onChange={(_event, data: any) => {
                        if (data?.value && typeof data?.value === "object") {
                            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamTemplate: data.value });
                        }
                    }}
                />
                <FormDropdown
                    fluid
                    label={<Flex vAlign="center"><Text content="Team owners" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="List of users who have ownership of the Team. This includes managing membership" /></Flex>}
                    multiple
                    search
                    searchQuery={ownerSearchQuery}
                    value={newRequestContext.teamRequest.teamOwners}
                    errorMessage={newRequestContext.inputValidationErrors.teamOwners.length > 0 && newRequestContext.inputValidationErrors.teamOwners.join(". ")}
                    items={ownerItems}
                    placeholder="Start typing a name..."
                    noResultsMessage="We couldn't find anyone with that name."
                    loading={isLoadingOwnerList}
                    loadingMessage="Please wait..."
                    onSearchQueryChange={(_event, data) => {
                        setOwnerSearchQuery(data.searchQuery);
                    }}
                    onChange={(_event, data: any) => {
                        if (data?.value && typeof data?.value === "object") {
                            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamOwners: data.value });
                        }
                    }}
                />
                <FormDropdown
                    fluid
                    label={<Flex vAlign="center"><Text content="Team members" styles={{ padding: "0 0.5rem 0 0" }} /><Tooltip trigger={<InfoIcon outline />} content="List of users who have membership of the Team" /></Flex>}
                    multiple
                    search
                    searchQuery={memberSearchQuery}
                    value={newRequestContext.teamRequest.teamMembers}
                    items={memberItems}
                    placeholder="Start typing a name..."
                    noResultsMessage="We couldn't find anyone with that name."
                    loading={isLoadingMemberList}
                    loadingMessage="Please wait..."
                    onSearchQueryChange={(_event, data) => {
                        setMemberSearchQuery(data.searchQuery);
                    }}
                    onChange={(_event, data: any) => {
                        if (data?.value && typeof data?.value === "object") {
                            newRequestContext.setTeamRequest({ ...newRequestContext.teamRequest, teamMembers: data.value });
                        }
                    }}
                />
            </Form>
        </Flex>
    );

};
