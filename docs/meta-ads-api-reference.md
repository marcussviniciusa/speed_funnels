# Meta Ads API Reference

This document provides detailed information about the Meta Ads API integration in the Speed Funnels platform.

## API Endpoints

### Authentication and Connection

#### OAuth Authorization

```
GET /api/integrations/meta/auth/:companyId
```

Initiates the OAuth flow for Meta Ads integration.

**Parameters:**
- `companyId` - ID of the company to associate with the integration

**Response:**
```json
{
  "success": true,
  "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..."
}
```

#### OAuth Callback

```
GET /api/integrations/meta/callback
```

Callback endpoint for the OAuth flow. This is called by Meta after authorization.

**Query Parameters:**
- `code` - Authorization code from Meta
- `state` - State parameter for verification

**Response:**
Redirects to the application with success or error message.

#### Direct Token Connection

```
POST /api/integrations/meta/connect/:companyId
```

Connects directly to Meta Ads using a provided access token.

**Parameters:**
- `companyId` - ID of the company to associate with the integration

**Request Body:**
```json
{
  "accessToken": "YOUR_META_ADS_ACCESS_TOKEN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Meta Ads connected successfully",
  "data": {
    "integration": {
      "id": "integration_id",
      "platform": "meta",
      "status": "active",
      "accountId": "meta_account_id",
      "accountName": "Meta Ads Account Name"
    }
  }
}
```

### Ad Account Management

#### Get Ad Accounts

```
GET /api/metrics/meta/accounts
```

Retrieves all available ad accounts for the connected Meta Ads integration.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "act_123456789",
      "name": "My Ad Account",
      "currency": "USD",
      "timezone": "America/Los_Angeles"
    },
    {
      "id": "act_987654321",
      "name": "Another Ad Account",
      "currency": "BRL",
      "timezone": "America/Sao_Paulo"
    }
  ]
}
```

### Metrics and Reporting

#### Get Ad Account Metrics

```
GET /api/metrics/meta/:adAccountId
```

Retrieves metrics for a specific ad account.

**Parameters:**
- `adAccountId` - ID of the ad account (with or without the 'act_' prefix)

**Query Parameters:**
- `startDate` - Start date for metrics (YYYY-MM-DD)
- `endDate` - End date for metrics (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "act_123456789",
      "name": "My Ad Account"
    },
    "dateRange": {
      "startDate": "2023-01-01",
      "endDate": "2023-01-31"
    },
    "metrics": {
      "spend": 1234.56,
      "impressions": 100000,
      "clicks": 5000,
      "ctr": 5.0,
      "cpc": 0.25,
      "conversions": 200,
      "costPerConversion": 6.17
    },
    "campaigns": [
      {
        "id": "23848238482384",
        "name": "Campaign 1",
        "status": "ACTIVE",
        "spend": 500.25,
        "impressions": 40000,
        "clicks": 2000,
        "conversions": 80
      },
      {
        "id": "23848238482385",
        "name": "Campaign 2",
        "status": "ACTIVE",
        "spend": 734.31,
        "impressions": 60000,
        "clicks": 3000,
        "conversions": 120
      }
    ]
  }
}
```

### Integration Management

#### Disable Integration

```
PUT /api/integrations/:integrationId/disable
```

Disables an active integration.

**Parameters:**
- `integrationId` - ID of the integration to disable (use "meta" for Meta Ads)

**Response:**
```json
{
  "success": true,
  "message": "Integration disabled successfully"
}
```

## Error Responses

All API endpoints return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Common Error Codes

- `INVALID_TOKEN` - The provided access token is invalid or expired
- `PERMISSION_DENIED` - The token lacks required permissions
- `ACCOUNT_NOT_FOUND` - The specified ad account was not found
- `INTEGRATION_NOT_FOUND` - The specified integration was not found
- `INVALID_DATE_RANGE` - The provided date range is invalid
- `API_ERROR` - An error occurred when calling the Meta Ads API
- `SERVER_ERROR` - An internal server error occurred

## Rate Limits

The Speed Funnels API enforces rate limits to prevent abuse:

- 100 requests per minute per user
- 1000 requests per day per user

Meta Ads API has its own rate limits that may affect the responses from our API. For more information, see the [Meta Marketing API Rate Limiting documentation](https://developers.facebook.com/docs/marketing-api/overview/rate-limiting).

## Webhooks

Speed Funnels supports webhooks for real-time notifications about Meta Ads events. To configure webhooks, contact our support team.
