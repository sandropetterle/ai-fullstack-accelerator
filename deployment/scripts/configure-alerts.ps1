# Configure Application Insights Alerts
# Creates 4 critical production alerts for the accelerator.
# Prerequisites: Azure CLI installed and authenticated (az login)

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = '',

    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = '',

    [Parameter(Mandatory=$false)]
    [string]$AppInsightsName = '',

    [Parameter(Mandatory=$false)]
    [string]$ActionGroupEmail = 'devops@example.com'
)

if (-not $ProjectName -and -not $AppInsightsName) {
    Write-Host "ERROR: Provide -ProjectName or -AppInsightsName" -ForegroundColor Red
    exit 1
}

if (-not $ResourceGroup -and $ProjectName) { $ResourceGroup = "rg-$ProjectName-prod" }
if (-not $AppInsightsName -and $ProjectName) { $AppInsightsName = "appi-$ProjectName-prod" }

Write-Host "Configuring Application Insights Alerts..." -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Gray
Write-Host "App Insights  : $AppInsightsName" -ForegroundColor Gray
Write-Host ""

$appInsightsId = az monitor app-insights component show `
    --app $AppInsightsName `
    --resource-group $ResourceGroup `
    --query 'id' `
    --output tsv

if (-not $appInsightsId) {
    Write-Host "ERROR: Application Insights resource not found: $AppInsightsName in $ResourceGroup" -ForegroundColor Red
    exit 1
}

Write-Host "Found Application Insights: $appInsightsId" -ForegroundColor Green
Write-Host ""

# Create Action Group
$actionGroupName = "ag-$ProjectName-alerts"

$existingActionGroup = az monitor action-group show `
    --name $actionGroupName `
    --resource-group $ResourceGroup `
    2>$null

if ($existingActionGroup) {
    Write-Host "Action Group already exists: $actionGroupName" -ForegroundColor Yellow
} else {
    az monitor action-group create `
        --name $actionGroupName `
        --resource-group $ResourceGroup `
        --short-name ($ProjectName.Substring(0, [Math]::Min(12, $ProjectName.Length)).ToUpper()) `
        --email-receiver devops $ActionGroupEmail true

    Write-Host "Created Action Group: $actionGroupName" -ForegroundColor Green
}

$actionGroupId = az monitor action-group show `
    --name $actionGroupName `
    --resource-group $ResourceGroup `
    --query 'id' `
    --output tsv

function New-MetricAlert {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Condition,
        [int]$Severity,
        [int]$WindowSize,
        [int]$Frequency
    )

    Write-Host "Creating alert: $Name..." -ForegroundColor Yellow

    $existingAlert = az monitor metrics alert show `
        --name $Name `
        --resource-group $ResourceGroup `
        2>$null

    if ($existingAlert) {
        az monitor metrics alert update `
            --name $Name `
            --resource-group $ResourceGroup `
            --description $Description `
            --severity $Severity `
            --action $actionGroupId `
            --enabled true
    } else {
        az monitor metrics alert create `
            --name $Name `
            --resource-group $ResourceGroup `
            --scopes $appInsightsId `
            --description $Description `
            --condition $Condition `
            --window-size "${WindowSize}m" `
            --evaluation-frequency "${Frequency}m" `
            --severity $Severity `
            --action $actionGroupId
    }

    Write-Host "  Alert configured: $Name" -ForegroundColor Green
}

New-MetricAlert `
    -Name "alert-$ProjectName-high-error-rate" `
    -Description "Alert when failed request rate exceeds threshold over 5 minutes" `
    -Condition "avg requests/failed > 5" `
    -Severity 2 `
    -WindowSize 5 `
    -Frequency 5

New-MetricAlert `
    -Name "alert-$ProjectName-slow-response" `
    -Description "Alert when P95 response time exceeds 2 seconds over 10 minutes" `
    -Condition "avg requests/duration > 2000" `
    -Severity 3 `
    -WindowSize 10 `
    -Frequency 5

New-MetricAlert `
    -Name "alert-$ProjectName-availability-drop" `
    -Description "Alert when availability drops below 99% over 5 minutes" `
    -Condition "avg availabilityResults/availabilityPercentage < 99" `
    -Severity 1 `
    -WindowSize 5 `
    -Frequency 5

New-MetricAlert `
    -Name "alert-$ProjectName-exception-spike" `
    -Description "Alert when exception count exceeds threshold over 5 minutes" `
    -Condition "count exceptions/count > 10" `
    -Severity 2 `
    -WindowSize 5 `
    -Frequency 5

Write-Host ""
Write-Host "All alerts configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Email notifications will be sent to: $ActionGroupEmail" -ForegroundColor Cyan
Write-Host "Update the email in the Action Group if needed." -ForegroundColor Gray
