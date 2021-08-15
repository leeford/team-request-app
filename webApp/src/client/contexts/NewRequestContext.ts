import * as React from "react";
import { InputValidationErrors } from "../../types/Form/InputValidationError";
import { NewTeamRequest } from "../../types/Form/NewTeamRequest";

interface NewRequestContextProps {
    inputValidationErrors: InputValidationErrors;
    setInputValidationErrors: React.Dispatch<React.SetStateAction<InputValidationErrors>>;
    teamRequest: NewTeamRequest;
    setTeamRequest: React.Dispatch<React.SetStateAction<NewTeamRequest>>;
}

export const NewRequestContext = React.createContext({} as NewRequestContextProps);
