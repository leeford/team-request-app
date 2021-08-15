import * as React from "react";
import { AppAlert } from "../../types/App/AppAlert";
import { AppConfigResponse } from "../../types/API/AppConfigResponse";

interface AppContextProps {
    appActiveIndex: number;
    setAppActiveIndex: React.Dispatch<React.SetStateAction<number>>;
    appConfig: AppConfigResponse;
    setAppAlert: React.Dispatch<React.SetStateAction<AppAlert | undefined>>;
}

export const AppContext = React.createContext({} as AppContextProps);
