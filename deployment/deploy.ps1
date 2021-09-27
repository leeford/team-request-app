<#

.SYNOPSIS
 
    deploy.ps1 - Deployment script for team-request-app
    https://github.com/leeford/team-request-app
 
.DESCRIPTION
    Author: Lee Ford

    This tool allows you to deploy team-request-app. See https://www.github.com/leeford/team-request-app for more details.

    This tool has been written for PowerShell "Core" with Windows, Mac and Linux in mind - it may not work with "Windows PowerShell".

.LINK
    Blog: https://www.lee-ford.co.uk
    Twitter: http://www.twitter.com/lee_ford
    LinkedIn: https://www.linkedin.com/in/lee-ford/
 
.EXAMPLE 
    
    Deploy:
    deploy.ps1 -SubscriptionId <Subscription ID> -ResourceGroup <Resource Group Name>

    Deploy with specified template parameters file:
    deploy.ps1 -SubscriptionId <Subscription ID> -ResourceGroup <Resource Group Name> -TemplateParametersFile <Parameters file>

#>
param (
    [Parameter(mandatory = $true)][string]$SubscriptionId,
    [Parameter(mandatory = $true)][string]$ResourceGroup,
    [Parameter(mandatory = $false)][string]$TemplateParametersFile
)

function Check-ModuleInstalled {
    param (
        [Parameter (mandatory = $true)][String]$Module
    )

    # Do you have module installed?
    Write-Message -Message "Checking module '$Module' installed..." -NoNewLine

    if (Get-Module -ListAvailable -Name $Module) {
        Write-Host "INSTALLED" -ForegroundColor Green
    }
    else {
        Write-Host "NOT INSTALLED" -ForegroundColor Red
        break
    }
    
}

Write-Host "`n----------------------------------------------------------------------------------------------
            `n deploy.ps1 - Lee Ford - https://github.com/leeford/team-request-app
            `n----------------------------------------------------------------------------------------------" -ForegroundColor Yellow

# Import helper script modules
Import-Module -Name "$PSScriptRoot/helperScripts/writeMessage.psm1"
Import-Module -Name "$PSScriptRoot/helperScripts/addAppRoles.psm1"
Import-Module -Name "$PSScriptRoot/helperScripts/addIpRules.psm1"

# File paths
$templateFile = "$PSScriptRoot/deploymentTemplate.json"
$parametersFile = "$PSScriptRoot/deploymentTemplate.parameters.json"
$webAppZipFile = "$PSScriptRoot/webApp.zip"

Check-ModuleInstalled -module "Az"

# Check if template parameters file specified - if not stay with default
if ($TemplateParametersFile) {
    $parametersFile = $TemplateParametersFile
}

# Check if already connected
$context = Get-AzContext

if ([string]$context.Subscription -ne [string]$SubscriptionId) {
    # Connect to Azure AD
    Connect-AzAccount
    # Select specified Subscription Id
    Set-AzContext -SubscriptionId $SubscriptionId
}

if ((Test-Path $templateFile) -and (Test-Path $parametersFile)) {
    # Create parameters file object
    $parametersObj = Get-Content -Raw -Path $parametersFile | ConvertFrom-Json

    Write-Message "Using parameters file: $parametersFile"

    try {
        Write-Message "Deploying ARM template (this may take some time)..." -NoNewLine
        $timeStamp = Get-Date -Format FileDateTime
        $deploy = New-AzResourceGroupDeployment -Name "team_request_app_deployment_powershell_$timeStamp" -ResourceGroupName $ResourceGroup -TemplateFile $templateFile -TemplateParameterFile $parametersFile -ErrorAction Stop
        Write-Host "SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "ARM deployment failed: $($_)"
    }

    # Give it 60 seconds for everything to be fully deployed
    Write-Message "Sleeping for 60 seconds post ARM deployment"
    Start-Sleep -Seconds 60

    # Add roles to Managed Identity
    Add-AppRoles -PrincipalId $deploy.Outputs.managedIdentityPrincipalId.Value

    # Upload zipped Web App
    try {
        if (Test-Path $webAppZipFile) {
            Write-Message "Publishing Web App..." -NoNewLine
            Publish-AzWebapp -ResourceGroupName $ResourceGroup -Name $deploy.Outputs.webAppName.Value -ArchivePath $webAppZipFile -Force | Out-Null
            Write-Host "SUCCESS" -ForegroundColor Green
        }
        else {
            Throw "No webApp.zip found"
        }
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Web App upload failed: $($_)"
    }

    # Generate Teams App Manifest
    try {
        $manifestTemplatePath = "$PSScriptRoot/teamsApp"

        if (Test-Path $manifestTemplatePath) {
            $temporaryPath = "$PSScriptRoot/tempTeamsApp"
            $temporaryManifest = "$temporaryPath/manifest.json"
            $destinationPath = "$PSScriptRoot/teamsApp.zip"

            # Take a copy of manifest template
            Write-Message "Copying Teams App Manifest template..." -NoNewLine
            Copy-Item -Path $manifestTemplatePath -Destination $temporaryPath -Recurse -Force
            Write-Host "SUCCESS" -ForegroundColor Green

            # Update values in manifest
            Write-Message "Updating Teams App Manifest template with values..." -NoNewline
            $teamsAppManifestContent = Get-Content $temporaryManifest
            $teamsAppManifestContent = $teamsAppManifestContent.Replace("<Azure Web App FQDN>", $deploy.Outputs.siteHost.Value)
            $teamsAppManifestContent = $teamsAppManifestContent.Replace("<AAD App Client ID>", $parametersObj.parameters.appClientId.Value)
            # Update file
            $teamsAppManifestContent | Set-Content $temporaryManifest -Force
            Write-Host "SUCCESS" -ForegroundColor Green

            # Zip up manifest in to package
            Write-Message "Creating Teams App Manifest at $destinationPath..." -NoNewLine
            Compress-Archive -Path "$temporaryPath/*" -DestinationPath $destinationPath -Force
            Write-Host "SUCCESS" -ForegroundColor Green

            # Remove temporary directory
            Remove-Item -Path $temporaryPath -Recurse -Force
        }
        else {
            Throw "Teams App template missing"
        }
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Teams App Manifest generation failed: $($_)"
    }

    # Update AD App Registration with deployed Web App FQDN
    try {
        Write-Message "Updating Azure AD App Registration..." -NoNewLine
        Set-AzADApplication -ApplicationId $parametersObj.parameters.appClientId.Value -IdentifierUri "api://$($deploy.Outputs.siteHost.Value)/$($parametersObj.parameters.appClientId.Value)" | Out-Null
        Write-Host "SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Azure AD App registation update failed: $($_)"
    }


    # Add Web App IPs to Key Vault and Cosmos ACL
    Add-IPRules -WebAppOutboundIPAddresses $deploy.Outputs.webAppOutboundIPAddresses.Value -KeyVaultName $deploy.Outputs.keyVaultName.Value -CosmosDbAccountName $deploy.Outputs.cosmosDbAccountName.Value -ResourceGroup $ResourceGroup

    Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green

}
else {
    Throw "No template or parameter file found"
}