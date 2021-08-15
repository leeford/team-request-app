import * as React from "react";
import { Menu } from "@fluentui/react-northstar";
import { Link } from "react-router-dom";
import { AppContext } from "../contexts/AppContext";
import { appTabs } from "./AppTabs";

export const AppMenu: React.FC = () => {

    const appContext = React.useContext(AppContext);

    return (
        <Menu
            activeIndex={appContext.appActiveIndex}
            primary
            underlined
            styles={{
                padding: "0.5rem 2rem 0.25rem 2rem"
            }}
        >
            {appTabs.map((appTab) => {
                return (
                    <Link
                        key={appTab.key}
                        to={appTab.to}
                        style={{
                            color: "inherit",
                            textDecoration: "inherit"
                        }}
                        onClick={() => { appContext.setAppActiveIndex(appTab.index); }}
                    >
                        <Menu.Item
                            as="div"
                            index={appTab.index}
                        >
                            <Menu.ItemContent
                                styles={{
                                    padding: "0.5rem"
                                }}
                            >
                                {appTab.name}
                            </Menu.ItemContent>
                        </Menu.Item>
                    </Link>
                );
            })}
        </Menu >
    );
};
