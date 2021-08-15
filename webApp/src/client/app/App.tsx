import * as React from "react";
import { useState, useEffect } from "react";
import { Alert, Flex, Provider, Text, ThemePrepared } from "@fluentui/react-northstar";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import * as microsoftTeams from "@microsoft/teams-js";
import { getTeamsTheme } from "../modules/TeamsTheme";
import { NewRequest } from "../newRequest/NewRequest";
import { Requests } from "../requests/Requests";
import { TeamsContext } from "../contexts/TeamsContext";
import { AppMenu } from "./AppMenu";
import { AppContext } from "../contexts/AppContext";
import { Application } from "../modules/Application";
import { API } from "../modules/API";
import { AppConfigResponse } from "../../types/API/AppConfigResponse";
import { AppAlert } from "../../types/App/AppAlert";
import { AppAlertType } from "../../types/App/AppAlertType";

export function App() {

    const [appAlert, setAppAlert] = useState<AppAlert>();
    const [appConfig, setAppConfig] = useState<AppConfigResponse>();
    const [appActiveIndex, setAppActiveIndex] = useState<number>(0);
    const [context, setContext] = useState<microsoftTeams.Context>();
    const [teamsTheme, setTeamsTheme] = useState<ThemePrepared<any>>(getTeamsTheme("default"));

    // Initialise Teams Client
    useEffect(() => {
        microsoftTeams.initialize(() => {
            microsoftTeams.getContext((context) => {
                setContext(context);
                // Use theme that it has changed to
                setTeamsTheme(getTeamsTheme(context.theme));
            });
            microsoftTeams.registerOnThemeChangeHandler((theme: string) => {
                // Use theme that it has changed to
                setTeamsTheme(getTeamsTheme(theme));
            });
        });
    }, []);

    // Get Auth Token
    useEffect(() => {
        if (context) {
            microsoftTeams.authentication.getAuthToken({
                successCallback: (token: string) => {
                    Application.token = token;
                    Application.API = new API();
                    // Get App Configuration
                    (async () => {
                        setAppConfig(await Application.API.getAppConfig());
                        microsoftTeams.appInitialization.notifySuccess();
                    })()
                        .catch((error) => {
                            microsoftTeams.appInitialization.notifyFailure({
                                reason: microsoftTeams.appInitialization.FailedReason.Other,
                                message: error
                            });
                        });
                },
                failureCallback: (message: string) => {
                    setAppAlert({ message, type: AppAlertType.Error });
                    microsoftTeams.appInitialization.notifyFailure({
                        reason: microsoftTeams.appInitialization.FailedReason.AuthFailed,
                        message
                    });
                },
                resources: [process.env.WebAppFQDN as string]
            });
        }
    }, [context]);

    if (Application.token && context && appConfig) {
        return (
            <Router>
                <Provider
                    theme={teamsTheme}
                >
                    <TeamsContext.Provider value={context}>
                        <AppContext.Provider value={{ appActiveIndex, setAppActiveIndex, appConfig, setAppAlert }}>
                            <Flex
                                fill={true}
                                column
                            >
                                <AppMenu />
                                {appAlert &&
                                    <Alert
                                        styles={{
                                            padding: "0.5rem",
                                            margin: "0.5rem 0"
                                        }}
                                        dismissible
                                        header={appAlert.type}
                                        content={appAlert.message}
                                        danger={appAlert.type === AppAlertType.Error}
                                        success={appAlert.type === AppAlertType.Success}
                                        visible={!!appAlert.message}
                                        onVisibleChange={() => { setAppAlert(undefined); }}
                                    />
                                }
                            </Flex>
                            <Flex
                                column
                                styles={{
                                    padding: "0 2rem 2rem 2rem"
                                }}
                            >
                                <Switch>
                                    <Route
                                        exact
                                        path="/newRequest" >
                                        <NewRequest />
                                    </Route>
                                    <Route
                                        exact
                                        path="/requests" >
                                        <Requests />
                                    </Route>
                                </Switch>
                            </Flex>
                        </AppContext.Provider>
                    </TeamsContext.Provider>
                </Provider>
            </Router>
        );
    } else {
        return (<Text content="Please wait..." />);
    }
};
