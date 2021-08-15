import { AppTab } from "../../types/App/AppTab";

export const appTabs: AppTab[] = [
    {
        index: 0,
        key: "newRequest",
        name: "New request",
        to: "/newRequest"
    },
    {
        index: 1,
        key: "requests",
        name: "History",
        to: "/requests"
    }
];
