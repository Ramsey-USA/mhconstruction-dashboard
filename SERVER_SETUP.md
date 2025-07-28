# 🏗️ Construction Dashboard - Server Setup Guide

## Overview
Your construction dashboard now uses server-side storage instead of browser localStorage. All data is stored on your company's server in JSON files (easily upgradeable to a database later).

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Node.js Dependencies
```bash
cd /path/to/your/dashboard
npm install
```

### Step 2: Start the Server
```bash
# For production
npm start

# For development (auto-restarts on changes)
npm run dev
```

### Step 3: Access Your Dashboard
- **Dashboard URL**: `http://localhost:3000`
- **API URL**: `http://localhost:3000/api/`
- **Health Check**: `http://localhost:3000/api/health`

## 📁 Data Storage

### File-Based Storage
Your data is stored in JSON files under the `data/` folder:
```
data/
├── projects.json          # Project information
├── communications.json    # RFIs, submittals, etc.
├── prospects.json         # Business development pipeline
├── stakeholders.json      # Contact database
├── email-recipients.json  # Email configuration
└── settings.json          # App settings
```

### Server Features
✅ **RESTful API** - Standard HTTP endpoints  
✅ **Automatic Backup** - JSON file storage  
✅ **Sample Data** - Loads automatically on first run  
✅ **Error Handling** - Graceful fallbacks  
✅ **CORS Support** - Works with any domain  
✅ **Health Monitoring** - Server status endpoint  

## 🔧 Production Deployment

### Option 1: Local Company Server
```bash
# Clone to your server
git clone <your-repo> /opt/construction-dashboard
cd /opt/construction-dashboard

# Install dependencies
npm install --production

# Set production port
export PORT=80

# Start with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name "construction-dashboard"
pm2 startup
pm2 save
```

### Option 2: Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t construction-dashboard .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data construction-dashboard
```

### Option 3: Cloud Deployment
The dashboard works on any cloud platform:
- **AWS EC2** - Standard Node.js deployment
- **Google Cloud Run** - Containerized deployment
- **Azure App Service** - Direct deployment
- **DigitalOcean** - Droplet with Node.js

## 🔒 Security & Backup

### Data Security
- All data stays on your server
- No external dependencies for data storage
- Full control over access and permissions
- Can be placed behind company firewall

### Backup Strategy
```bash
# Manual backup
tar -czf dashboard-backup-$(date +%Y%m%d).tar.gz data/

# Automated daily backup (add to crontab)
0 2 * * * cd /opt/construction-dashboard && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz data/
```

### Access Control
Add authentication by modifying `server.js`:
```javascript
// Example: Basic authentication middleware
app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !checkCredentials(auth)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
});
```

## 📊 API Endpoints

### Data Operations
```
GET    /api/projects           # Get all projects
POST   /api/projects           # Add new project
PUT    /api/projects/:id       # Update project
DELETE /api/projects/:id       # Delete project

GET    /api/communications     # Get all communications
POST   /api/communications     # Add new communication
PUT    /api/communications/:id # Update communication
DELETE /api/communications/:id # Delete communication

# Similar endpoints for prospects, stakeholders, emailRecipients
```

### Special Endpoints
```
GET    /api/settings           # Get settings
PUT    /api/settings           # Update settings

GET    /api/dashboard/stats    # Get dashboard statistics
GET    /api/backup             # Download full backup
POST   /api/restore            # Restore from backup

GET    /api/health             # Server health check
```

## 🔄 Database Migration (Future)

When ready to upgrade from JSON files to a database:

### SQLite (Simple)
```bash
npm install sqlite3
# Modify server.js to use SQLite instead of JSON files
```

### PostgreSQL (Enterprise)
```bash
npm install pg
# Modify server.js to use PostgreSQL
```

### Migration Script
```javascript
// migrate-to-db.js
const fs = require('fs');
const db = require('./db-connection');

async function migrate() {
    const projects = JSON.parse(fs.readFileSync('data/projects.json'));
    for (const project of projects) {
        await db.query('INSERT INTO projects VALUES (?)', [project]);
    }
    // Repeat for other data types
}
```

## 🛠️ Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Check what's using port 3000
lsof -i :3000

# Use different port
PORT=3001 npm start
```

**Permission Errors**
```bash
# Fix data directory permissions
chmod 755 data/
chmod 644 data/*.json
```

**Server Won't Start**
```bash
# Check Node.js version (needs 14+)
node --version

# Check for syntax errors
node -c server.js

# View detailed error logs
npm start 2>&1 | tee server.log
```

## 📈 Performance Optimization

### For Large Datasets
- Add database indexing
- Implement pagination
- Use caching layers
- Optimize API queries

### For Multiple Users
- Add user authentication
- Implement role-based access
- Add real-time updates with WebSockets
- Scale with load balancers

## 🔧 Customization

### Add New Data Types
1. Add storage file in `dataFiles` object
2. Create API endpoints following the pattern
3. Update client-side data manager
4. Add UI components

### Modify Data Structure
1. Update sample data in `server.js`
2. Modify client-side forms
3. Update API validation
4. Migrate existing data if needed

## 💡 Next Steps

1. **Test the Setup**: Verify everything works locally
2. **Deploy to Server**: Move to your company server
3. **Set Up Backups**: Implement automated backups
4. **Add Security**: Configure authentication if needed
5. **Monitor Usage**: Set up logging and monitoring
6. **Plan Database Migration**: When data grows large

---

## Support

For issues or questions:
1. Check server logs: `tail -f server.log`
2. Test API health: `curl http://localhost:3000/api/health`
3. Verify data files: `ls -la data/`
4. Check Node.js version: `node --version`

Your construction dashboard is now enterprise-ready! 🚀
