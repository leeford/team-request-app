function Add-IPRules {
    param (
        [Parameter(mandatory = $true)][string]$WebAppOutboundIPAddresses,
        [Parameter(mandatory = $true)][string]$KeyVaultName,
        [Parameter(mandatory = $true)][string]$CosmosDbAccountName,
        [Parameter(mandatory = $true)][string]$ResourceGroup
    )
    Import-Module -Name "$PSScriptRoot/writeMessage.psm1"
    
    # Separate Web App IP string in to array
    $webAppIps = $webAppOutboundIPAddresses.Split(",")

    # Add IPs to Key Vault
    try {
        Write-Message "Adding Web App IP Addresses to Key Vault ACL/Firewall..." -NoNewLine
        $webAppIps | ForEach-Object {
            # Add a /32 to each IP
            $ip = "$_/32"
            # Remove IP if it already exists (it will duplicate otherwise)
            Remove-AzKeyVaultNetworkRule -VaultName $keyVaultName -IpAddressRange $ip
            # Add IP
            Add-AzKeyVaultNetworkRule -VaultName $keyVaultName -IpAddressRange $ip
        }   
        # Enable Key Vault ACL
        Update-AzKeyVaultNetworkRuleSet -VaultName $keyVaultName -Bypass None -DefaultAction Deny
        Write-Host "SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Key Vault ACL configuration failed: $($_)"
    }

    # Add IPs to Cosmos DB ACL
    try {
        Write-Message "Adding Web App IP Addresses to CosmosDB ACL/Firewall (this may take some time)..." -NoNewLine
        Update-AzCosmosDBAccount -ResourceGroupName $resourceGroup -Name $cosmosDbAccountName -IpRule $webAppIps -WarningAction SilentlyContinue | Out-Null
        Write-Host "SUCCESS" -ForegroundColor Green
    }
    catch {
        Write-Host "FAILED" -ForegroundColor Red
        Throw "Cosmos ACL configuration failed: $($_)"
    }
}