import * as appInsights from "applicationinsights";
import { config } from "dotenv";
import * as path from "path";
import express from "express";
import passport from "passport";
import { BearerStrategy, ITokenPayload } from "passport-azure-ad";

import { API } from "./modules/API";

// Read environment variables from .env file
const ENV_FILE = path.join(__dirname, ".env");
config({ path: ENV_FILE });

// Create HTTP server
const app = express();
const port = process.env.port || process.env.PORT || 3978;

// App insights
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setSendLiveMetrics(true)
    .start();

// Parse Body
app.use(express.json());

// Create Azure AD Passport Bearer Strategy (used for user Auth)
const bearerStrategyOptions = {
    name: "user-auth",
    identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID as string}/.well-known/openid-configuration`,
    issuer: `https://sts.windows.net/${process.env.AZURE_TENANT_ID as string}/`,
    clientID: process.env.SSO_CLIENT_ID as string,
    audience: `api://${process.env.WebAppFQDN as string}/${process.env.SSO_CLIENT_ID as string}`,
    validateIssuer: true,
    passReqToCallback: false,
    scope: ["access_as_user"]
};

const bearerStrategy = new BearerStrategy(bearerStrategyOptions, (token: ITokenPayload, done: CallableFunction) => {
    // Send user info using the second argument
    done(null, {}, token);
}
);

// Enable passport
app.use(passport.initialize());
passport.use(bearerStrategy);

// Add /scripts and as static folder
app.use("/scripts", express.static(path.join(__dirname, "web/scripts")));

// Get App config
app.get("/api/config", passport.authenticate("oauth-bearer", { session: false }), (req: express.Request, res: express.Response) => { API.getAppConfig(req, res); });
// Get user list based on search
app.get("/api/users", passport.authenticate("oauth-bearer", { session: false }), (req: express.Request, res: express.Response) => { API.getUsers(req, res); });
// Get Team requests user has made
app.get("/api/me/teamRequests", passport.authenticate("oauth-bearer", { session: false }), (req: express.Request, res: express.Response) => { API.getUserTeamRequestAll(req, res); });
// Process a new Team request
app.post("/api/teamRequest", passport.authenticate("oauth-bearer", { session: false }), (req: express.Request, res: express.Response) => { API.teamRequest(req, res); });
// Validate a groups properties
app.get("/api/validateGroup", passport.authenticate("oauth-bearer", { session: false }), (req: express.Request, res: express.Response) => { API.validateGroup(req, res); });

// Listen on root
app.use("/", express.static(path.join(__dirname, "web/"), {
    index: "index.html"
}));

// Listen on port
app.listen(port, () => {
    console.log(`\nListening on port: ${port}`);
});
