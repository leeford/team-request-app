# Team Request App

> **Disclaimer:** This tool is provided ‘as-is’ without any warranty or support. Use of it is at your own risk and I accept no responsibility for any damage caused.

Team Request App is a Microsoft Teams app that allows users to request a new Team through a managed, controlled process (compared to the standard process in Teams).

![image](https://user-images.githubusercontent.com/472320/129489661-92019858-1764-4979-9684-0bc2b02ebe66.png)

This app allows the following when requesting a Team:

* **Enforce a naming policy** - Supports [Azure AD group naming policies](https://docs.microsoft.com/en-us/azure/active-directory/enterprise-users/groups-naming-policy), ensuring the chosen Team name contains the required suffixes/prefixes and does not contain any blocked words *before* attempting to create the Team
* **Team visibility** - Define whether the Team is public (visible to all) or private (invite-only) and what the default value is
* **Guest access** - Choose whether guests are to be allowed in the Team and what the default value is
* **Team template** - Choose a [custom Team template](https://docs.microsoft.com/en-us/microsoftteams/create-a-team-template) (configured in Teams Admin Center). This template can contain preconfigured channels, tabs and apps
* **Team owners and members** - Search for owners and members of your Team. A minimum numnber of owners is enforced

When a Team is requested, the app will attempt to provision the Team and the user can see the status of this and previous requests:

![image](https://user-images.githubusercontent.com/472320/129489827-f6dc507f-a1f8-429a-8010-248c6b9b5a14.png)

A video example of the whole process can be found [here](https://youtu.be/2Mm995G8Ubs)

# Getting started
Firstly, read the [Solution overview](https://github.com/leeford/team-request-app/wiki/Solution-overview) to get a handle of the different components that make up the tool, what it does and how it works.

For estimated costs, see [Example costs](https://github.com/leeford/team-request-app/wiki/Example-costs).

Once you are happy to proceed, you can following the [Deployment guide](https://github.com/leeford/team-request-app/wiki/Deployment-guide).