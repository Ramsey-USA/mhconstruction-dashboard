const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const Microsoft365Service = require('./js/microsoft365-service');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Initialize Microsoft 365 service
const microsoft365 = new Microsoft365Service();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (the dashboard)
app.use(express.static('.', {
    index: 'index.html'
}));

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Data file paths
const dataFiles = {
    projects: path.join(DATA_DIR, 'projects.json'),
    communications: path.join(DATA_DIR, 'communications.json'),
    prospects: path.join(DATA_DIR, 'prospects.json'),
    stakeholders: path.join(DATA_DIR, 'stakeholders.json'),
    emailRecipients: path.join(DATA_DIR, 'email-recipients.json'),
    settings: path.join(DATA_DIR, 'settings.json')
};

// Helper functions
const readDataFile = async (filePath) => {
    try {
        if (await fs.pathExists(filePath)) {
            const data = await fs.readJson(filePath);
            return data;
        }
        return [];
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

const writeDataFile = async (filePath, data) => {
    try {
        await fs.writeJson(filePath, data, { spaces: 2 });
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize with sample data if files don't exist
const initializeSampleData = async () => {
    const projectsExist = await fs.pathExists(dataFiles.projects);
    
    if (!projectsExist) {
        console.log('Initializing with sample data...');
        
        // Sample stakeholders
        const sampleStakeholders = [
            {
                id: 'stake_1',
                name: 'John Smith',
                role: 'Project Manager',
                company: 'Your Construction Company',
                email: 'john.smith@yourcompany.com',
                phone: '(555) 123-4567',
                receivesEmails: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stake_2',
                name: 'Mike Johnson',
                role: 'Superintendent',
                company: 'Your Construction Company',
                email: 'mike.johnson@yourcompany.com',
                phone: '(555) 123-4568',
                receivesEmails: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stake_3',
                name: 'Sarah Wilson',
                role: 'Architect',
                company: 'Design Associates',
                email: 'sarah.wilson@designassoc.com',
                phone: '(555) 234-5678',
                receivesEmails: false,
                createdAt: new Date().toISOString()
            }
        ];

        // Sample projects
        const sampleProjects = [
            {
                id: 'proj_1',
                number: '2025-001',
                name: 'Alpha Office Building',
                client: 'Alpha Corp',
                projectManagerId: 'stake_1',
                superintendentId: 'stake_2',
                startDate: '2025-07-01',
                endDate: '2025-12-31',
                contractValue: 750000,
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];

        // Sample communications
        const sampleCommunications = [
            {
                id: 'comm_1',
                projectId: 'proj_1',
                stakeholderId: 'stake_3',
                type: 'RFI',
                subject: 'Electrical layout clarification',
                notes: 'Need clarification on electrical outlet placement in conference rooms',
                priority: 'Medium',
                dueDate: '2025-08-05',
                status: 'Pending',
                createdAt: new Date().toISOString()
            }
        ];

        // Sample prospects
        const sampleProspects = [
            {
                id: 'pros_1',
                name: 'Beta Warehouse Project',
                client: 'Beta Industries',
                estimatorId: 'stake_1',
                walkDate: '2025-08-15',
                proposalDueDate: '2025-08-30',
                estimatedValue: 950000,
                probability: 70,
                status: 'active',
                notes: 'Strong relationship with client, good chance of winning',
                createdAt: new Date().toISOString()
            }
        ];

        // Default settings
        const defaultSettings = {
            emailSignature: 'Best regards,\nProject Engineering Department\nYour Construction Company',
            sendTime: '17:00',
            autoSendEnabled: false,
            companyName: 'Your Construction Company',
            yourName: 'Project Engineer'
        };

        // Write sample data
        await writeDataFile(dataFiles.stakeholders, sampleStakeholders);
        await writeDataFile(dataFiles.projects, sampleProjects);
        await writeDataFile(dataFiles.communications, sampleCommunications);
        await writeDataFile(dataFiles.prospects, sampleProspects);
        await writeDataFile(dataFiles.emailRecipients, []);
        await writeDataFile(dataFiles.settings, defaultSettings);
        
        console.log('Sample data initialized successfully!');
    }
};

// API Routes

// Health check endpoint 
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        dataDir: DATA_DIR
    });
});

// Special route for settings (single object, not array)
app.get('/api/settings', async (req, res) => {
    try {
        const settings = await readDataFile(dataFiles.settings);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read settings' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        await writeDataFile(dataFiles.settings, settings);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const projects = await readDataFile(dataFiles.projects);
        const communications = await readDataFile(dataFiles.communications);
        
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const pendingItems = communications.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
        
        // Calculate overdue and due this week
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        let overdueItems = 0;
        let dueThisWeek = 0;
        
        communications.forEach(comm => {
            if (comm.dueDate) {
                const dueDate = new Date(comm.dueDate);
                if (dueDate < today) {
                    overdueItems++;
                } else if (dueDate <= nextWeek) {
                    dueThisWeek++;
                }
            }
        });
        
        res.json({
            activeProjects,
            pendingItems,
            overdueItems,
            dueThisWeek
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate stats' });
    }
});

// Backup and restore endpoints
app.get('/api/backup', async (req, res) => {
    try {
        const backup = {
            projects: await readDataFile(dataFiles.projects),
            communications: await readDataFile(dataFiles.communications),
            prospects: await readDataFile(dataFiles.prospects),
            stakeholders: await readDataFile(dataFiles.stakeholders),
            emailRecipients: await readDataFile(dataFiles.emailRecipients),
            settings: await readDataFile(dataFiles.settings),
            exportDate: new Date().toISOString()
        };
        
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-backup.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

app.post('/api/restore', async (req, res) => {
    try {
        const backup = req.body;
        
        if (backup.projects) await writeDataFile(dataFiles.projects, backup.projects);
        if (backup.communications) await writeDataFile(dataFiles.communications, backup.communications);
        if (backup.prospects) await writeDataFile(dataFiles.prospects, backup.prospects);
        if (backup.stakeholders) await writeDataFile(dataFiles.stakeholders, backup.stakeholders);
        if (backup.emailRecipients) await writeDataFile(dataFiles.emailRecipients, backup.emailRecipients);
        if (backup.settings) await writeDataFile(dataFiles.settings, backup.settings);
        
        res.json({ success: true, message: 'Data restored successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore data' });
    }
});

// GET all data for a specific type
app.get('/api/:dataType', async (req, res) => {
    const { dataType } = req.params;
    
    if (!dataFiles[dataType]) {
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    try {
        const data = await readDataFile(dataFiles[dataType]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST - Add new item
app.post('/api/:dataType', async (req, res) => {
    const { dataType } = req.params;
    const newItem = req.body;
    
    if (!dataFiles[dataType]) {
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    try {
        const data = await readDataFile(dataFiles[dataType]);
        
        // Add ID and timestamp if not present
        if (!newItem.id) {
            newItem.id = generateId();
        }
        if (!newItem.createdAt) {
            newItem.createdAt = new Date().toISOString();
        }
        
        data.push(newItem);
        await writeDataFile(dataFiles[dataType], data);
        
        res.json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// PUT - Update item
app.put('/api/:dataType/:id', async (req, res) => {
    const { dataType, id } = req.params;
    const updates = req.body;
    
    if (!dataFiles[dataType]) {
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    try {
        const data = await readDataFile(dataFiles[dataType]);
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
        await writeDataFile(dataFiles[dataType], data);
        
        res.json(data[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE - Delete item
app.delete('/api/:dataType/:id', async (req, res) => {
    const { dataType, id } = req.params;
    
    if (!dataFiles[dataType]) {
        return res.status(400).json({ error: 'Invalid data type' });
    }
    
    try {
        const data = await readDataFile(dataFiles[dataType]);
        const filteredData = data.filter(item => item.id !== id);
        
        if (data.length === filteredData.length) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        await writeDataFile(dataFiles[dataType], filteredData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Microsoft 365 Integration Endpoints

// Get Microsoft 365 configuration and status
app.get('/api/microsoft365/status', async (req, res) => {
    try {
        const config = microsoft365.getConfiguration();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get Microsoft 365 status' });
    }
});

// Test Microsoft 365 connection
app.post('/api/microsoft365/test', async (req, res) => {
    try {
        const result = await microsoft365.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to test Microsoft 365 connection' });
    }
});

// Backup to OneDrive
app.post('/api/microsoft365/backup', async (req, res) => {
    try {
        const result = await microsoft365.backupToOneDrive(DATA_DIR);
        if (result) {
            res.json({ success: true, backup: result });
        } else {
            res.status(400).json({ error: 'OneDrive backup failed or not configured' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to backup to OneDrive' });
    }
});

// List OneDrive backups
app.get('/api/microsoft365/backups', async (req, res) => {
    try {
        const backups = await microsoft365.listOneDriveBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list OneDrive backups' });
    }
});

// Send email via Outlook
app.post('/api/microsoft365/send-email', async (req, res) => {
    try {
        const result = await microsoft365.sendEmailViaOutlook(req.body);
        if (result) {
            res.json({ success: true, message: 'Email sent successfully' });
        } else {
            res.status(400).json({ error: 'Failed to send email via Outlook' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Create Outlook calendar event
app.post('/api/microsoft365/calendar-event', async (req, res) => {
    try {
        const result = await microsoft365.createOutlookCalendarEvent(req.body);
        if (result) {
            res.json({ success: true, event: result });
        } else {
            res.status(400).json({ error: 'Failed to create calendar event' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
});

// Initialize sample data and start server
initializeSampleData().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Construction Dashboard Server running on port ${PORT}`);
        console.log(`📂 Data stored in: ${DATA_DIR}`);
        console.log(`🌐 Dashboard available at: http://localhost:${PORT}`);
        console.log(`🔧 API available at: http://localhost:${PORT}/api/`);
    });
}).catch(error => {
    console.error('Failed to initialize server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});
