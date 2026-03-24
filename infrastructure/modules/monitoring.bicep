// monitoring.bicep — Application Insights + Log Analytics + 4 metric alerts
// No dependencies on other modules. Deploy first.

@description('Short project name used as a prefix in resource names')
param projectName string

@description('Azure region for all resources')
param location string

@description('Environment name suffix (e.g. prod)')
param environment string = 'prod'

@description('Email for alert notifications (empty = no notifications sent)')
param alertEmail string = ''

@description('Resource tags applied to all resources in this module')
param tags object

// ── Log Analytics Workspace ───────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${projectName}-${environment}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ── Application Insights ──────────────────────────────────────────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${projectName}-${environment}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    RetentionInDays: 30
  }
}

// ── Alert Action Group (conditional — only created when alertEmail is set) ────

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = if (!empty(alertEmail)) {
  name: 'ag-${projectName}-alerts-${environment}'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: take(toUpper(projectName), 12)
    enabled: true
    emailReceivers: [
      {
        name: 'DevOps'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

// ── Metric Alerts ─────────────────────────────────────────────────────────────

resource alertErrorRate 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-${projectName}-error-rate-${environment}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when server error rate exceeds 5%'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighErrorRate'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: empty(alertEmail) ? [] : [
      {
        actionGroupId: actionGroup.id
      }
    ]
    autoMitigate: true
  }
}

resource alertResponseTime 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-${projectName}-response-time-${environment}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when average response time exceeds 3 seconds'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'SlowResponseTime'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 3000
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: empty(alertEmail) ? [] : [
      {
        actionGroupId: actionGroup.id
      }
    ]
    autoMitigate: true
  }
}

resource alertAvailability 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-${projectName}-availability-${environment}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when availability drops below 95%'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'LowAvailability'
          metricName: 'availabilityResults/availabilityPercentage'
          operator: 'LessThan'
          threshold: 95
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: empty(alertEmail) ? [] : [
      {
        actionGroupId: actionGroup.id
      }
    ]
    autoMitigate: true
  }
}

resource alertExceptionSpike 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-${projectName}-exception-spike-${environment}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert on sharp increase in exception rate'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ExceptionSpike'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Count'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: empty(alertEmail) ? [] : [
      {
        actionGroupId: actionGroup.id
      }
    ]
    autoMitigate: true
  }
}

// ── Outputs ───────────────────────────────────────────────────────────────────

@description('Log Analytics workspace resource ID (for Container Apps Environment and SQL diagnostics)')
output logAnalyticsId string = logAnalytics.id

@description('Log Analytics workspace customer ID (for Container Apps Environment)')
output logAnalyticsCustomerId string = logAnalytics.properties.customerId

@description('Application Insights connection string (retained for operational reference)')
output appInsightsConnectionString string = appInsights.properties.ConnectionString
