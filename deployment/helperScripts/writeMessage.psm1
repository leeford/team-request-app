function Write-Message {
    param (
        [Parameter(Mandatory = $true)][string]$Message,
        [Parameter(Mandatory = $false)][switch]$NoNewLine
    )

    $fullMessage = "[$(Get-Date -UFormat '+%Y-%m-%dT%H:%M:%S')] $Message "

    if ($NoNewLine) {
        return Write-Host $fullMessage -NoNewline
    }
    else {
        return Write-Host $fullMessage
    }
}