// Microsoft 365 Integration Service
// Handles OneDrive backup and Outlook email integration

const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const fs = require('fs-extra');
const path = require('path');

class Microsoft365Service {
    constructor() {
        this.msalConfig = {
            auth: {
                clientId: process.env.MICROSOFT_CLIENT_ID || 'your-client-id',
                clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'your-client-secret',
                authority: 'https://login.microsoftonline.com/' + (process.env.MICROSOFT_TENANT_ID || 'your-tenant-id')
            }
        };
        
        this.cca = new ConfidentialClientApplication(this.msalConfig);
        this.graphClient = null;
        this.isAuthenticated = false;
        
        // Configuration flags
        this.config = {
            oneDriveEnabled: process.env.ONEDRIVE_SYNC === 'true',
            outlookEnabled: process.env.OUTLOOK_INTEGRATION === 'true',
            autoBackupEnabled: process.env.AUTO_BACKUP === 'true',
            backupInterval: parseInt(process.env.BACKUP_INTERVAL_HOURS) || 24, // hours
            oneDriveFolderName: process.env.ONEDRIVE_FOLDER || 'Construction Dashboard'
        };
        
        this.init();
    }

    async init() {
        console.log('🔧 Initializing Microsoft 365 integration...');
        
        if (!this.config.oneDriveEnabled && !this.config.outlookEnabled) {
            console.log('ℹ️  Microsoft 365 integration disabled in environment variables');
            return;
        }
        
        if (!process.env.MICROSOFT_CLIENT_ID) {
            console.log('⚠️  Microsoft 365 credentials not configured. See MICROSOFT365_SETUP.md for setup instructions.');
            return;
        }
        
        try {
            await this.authenticate();
            if (this.config.autoBackupEnabled) {
                this.scheduleAutoBackup();
            }
            console.log('✅ Microsoft 365 integration initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Microsoft 365 integration:', error.message);
        }
    }

    async authenticate() {
        try {
            const clientCredentialRequest = {
                scopes: [
                    'https://graph.microsoft.com/.default'
                ]
            };

            const response = await this.cca.acquireTokenByClientCredential(clientCredentialRequest);
            
            this.graphClient = Client.init({
                authProvider: (done) => {
                    done(null, response.accessToken);
                }
            });
            
            this.isAuthenticated = true;
            console.log('✅ Authenticated with Microsoft Graph API');
            
        } catch (error) {
            console.error('❌ Microsoft 365 authentication failed:', error.message);
            throw error;
        }
    }

    // OneDrive Integration
    async backupToOneDrive(dataDir = './data') {
        if (!this.config.oneDriveEnabled || !this.isAuthenticated) {
            console.log('OneDrive backup skipped - not enabled or not authenticated');
            return false;
        }

        try {
            console.log('📁 Starting OneDrive backup...');
            
            // Create backup folder if it doesn't exist
            await this.ensureOneDriveFolder();
            
            // Create timestamped backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFolderName = `backup-${timestamp}`;
            
            await this.createOneDriveFolder(backupFolderName);
            
            // Upload each data file
            const dataFiles = await fs.readdir(dataDir);
            const uploadPromises = dataFiles
                .filter(file => file.endsWith('.json'))
                .map(file => this.uploadFileToOneDrive(
                    path.join(dataDir, file), 
                    `${this.config.oneDriveFolderName}/${backupFolderName}/${file}`
                ));
            
            await Promise.all(uploadPromises);
            
            // Create backup summary
            const summary = {
                timestamp: new Date().toISOString(),
                files: dataFiles.filter(f => f.endsWith('.json')),
                totalFiles: dataFiles.filter(f => f.endsWith('.json')).length,
                backupPath: `${this.config.oneDriveFolderName}/${backupFolderName}`
            };
            
            await this.uploadJsonToOneDrive(
                summary, 
                `${this.config.oneDriveFolderName}/${backupFolderName}/backup-summary.json`
            );
            
            console.log(`✅ Successfully backed up ${summary.totalFiles} files to OneDrive`);
            return summary;
            
        } catch (error) {
            console.error('❌ OneDrive backup failed:', error.message);
            return false;
        }
    }

    async ensureOneDriveFolder() {
        try {
            // Check if folder exists
            await this.graphClient
                .api(`/me/drive/root:/${this.config.oneDriveFolderName}`)
                .get();
        } catch (error) {
            if (error.code === 'itemNotFound') {
                // Create folder
                await this.graphClient
                    .api('/me/drive/root/children')
                    .post({
                        name: this.config.oneDriveFolderName,
                        folder: {},
                        '@microsoft.graph.conflictBehavior': 'rename'
                    });
                console.log(`📁 Created OneDrive folder: ${this.config.oneDriveFolderName}`);
            } else {
                throw error;
            }
        }
    }

    async createOneDriveFolder(folderName) {
        await this.graphClient
            .api(`/me/drive/root:/${this.config.oneDriveFolderName}:/children`)
            .post({
                name: folderName,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename'
            });
    }

    async uploadFileToOneDrive(localFilePath, oneDrivePath) {
        const fileContent = await fs.readFile(localFilePath);
        
        await this.graphClient
            .api(`/me/drive/root:/${oneDrivePath}:/content`)
            .put(fileContent);
        
        console.log(`📤 Uploaded ${path.basename(localFilePath)} to OneDrive`);
    }

    async uploadJsonToOneDrive(jsonData, oneDrivePath) {
        const content = JSON.stringify(jsonData, null, 2);
        
        await this.graphClient
            .api(`/me/drive/root:/${oneDrivePath}:/content`)
            .put(Buffer.from(content));
    }

    async listOneDriveBackups() {
        if (!this.isAuthenticated) return [];
        
        try {
            const response = await this.graphClient
                .api(`/me/drive/root:/${this.config.oneDriveFolderName}:/children`)
                .get();
            
            return response.value
                .filter(item => item.folder && item.name.startsWith('backup-'))
                .map(backup => ({
                    name: backup.name,
                    created: backup.createdDateTime,
                    modified: backup.lastModifiedDateTime,
                    webUrl: backup.webUrl
                }))
                .sort((a, b) => new Date(b.created) - new Date(a.created));
                
        } catch (error) {
            console.error('Error listing OneDrive backups:', error.message);
            return [];
        }
    }

    // Outlook Integration
    async sendEmailViaOutlook(emailData) {
        if (!this.config.outlookEnabled || !this.isAuthenticated) {
            console.log('Outlook integration not enabled or not authenticated');
            return false;
        }

        try {
            const message = {
                subject: emailData.subject,
                body: {
                    contentType: 'HTML',
                    content: this.formatEmailForOutlook(emailData.content)
                },
                toRecipients: emailData.recipients.map(email => ({
                    emailAddress: {
                        address: email,
                        name: emailData.recipientNames?.[email] || email
                    }
                })),
                importance: emailData.priority === 'Critical' ? 'high' : 
                           emailData.priority === 'High' ? 'high' : 'normal'
            };

            if (emailData.attachments) {
                message.attachments = emailData.attachments.map(att => ({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: att.name,
                    contentBytes: att.content,
                    contentType: att.contentType || 'application/octet-stream'
                }));
            }

            await this.graphClient
                .api('/me/sendMail')
                .post({ message });

            console.log(`📧 Email sent via Outlook to ${emailData.recipients.length} recipients`);
            return true;

        } catch (error) {
            console.error('❌ Failed to send email via Outlook:', error.message);
            return false;
        }
    }

    formatEmailForOutlook(plainTextContent) {
        // Convert plain text to HTML with proper formatting
        return plainTextContent
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/🔴/g, '<span style="color: red; font-weight: bold;">🔴</span>')
            .replace(/🟡/g, '<span style="color: orange; font-weight: bold;">🟡</span>')
            .replace(/🟢/g, '<span style="color: green; font-weight: bold;">🟢</span>')
            .replace(/📋/g, '<span style="color: blue;">📋</span>')
            .replace(/📊/g, '<span style="color: purple;">📊</span>');
    }

    async createOutlookCalendarEvent(eventData) {
        if (!this.config.outlookEnabled || !this.isAuthenticated) return false;

        try {
            const event = {
                subject: eventData.subject,
                body: {
                    contentType: 'HTML',
                    content: eventData.description || ''
                },
                start: {
                    dateTime: eventData.startTime,
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: eventData.endTime,
                    timeZone: 'UTC'
                },
                location: {
                    displayName: eventData.location || ''
                },
                attendees: (eventData.attendees || []).map(email => ({
                    emailAddress: {
                        address: email,
                        name: email
                    }
                })),
                reminderMinutesBeforeStart: eventData.reminderMinutes || 15
            };

            const createdEvent = await this.graphClient
                .api('/me/events')
                .post(event);

            console.log(`📅 Calendar event created: ${eventData.subject}`);
            return createdEvent;

        } catch (error) {
            console.error('❌ Failed to create calendar event:', error.message);
            return false;
        }
    }

    // Automated backup scheduling
    scheduleAutoBackup() {
        const intervalMs = this.config.backupInterval * 60 * 60 * 1000; // Convert hours to milliseconds
        
        console.log(`⏰ Scheduling automatic OneDrive backup every ${this.config.backupInterval} hours`);
        
        setInterval(async () => {
            console.log('🔄 Running scheduled OneDrive backup...');
            await this.backupToOneDrive();
        }, intervalMs);
        
        // Run initial backup after 5 minutes
        setTimeout(async () => {
            console.log('🔄 Running initial OneDrive backup...');
            await this.backupToOneDrive();
        }, 5 * 60 * 1000);
    }

    // Utility methods
    async testConnection() {
        if (!this.isAuthenticated) {
            await this.authenticate();
        }

        try {
            const user = await this.graphClient.api('/me').get();
            console.log(`✅ Connected to Microsoft 365 as: ${user.displayName} (${user.mail})`);
            
            return {
                success: true,
                user: {
                    name: user.displayName,
                    email: user.mail,
                    organization: user.companyName
                },
                services: {
                    oneDrive: this.config.oneDriveEnabled,
                    outlook: this.config.outlookEnabled,
                    autoBackup: this.config.autoBackupEnabled
                }
            };
        } catch (error) {
            console.error('❌ Microsoft 365 connection test failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getConfiguration() {
        return {
            isEnabled: this.config.oneDriveEnabled || this.config.outlookEnabled,
            isAuthenticated: this.isAuthenticated,
            oneDriveEnabled: this.config.oneDriveEnabled,
            outlookEnabled: this.config.outlookEnabled,
            autoBackupEnabled: this.config.autoBackupEnabled,
            backupInterval: this.config.backupInterval,
            oneDriveFolder: this.config.oneDriveFolderName
        };
    }
}

module.exports = Microsoft365Service;
