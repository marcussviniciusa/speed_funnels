# Meta Ads Integration Guide

This document provides instructions for integrating the Speed Funnels platform with Meta Ads (Facebook Ads).

## Integration Methods

Speed Funnels offers two methods to connect with Meta Ads:

1. **OAuth Flow** - Standard authorization flow that redirects users to Meta for authentication
2. **Direct Token Connection** - Connect using a pre-obtained access token

## OAuth Flow Integration

The OAuth flow is the recommended method for most users:

1. Navigate to the Integrations page in Speed Funnels
2. Select the "Integrations OAuth" tab
3. Click "Connect" next to Meta Ads
4. You will be redirected to Meta to authorize the application
5. After authorization, you will be redirected back to Speed Funnels

## Direct Token Connection

For advanced users or when OAuth flow is not suitable, you can connect directly with an access token:

1. Navigate to the Integrations page in Speed Funnels
2. Select the "Conexão Direta" tab
3. Enter your Meta Ads access token
4. Click "Connect"

### Obtaining a Meta Ads Access Token

To obtain a long-lived access token for Meta Ads:

1. Create a Meta for Developers account at [developers.facebook.com](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the "Marketing API" product to your app
4. Generate a user access token with the following permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `public_profile`
5. Use the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to verify the token
6. Convert to a long-lived token using the [Token Extension Tool](https://developers.facebook.com/tools/accesstoken/)

## API Reference

### Connect with Token

```
POST /api/integrations/meta/connect/:companyId
```

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

## Testing the Integration

After connecting, you can test the integration by:

1. Navigating to the Reports page
2. Selecting a Meta Ads account
3. Viewing the available metrics and reports

## Troubleshooting

Common issues and solutions:

### Token Invalid or Expired

If you receive an "Invalid Token" error:
- Verify the token is valid using the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- Generate a new token if expired
- Ensure the token has the required permissions

### Permission Issues

If you receive a "Permission Denied" error:
- Ensure your Meta Ads account has the necessary permissions
- Verify the token has all required permissions (`ads_management`, `ads_read`, etc.)
- Check if the user associated with the token has admin access to the ad account

### Connection Issues

If you're unable to connect:
- Check your network connection
- Verify the Speed Funnels server is running
- Ensure the Meta Marketing API is available (check [Meta Platform Status](https://developers.facebook.com/status/dashboard/))

## Support

For additional support, contact our team at support@speedfunnels.com or open an issue in our support portal.
