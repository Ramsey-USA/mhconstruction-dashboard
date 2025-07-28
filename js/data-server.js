// Server-based Data Management for Construction Dashboard
// Handles API calls to the server instead of localStorage

class ServerDataManager {
    constructor() {
        this.apiBase = '/api';
        this.cache = {}; // Client-side cache for better performance
        this.init();
    }

    async init() {
        try {
            // Test server connection
            const response = await fetch(`${this.apiBase}/health`);
            if (response.ok) {
                console.log('✅ Connected to server successfully');
                // Pre-populate cache
                await this.refreshCache();
            } else {
                console.error('❌ Server connection failed');
                this.showConnectionError();
            }
        } catch (error) {
            console.error('❌ Server connection error:', error);
            this.showConnectionError();
        }
    }

    showConnectionError() {
        // Show user-friendly error message
        const notification = document.getElementById('notification');
        if (notification) {
            const message = document.getElementById('notification-message');
            message.textContent = 'Cannot connect to server. Please check if the server is running.';
            notification.className = 'notification error';
            notification.style.display = 'block';
        }
    }

    async refreshCache() {
        try {
            const types = ['projects', 'communications', 'prospects', 'stakeholders', 'emailRecipients'];
            for (const type of types) {
                this.cache[type] = await this.fetchData(type);
            }
            this.cache.settings = await this.fetchSettings();
        } catch (error) {
            console.error('Error refreshing cache:', error);
        }
    }

    async fetchData(dataType) {
        try {
            const response = await fetch(`${this.apiBase}/${dataType}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${dataType}:`, error);
            return this.cache[dataType] || [];
        }
    }

    async fetchSettings() {
        try {
            const response = await fetch(`${this.apiBase}/settings`);
            if (response.ok) {
                return await response.json();
            }
            return this.getDefaultSettings();
        } catch (error) {
            console.error('Error fetching settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            emailSignature: 'Best regards,\nProject Engineering Department\nYour Construction Company',
            sendTime: '17:00',
            autoSendEnabled: false,
            companyName: 'Your Construction Company',
            yourName: 'Project Engineer'
        };
    }

    async saveData(dataType, method = 'POST', data = null, id = null) {
        try {
            const url = id ? `${this.apiBase}/${dataType}/${id}` : `${this.apiBase}/${dataType}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Update cache
            await this.refreshCache();
            return await response.json();
        } catch (error) {
            console.error(`Error saving ${dataType}:`, error);
            throw error;
        }
    }

    // Projects
    getProjects() {
        return this.cache.projects || [];
    }

    async addProject(project) {
        return await this.saveData('projects', 'POST', project);
    }

    async updateProject(id, updates) {
        return await this.saveData('projects', 'PUT', updates, id);
    }

    async deleteProject(id) {
        await this.saveData('projects', 'DELETE', null, id);
        // Also delete related communications
        const communications = this.getCommunications();
        const relatedComms = communications.filter(c => c.projectId === id);
        for (const comm of relatedComms) {
            await this.deleteCommunication(comm.id);
        }
        return true;
    }

    // Communications
    getCommunications() {
        return this.cache.communications || [];
    }

    async addCommunication(communication) {
        return await this.saveData('communications', 'POST', communication);
    }

    async updateCommunication(id, updates) {
        return await this.saveData('communications', 'PUT', updates, id);
    }

    async deleteCommunication(id) {
        return await this.saveData('communications', 'DELETE', null, id);
    }

    // Prospects
    getProspects() {
        return this.cache.prospects || [];
    }

    async addProspect(prospect) {
        return await this.saveData('prospects', 'POST', prospect);
    }

    async updateProspect(id, updates) {
        return await this.saveData('prospects', 'PUT', updates, id);
    }

    async deleteProspect(id) {
        return await this.saveData('prospects', 'DELETE', null, id);
    }

    // Stakeholders
    getStakeholders() {
        return this.cache.stakeholders || [];
    }

    async addStakeholder(stakeholder) {
        return await this.saveData('stakeholders', 'POST', stakeholder);
    }

    async updateStakeholder(id, updates) {
        return await this.saveData('stakeholders', 'PUT', updates, id);
    }

    async deleteStakeholder(id) {
        return await this.saveData('stakeholders', 'DELETE', null, id);
    }

    // Email Recipients
    getEmailRecipients() {
        return this.cache.emailRecipients || [];
    }

    async addEmailRecipient(recipient) {
        return await this.saveData('emailRecipients', 'POST', recipient);
    }

    async updateEmailRecipient(id, updates) {
        return await this.saveData('emailRecipients', 'PUT', updates, id);
    }

    async deleteEmailRecipient(id) {
        return await this.saveData('emailRecipients', 'DELETE', null, id);
    }

    // Settings
    getSettings() {
        return this.cache.settings || this.getDefaultSettings();
    }

    async saveSettings(settings) {
        try {
            const response = await fetch(`${this.apiBase}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                this.cache.settings = settings;
                return settings;
            }
            throw new Error('Failed to save settings');
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    // Utility Functions (same as before)
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    getDaysUntilDue(dueDate) {
        if (!dueDate) return null;
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isOverdue(dueDate) {
        if (!dueDate) return false;
        return this.getDaysUntilDue(dueDate) < 0;
    }

    isDueSoon(dueDate, days = 7) {
        if (!dueDate) return false;
        const daysUntil = this.getDaysUntilDue(dueDate);
        return daysUntil >= 0 && daysUntil <= days;
    }

    // Analytics and Dashboard Data
    async getDashboardStats() {
        try {
            const response = await fetch(`${this.apiBase}/dashboard/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Using fallback stats calculation');
        }

        // Fallback to client-side calculation
        const projects = this.getProjects();
        const communications = this.getCommunications();
        
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const pendingItems = communications.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
        const overdueItems = communications.filter(c => this.isOverdue(c.dueDate)).length;
        const dueThisWeek = communications.filter(c => this.isDueSoon(c.dueDate, 7)).length;

        return {
            activeProjects,
            pendingItems,
            overdueItems,
            dueThisWeek
        };
    }

    getCriticalAlerts() {
        const communications = this.getCommunications();
        const projects = this.getProjects();
        const prospects = this.getProspects();
        const alerts = [];

        // Overdue communications
        communications.forEach(comm => {
            if (this.isOverdue(comm.dueDate)) {
                const project = projects.find(p => p.id === comm.projectId);
                const stakeholder = this.getStakeholders().find(s => s.id === comm.stakeholderId);
                alerts.push({
                    type: 'critical',
                    icon: 'fas fa-exclamation-triangle',
                    title: `Overdue ${comm.type}`,
                    message: `${comm.subject} (${project?.name || 'Unknown Project'})`,
                    daysOverdue: Math.abs(this.getDaysUntilDue(comm.dueDate))
                });
            }
        });

        // Due soon communications
        communications.forEach(comm => {
            if (this.isDueSoon(comm.dueDate, 3) && !this.isOverdue(comm.dueDate)) {
                const project = projects.find(p => p.id === comm.projectId);
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-clock',
                    title: `${comm.type} Due Soon`,
                    message: `${comm.subject} (${project?.name || 'Unknown Project'})`,
                    daysUntil: this.getDaysUntilDue(comm.dueDate)
                });
            }
        });

        // Overdue proposals
        prospects.forEach(prospect => {
            if (prospect.proposalDueDate && this.isOverdue(prospect.proposalDueDate)) {
                alerts.push({
                    type: 'critical',
                    icon: 'fas fa-handshake',
                    title: 'Overdue Proposal',
                    message: `${prospect.name} proposal was due ${Math.abs(this.getDaysUntilDue(prospect.proposalDueDate))} days ago`,
                    daysOverdue: Math.abs(this.getDaysUntilDue(prospect.proposalDueDate))
                });
            }
        });

        return alerts.slice(0, 10); // Limit to 10 most critical
    }

    getUpcomingDeadlines() {
        const communications = this.getCommunications();
        const prospects = this.getProspects();
        const projects = this.getProjects();
        const deadlines = [];

        // Communication deadlines
        communications.forEach(comm => {
            if (comm.dueDate && this.isDueSoon(comm.dueDate, 14)) {
                const project = projects.find(p => p.id === comm.projectId);
                deadlines.push({
                    type: comm.type,
                    title: comm.subject,
                    project: project?.name || 'Unknown Project',
                    dueDate: comm.dueDate,
                    daysUntil: this.getDaysUntilDue(comm.dueDate),
                    priority: comm.priority,
                    icon: this.getTypeIcon(comm.type)
                });
            }
        });

        // Proposal deadlines
        prospects.forEach(prospect => {
            if (prospect.proposalDueDate && this.isDueSoon(prospect.proposalDueDate, 14)) {
                deadlines.push({
                    type: 'Proposal',
                    title: prospect.name,
                    project: prospect.client,
                    dueDate: prospect.proposalDueDate,
                    daysUntil: this.getDaysUntilDue(prospect.proposalDueDate),
                    priority: 'High',
                    icon: 'fas fa-handshake'
                });
            }
        });

        return deadlines
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .slice(0, 10);
    }

    getRecentActivity() {
        const allItems = [
            ...this.getProjects().map(p => ({ ...p, type: 'project' })),
            ...this.getCommunications().map(c => ({ ...c, type: 'communication' })),
            ...this.getProspects().map(p => ({ ...p, type: 'prospect' })),
            ...this.getStakeholders().map(s => ({ ...s, type: 'stakeholder' }))
        ];

        return allItems
            .filter(item => item.createdAt || item.updatedAt)
            .sort((a, b) => {
                const aTime = new Date(a.updatedAt || a.createdAt);
                const bTime = new Date(b.updatedAt || b.createdAt);
                return bTime - aTime;
            })
            .slice(0, 10)
            .map(item => ({
                title: this.getActivityTitle(item),
                description: this.getActivityDescription(item),
                time: item.updatedAt || item.createdAt,
                icon: this.getActivityIcon(item.type)
            }));
    }

    getTypeIcon(type) {
        const icons = {
            'RFI': 'fas fa-question-circle',
            'Submittal': 'fas fa-upload',
            'Change Order': 'fas fa-edit',
            'Lien Release': 'fas fa-file-contract',
            'General': 'fas fa-comment'
        };
        return icons[type] || 'fas fa-comment';
    }

    getActivityTitle(item) {
        switch (item.type) {
            case 'project': return `Project: ${item.name}`;
            case 'communication': return `${item.type}: ${item.subject}`;
            case 'prospect': return `Prospect: ${item.name}`;
            case 'stakeholder': return `Contact: ${item.name}`;
            default: return 'Unknown Activity';
        }
    }

    getActivityDescription(item) {
        switch (item.type) {
            case 'project': return `Created project #${item.number}`;
            case 'communication': return `${item.updatedAt ? 'Updated' : 'Created'} ${item.type.toLowerCase()}`;
            case 'prospect': return `${item.updatedAt ? 'Updated' : 'Added'} prospect`;
            case 'stakeholder': return `${item.updatedAt ? 'Updated' : 'Added'} contact`;
            default: return 'Activity occurred';
        }
    }

    getActivityIcon(type) {
        const icons = {
            'project': 'fas fa-building',
            'communication': 'fas fa-comments',
            'prospect': 'fas fa-handshake',
            'stakeholder': 'fas fa-user'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    // Export/Import functions
    async exportAllData() {
        try {
            const response = await fetch(`${this.apiBase}/backup`);
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to create backup');
        } catch (error) {
            console.error('Error exporting data:', error);
            // Fallback to client-side export
            return {
                projects: this.getProjects(),
                communications: this.getCommunications(),
                prospects: this.getProspects(),
                stakeholders: this.getStakeholders(),
                emailRecipients: this.getEmailRecipients(),
                settings: this.getSettings(),
                exportDate: new Date().toISOString()
            };
        }
    }

    async importAllData(data) {
        try {
            const response = await fetch(`${this.apiBase}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                await this.refreshCache();
                return true;
            }
            throw new Error('Failed to restore data');
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
window.dataManager = new ServerDataManager();
