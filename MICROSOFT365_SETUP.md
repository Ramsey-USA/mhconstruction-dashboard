# Microsoft 365 Integration Setup Guide

This guide will help you set up Microsoft 365 integration for the Construction Dashboard, enabling OneDrive backups and Outlook email integration.

## Prerequisites

1. **Microsoft 365 Business Account**: You need a Microsoft 365 business account with administrative privileges
2. **Azure Active Directory**: Access to Azure Active Directory (comes with Microsoft 365)
3. **Application Registration**: You'll need to register the dashboard as an application in Azure

## Step 1: Register Application in Azure

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the following:
   - **Name**: `Construction Dashboard` (or your preferred name)
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank for now
5. Click **Register**

## Step 2: Configure API Permissions

1. In your new app registration, go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Application permissions**
5. Add the following permissions:
   - `Files.ReadWrite.All` (for OneDrive access)
   - `Mail.Send` (for sending emails via Outlook)
   - `Calendars.ReadWrite` (for calendar integration)
   - `User.Read.All` (for user information)
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin privileges)

## Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description: `Construction Dashboard Secret`
4. Choose expiration (recommend 24 months)
5. Click **Add**
6. **IMPORTANT**: Copy the secret value immediately - you won't be able to see it again

## Step 4: Configure Environment Variables

Create a `.env` file in your dashboard root directory with the following variables:

```env
# Microsoft 365 Configuration
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here
AZURE_TENANT_ID=your-tenant-id-here

# Microsoft 365 Features
MICROSOFT365_ENABLED=true
ONEDRIVE_ENABLED=true
OUTLOOK_ENABLED=true
AUTO_BACKUP_ENABLED=true
BACKUP_INTERVAL_HOURS=24
ONEDRIVE_FOLDER_NAME=Construction Dashboard
```

### Finding Your IDs:

- **Client ID**: Found on the app registration overview page
- **Tenant ID**: Found on the app registration overview page
- **Client Secret**: The value you copied in Step 3

## Step 5: Restart the Server

After configuring the environment variables:

```bash
node server.js
```

You should see:
```
🔧 Initializing Microsoft 365 integration...
✅ Microsoft 365 integration enabled
🚀 Construction Dashboard Server running on port 3000
```

## Step 6: Test the Integration

1. Open the dashboard at `http://localhost:3000`
2. Go to the **Microsoft 365** tab
3. Click **Test Connection** - should show "Connected"
4. Try the **Backup to OneDrive** feature
5. Test sending emails through Outlook integration

## Features Enabled

Once configured, you'll have access to:

### 📁 OneDrive Integration
- **Automatic Backups**: Daily backups of all dashboard data
- **Manual Backups**: On-demand backup via the dashboard
- **Organized Storage**: Files stored in a dedicated folder

### 📧 Outlook Integration
- **Direct Email Sending**: Send emails through your Outlook account
- **Professional Integration**: Emails appear in your Sent Items
- **Template Support**: Use dashboard email templates

### 📅 Calendar Integration (Future)
- **Automatic Events**: Create calendar events for project milestones
- **Meeting Scheduling**: Schedule stakeholder meetings
- **Deadline Tracking**: Calendar reminders for project deadlines

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Check your Client ID, Secret, and Tenant ID
   - Ensure admin consent was granted for API permissions

2. **"Insufficient privileges"**
   - Verify all required API permissions are added and consented
   - Check that you have admin rights in your organization

3. **"OneDrive access denied"**
   - Ensure `Files.ReadWrite.All` permission is granted
   - Check that OneDrive for Business is enabled for your account

4. **"Email sending failed"**
   - Verify `Mail.Send` permission is granted
   - Check that your account has an Exchange Online license

### Getting Help:

- Check the browser console for detailed error messages
- Review the server logs for authentication issues
- Ensure your Microsoft 365 subscription includes the required services

## Security Notes

- **Store credentials securely**: Never commit the `.env` file to version control
- **Regular secret rotation**: Update client secrets before they expire
- **Monitor access**: Regularly review app permissions and usage
- **Backup strategy**: The OneDrive integration is a backup, not a replacement for local data

## Next Steps

Once the integration is working:

1. **Configure automatic backups** to run at your preferred schedule
2. **Set up email templates** for common communications
3. **Train your team** on the new Outlook integration features
4. **Monitor usage** through the Microsoft 365 admin center

For additional support, refer to the [Microsoft Graph documentation](https://docs.microsoft.com/en-us/graph/) or contact your IT administrator.
