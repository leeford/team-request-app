
import { ThemePrepared, teamsDarkTheme, teamsHighContrastTheme, teamsTheme } from "@fluentui/react-northstar";

/**
 * Return a ThemePrepated object based on Teams theme name in context
 *
 * @param theme Name of theme from Teams context
 * @returns ThemePrepared object
 */
export function getTeamsTheme(theme: string | undefined): ThemePrepared {
    theme = theme || "";

    switch (theme) {
        case "dark":
            return teamsDarkTheme;
        case "contrast":
            return teamsHighContrastTheme;
        case "default":
        default:
            return teamsTheme;
    }
}
