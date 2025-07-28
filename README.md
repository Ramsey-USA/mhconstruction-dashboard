# mhconstruction-dashboard
Construction Project Management Dashboard
# Construction Project Management Dashboard

A comprehensive, client-side construction project management dashboard designed for project engineers to track multiple projects, communications, prospects, and stakeholders. Built with HTML, CSS, and JavaScript for easy deployment on GitHub Pages.

## 🎯 Purpose

This dashboard is specifically designed for project engineers who need to:
- Track multiple construction projects simultaneously
- Manage RFIs, submittals, change orders, and lien releases
- Coordinate with project managers, superintendents, and stakeholders
- Assist estimators with prospect management
- Generate daily status emails for team members
- Export comprehensive Excel reports
- Stay ahead of deadlines and critical issues

## ✨ Features

### 📊 Dashboard Overview
- Real-time project health metrics
- Critical alerts for overdue items
- Upcoming deadlines calendar
- Recent activity tracking
- Portfolio-wide visibility

### 🏗️ Project Management
- Multi-project tracking with health scores
- Project manager and superintendent assignments
- Budget and schedule monitoring
- Status tracking and reporting

### 💬 Communications Tracking
- **RFIs (Requests for Information)** - Track architect/engineer responses
- **Submittals** - Monitor approval workflows and deadlines
- **Change Orders** - Manage scope changes and approvals
- **Lien Releases** - Track conditional and unconditional releases
- **General Communications** - Capture all project-related discussions

### 🤝 Prospect Management
- Business development pipeline tracking
- Estimator collaboration tools
- Proposal deadline management
- Win probability assessments
- Client relationship tracking

### 👥 Stakeholder Management
- Contact database with roles and responsibilities
- Email and phone contact information
- Project assignment tracking
- Communication preferences

### 📧 Daily Status Emails
- Automated email generation at 5:00 PM
- Personalized content for each recipient
- Urgent items and deadline alerts
- Project health summaries
- Action item generation
- Outlook integration for easy sending

### 📈 Excel Export Capabilities
- Comprehensive project reports
- Communication status tracking
- Prospect pipeline analysis
- Stakeholder contact lists
- Dashboard summary statistics
- Custom date range filtering

## 🚀 Quick Start

### Option 1: GitHub Pages Deployment (Recommended)

1. **Fork or Download** this repository
2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"
3. **Access your dashboard** at `https://yourusername.github.io/construction-dashboard`

### Option 2: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/construction-dashboard.git
   cd construction-dashboard
   ```

2. **Open in browser**:
   - Simply open `index.html` in your web browser
   - Or use a local server: `python -m http.server 8000`

## 📱 Usage Guide

### Initial Setup

1. **Add Stakeholders**: Start by adding your team members (PMs, superintendents, estimators, etc.)
2. **Create Projects**: Add your active construction projects with assigned team members
3. **Configure Email Recipients**: Set up who receives daily status emails
4. **Customize Settings**: Adjust email signature and sending preferences

### Daily Workflow

1. **Morning Review**: Check dashboard for critical alerts and today's deadlines
2. **Communication Tracking**: Add RFIs, submittals, and other communications as they occur
3. **Status Updates**: Mark items as completed when resolved
4. **Evening Reports**: Generate and send daily status emails at 5:00 PM

### Weekly Tasks

1. **Prospect Management**: Update proposal statuses and add new opportunities
2. **Excel Reports**: Export comprehensive reports for management review
3. **Data Cleanup**: Review and update project statuses and stakeholder information

## 🔧 Technical Details

### Architecture
- **Frontend Only**: Pure HTML, CSS, and JavaScript - no server required
- **Local Storage**: All data stored in browser's local storage
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern Browser Support**: Chrome, Firefox, Safari, Edge

### Data Storage
- All data is stored locally in your browser
- No external databases or servers required
- Data persists between sessions
- Export/import functionality for backup and migration

### Security & Privacy
- All data remains on your local device
- No external data transmission (except email generation)
- No user accounts or authentication required
- Complete control over your project data

## 📊 Excel Export Features

The dashboard generates comprehensive Excel reports with multiple worksheets:

### Projects Sheet
- Project details and status
- Team assignments
- Budget and schedule information
- Health scores and metrics
- Communication summaries

### Communications Sheet
- All RFIs, submittals, change orders, and lien releases
- Status tracking and deadline monitoring
- Stakeholder assignments
- Priority and urgency indicators
- Aging analysis

### Prospects Sheet
- Business development pipeline
- Proposal deadlines and win probabilities
- Estimator assignments
- Weighted value calculations
- Pipeline analysis

### Stakeholders Sheet
- Complete contact database
- Role and responsibility tracking
- Communication statistics
- Project assignments

### Dashboard Summary
- Portfolio health metrics
- Key performance indicators
- Communication type breakdowns
- Executive summary statistics

## 📧 Email System

### Daily Status Emails
- **Automated Generation**: Creates personalized emails for each recipient
- **Smart Content**: Includes urgent items, upcoming deadlines, and completed tasks
- **Action Items**: Generates specific action items based on project status
- **Project Health**: Visual health indicators for each project
- **Outlook Integration**: Opens pre-written emails in Outlook for easy sending

### Email Content Includes:
- 🔴 **Urgent Items**: Overdue communications requiring immediate attention
- 🟡 **Due This Week**: Upcoming deadlines and important dates
- 🟢 **Completed Today**: Accomplishments and resolved items
- 📋 **Action Items**: Specific tasks and follow-ups needed
- 📊 **Project Health**: Status summary for each project
- 🌤️ **Weather Info**: Relevant for outdoor construction activities

## 🎨 Customization

### Branding
- Update company name and logo in the header
- Modify color scheme in `css/styles.css`
- Customize email signatures and templates

### Functionality
- Add new communication types in the data model
- Modify project status options
- Extend stakeholder roles and categories
- Customize Excel export formats

## 🔄 Data Management

### Backup and Restore
- **Export Data**: Download complete backup as JSON file
- **Import Data**: Restore from backup file
- **Excel Export**: Generate reports for external use
- **Local Storage**: Automatic saving of all changes

### Data Migration
- Export data from one browser/device
- Import to another browser/device
- Maintain data consistency across platforms
- No vendor lock-in or proprietary formats

## 🛠️ Troubleshooting

### Common Issues

**Dashboard not loading properly**:
- Ensure JavaScript is enabled in your browser
- Check browser console for error messages
- Try refreshing the page or clearing browser cache

**Data not saving**:
- Verify local storage is enabled
- Check available storage space
- Ensure you're not in incognito/private browsing mode

**Excel export not working**:
- Ensure pop-ups are allowed for the site
- Check that downloads are enabled
- Try using a different browser

**Emails not opening in Outlook**:
- Verify Outlook is set as default email client
- Check browser settings for handling mailto links
- Use the clipboard copy fallback option

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Internet Explorer**: Not supported

## 📞 Support

### Getting Help
- Check the troubleshooting section above
- Review browser console for error messages
- Ensure you're using a supported browser
- Try the dashboard in incognito mode to rule out extensions

### Feature Requests
- This is a standalone application designed for GitHub Pages
- Modifications can be made by editing the source code
- Consider forking the repository for custom changes

## 📄 License

This project is open source and available under the MIT License. Feel free to modify and distribute according to your needs.

## 🙏 Acknowledgments

Built for construction project engineers who need powerful project oversight tools without the complexity of enterprise software. Designed to be simple, effective, and completely under your control.

---

**Ready to revolutionize your construction project management?** 🏗️

Deploy to GitHub Pages and start tracking your projects today!

