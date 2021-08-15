function Add-AppRoles {
    param (
        [Parameter (mandatory = $true)][String]$PrincipalId
    )

    try {
        Import-Module -Name "$PSScriptRoot/writeMessage.psm1"
        Write-Message "Adding Graph application permissions to managed identity/service principal..." -NoNewLine
        $graphApp = Get-AzADServicePrincipal | Where-Object { $_.DisplayName -eq "Microsoft Graph" }
        $graphResourceId = $graphApp[0].Id
        $roleIds = @(
            "19dbc75e-c2e2-444c-a770-ec69d8559fc7", # Directory.ReadWrite.All
            "b528084d-ad10-4598-8b93-929746b4d7d6", # People.Read.All
            "0121dc95-1b9f-4aed-8bac-58c5ac466691"  # TeamMember.ReadWrite.All
        )
        # Get access token for Graph from signed-in user
        $accessToken = ConvertTo-SecureString -String (Get-AzAccessToken -Resource "https://graph.microsoft.com").Token -AsPlainText -Force
        # Get existing role assignments
        $params = @{
            Uri            = "https://graph.microsoft.com/v1.0/servicePrincipals/$PrincipalId/appRoleAssignments"
            Authentication = "Bearer"
            Token          = $accessToken
            Method         = "GET"
            ContentType    = "application/json" 
        }
        $existingRoles = Invoke-RestMethod @Params
        # Add each role (if required)
        foreach ($roleId in $roleIds) {
            if ($existingRoles.value.appRoleId -notcontains $roleId) {
                $params = @{
                    Uri            = "https://graph.microsoft.com/v1.0/servicePrincipals/$graphResourceId/appRoleAssignedTo"
                    Authentication = "Bearer"
                    Token          = $accessToken
                    Method         = "POST"
                    ContentType    = "application/json"
                    Body           = @{
                        principalId = $PrincipalId
                        resourceId  = $graphResourceId
                        appRoleId   = $roleId
                    } | ConvertTo-Json
                }
                Invoke-RestMethod @Params | Out-Null
            }
        }
        Write-Host "SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Role assignment failed: $($_)"
    }
}