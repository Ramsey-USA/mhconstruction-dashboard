// Data Management for Construction Dashboard
// Handles local storage, sample data, and data operations

class DataManager {
    constructor() {
        this.storageKeys = {
            projects: 'construction_projects',
            communications: 'construction_communications',
            prospects: 'construction_prospects',
            stakeholders: 'construction_stakeholders',
            emailRecipients: 'construction_email_recipients',
            settings: 'construction_settings'
        };
        
        this.initializeData();
    }

    // Initialize data with samples if none exists
    initializeData() {
        if (!this.getProjects().length) {
            this.loadSampleData();
        }
    }

    // Local Storage Operations
    saveData(key, data) {
        try {
            localStorage.setItem(this.storageKeys[key], JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    getData(key) {
        try {
            const data = localStorage.getItem(this.storageKeys[key]);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading data:', error);
            return [];
        }
    }

    // Projects
    getProjects() {
        return this.getData('projects');
    }

    saveProjects(projects) {
        return this.saveData('projects', projects);
    }

    addProject(project) {
        const projects = this.getProjects();
        project.id = this.generateId();
        project.createdAt = new Date().toISOString();
        projects.push(project);
        this.saveProjects(projects);
        return project;
    }

    updateProject(id, updates) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveProjects(projects);
            return projects[index];
        }
        return null;
    }

    deleteProject(id) {
        const projects = this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        this.saveProjects(filtered);
        
        // Also delete related communications
        const communications = this.getCommunications();
        const filteredComms = communications.filter(c => c.projectId !== id);
        this.saveCommunications(filteredComms);
        
        return true;
    }

    // Communications
    getCommunications() {
        return this.getData('communications');
    }

    saveCommunications(communications) {
        return this.saveData('communications', communications);
    }

    addCommunication(communication) {
        const communications = this.getCommunications();
        communication.id = this.generateId();
        communication.createdAt = new Date().toISOString();
        communications.push(communication);
        this.saveCommunications(communications);
        return communication;
    }

    updateCommunication(id, updates) {
        const communications = this.getCommunications();
        const index = communications.findIndex(c => c.id === id);
        if (index !== -1) {
            communications[index] = { ...communications[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveCommunications(communications);
            return communications[index];
        }
        return null;
    }

    deleteCommunication(id) {
        const communications = this.getCommunications();
        const filtered = communications.filter(c => c.id !== id);
        this.saveCommunications(filtered);
        return true;
    }

    // Prospects
    getProspects() {
        return this.getData('prospects');
    }

    saveProspects(prospects) {
        return this.saveData('prospects', prospects);
    }

    addProspect(prospect) {
        const prospects = this.getProspects();
        prospect.id = this.generateId();
        prospect.createdAt = new Date().toISOString();
        prospects.push(prospect);
        this.saveProspects(prospects);
        return prospect;
    }

    updateProspect(id, updates) {
        const prospects = this.getProspects();
        const index = prospects.findIndex(p => p.id === id);
        if (index !== -1) {
            prospects[index] = { ...prospects[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveProspects(prospects);
            return prospects[index];
        }
        return null;
    }

    deleteProspect(id) {
        const prospects = this.getProspects();
        const filtered = prospects.filter(p => p.id !== id);
        this.saveProspects(filtered);
        return true;
    }

    // Stakeholders
    getStakeholders() {
        return this.getData('stakeholders');
    }

    saveStakeholders(stakeholders) {
        return this.saveData('stakeholders', stakeholders);
    }

    addStakeholder(stakeholder) {
        const stakeholders = this.getStakeholders();
        stakeholder.id = this.generateId();
        stakeholder.createdAt = new Date().toISOString();
        stakeholders.push(stakeholder);
        this.saveStakeholders(stakeholders);
        return stakeholder;
    }

    updateStakeholder(id, updates) {
        const stakeholders = this.getStakeholders();
        const index = stakeholders.findIndex(s => s.id === id);
        if (index !== -1) {
            stakeholders[index] = { ...stakeholders[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveStakeholders(stakeholders);
            return stakeholders[index];
        }
        return null;
    }

    deleteStakeholder(id) {
        const stakeholders = this.getStakeholders();
        const filtered = stakeholders.filter(s => s.id !== id);
        this.saveStakeholders(filtered);
        return true;
    }

    // Email Recipients
    getEmailRecipients() {
        return this.getData('emailRecipients');
    }

    saveEmailRecipients(recipients) {
        return this.saveData('emailRecipients', recipients);
    }

    addEmailRecipient(recipient) {
        const recipients = this.getEmailRecipients();
        recipient.id = this.generateId();
        recipient.createdAt = new Date().toISOString();
        recipients.push(recipient);
        this.saveEmailRecipients(recipients);
        return recipient;
    }

    updateEmailRecipient(id, updates) {
        const recipients = this.getEmailRecipients();
        const index = recipients.findIndex(r => r.id === id);
        if (index !== -1) {
            recipients[index] = { ...recipients[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveEmailRecipients(recipients);
            return recipients[index];
        }
        return null;
    }

    deleteEmailRecipient(id) {
        const recipients = this.getEmailRecipients();
        const filtered = recipients.filter(r => r.id !== id);
        this.saveEmailRecipients(filtered);
        return true;
    }

    // Settings
    getSettings() {
        const defaultSettings = {
            emailSignature: 'Best regards,\nProject Engineering Department',
            sendTime: '17:00',
            autoSendEnabled: false,
            companyName: 'Your Construction Company',
            yourName: 'Project Engineer'
        };
        
        const saved = this.getData('settings');
        return saved.length ? saved[0] : defaultSettings;
    }

    saveSettings(settings) {
        return this.saveData('settings', [settings]);
    }

    // Utility Functions
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
    getDashboardStats() {
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
                    message: `${comm.subject} - ${project?.name || 'Unknown Project'} - ${stakeholder?.name || 'Unknown Stakeholder'}`,
                    daysOverdue: Math.abs(this.getDaysUntilDue(comm.dueDate))
                });
            }
        });

        // Items due soon
        communications.forEach(comm => {
            if (this.isDueSoon(comm.dueDate, 3) && !this.isOverdue(comm.dueDate)) {
                const project = projects.find(p => p.id === comm.projectId);
                const stakeholder = this.getStakeholders().find(s => s.id === comm.stakeholderId);
                alerts.push({
                    type: 'warning',
                    icon: 'fas fa-clock',
                    title: `Due Soon: ${comm.type}`,
                    message: `${comm.subject} - ${project?.name || 'Unknown Project'} - Due in ${this.getDaysUntilDue(comm.dueDate)} days`,
                    daysUntil: this.getDaysUntilDue(comm.dueDate)
                });
            }
        });

        // Prospect proposal deadlines
        prospects.forEach(prospect => {
            if (this.isDueSoon(prospect.proposalDueDate, 5)) {
                alerts.push({
                    type: 'info',
                    icon: 'fas fa-handshake',
                    title: 'Proposal Due Soon',
                    message: `${prospect.name} - Proposal due ${this.formatDate(prospect.proposalDueDate)}`,
                    daysUntil: this.getDaysUntilDue(prospect.proposalDueDate)
                });
            }
        });

        return alerts.sort((a, b) => {
            if (a.type === 'critical' && b.type !== 'critical') return -1;
            if (b.type === 'critical' && a.type !== 'critical') return 1;
            return (a.daysOverdue || -a.daysUntil || 0) - (b.daysOverdue || -b.daysUntil || 0);
        });
    }

    getUpcomingDeadlines() {
        const communications = this.getCommunications();
        const projects = this.getProjects();
        const prospects = this.getProspects();
        const deadlines = [];

        // Communication deadlines
        communications.forEach(comm => {
            if (comm.dueDate && !this.isOverdue(comm.dueDate)) {
                const project = projects.find(p => p.id === comm.projectId);
                const stakeholder = this.getStakeholders().find(s => s.id === comm.stakeholderId);
                const daysUntil = this.getDaysUntilDue(comm.dueDate);
                
                if (daysUntil <= 14) { // Next 2 weeks
                    deadlines.push({
                        date: comm.dueDate,
                        daysUntil,
                        type: comm.type,
                        title: comm.subject,
                        project: project?.name || 'Unknown Project',
                        stakeholder: stakeholder?.name || 'Unknown Stakeholder',
                        priority: comm.priority || 'medium'
                    });
                }
            }
        });

        // Prospect deadlines
        prospects.forEach(prospect => {
            if (prospect.proposalDueDate && !this.isOverdue(prospect.proposalDueDate)) {
                const daysUntil = this.getDaysUntilDue(prospect.proposalDueDate);
                
                if (daysUntil <= 14) {
                    deadlines.push({
                        date: prospect.proposalDueDate,
                        daysUntil,
                        type: 'Proposal',
                        title: prospect.name,
                        project: 'Prospect',
                        stakeholder: prospect.client,
                        priority: 'high'
                    });
                }
            }
        });

        return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    }

    getRecentActivity() {
        const communications = this.getCommunications();
        const projects = this.getProjects();
        const prospects = this.getProspects();
        const stakeholders = this.getStakeholders();
        const activities = [];

        // Recent communications
        communications.slice(-10).reverse().forEach(comm => {
            const project = projects.find(p => p.id === comm.projectId);
            const stakeholder = stakeholders.find(s => s.id === comm.stakeholderId);
            activities.push({
                type: 'communication',
                icon: this.getTypeIcon(comm.type),
                title: `${comm.type} ${comm.status === 'completed' ? 'Completed' : 'Added'}`,
                description: `${comm.subject} - ${project?.name || 'Unknown Project'}`,
                time: comm.updatedAt || comm.createdAt,
                stakeholder: stakeholder?.name
            });
        });

        // Recent projects
        projects.slice(-5).reverse().forEach(project => {
            activities.push({
                type: 'project',
                icon: 'fas fa-building',
                title: 'Project Added',
                description: project.name,
                time: project.createdAt,
                stakeholder: project.client
            });
        });

        return activities
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 10);
    }

    getTypeIcon(type) {
        const icons = {
            'RFI': 'fas fa-question-circle',
            'Submittal': 'fas fa-file-upload',
            'Change Order': 'fas fa-edit',
            'Lien Release': 'fas fa-shield-alt',
            'General': 'fas fa-comment'
        };
        return icons[type] || 'fas fa-comment';
    }

    // Export data for backup
    exportAllData() {
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

    // Import data from backup
    importAllData(data) {
        try {
            if (data.projects) this.saveProjects(data.projects);
            if (data.communications) this.saveCommunications(data.communications);
            if (data.prospects) this.saveProspects(data.prospects);
            if (data.stakeholders) this.saveStakeholders(data.stakeholders);
            if (data.emailRecipients) this.saveEmailRecipients(data.emailRecipients);
            if (data.settings) this.saveSettings(data.settings);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Load sample data for demonstration
    loadSampleData() {
        // Sample stakeholders
        const sampleStakeholders = [
            {
                id: 'stake_1',
                name: 'John Smith',
                role: 'Project Manager',
                company: 'ABC Construction',
                email: 'john.smith@abcconstruction.com',
                phone: '(555) 123-4567',
                receivesEmails: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stake_2',
                name: 'Mike Johnson',
                role: 'Superintendent',
                company: 'ABC Construction',
                email: 'mike.johnson@abcconstruction.com',
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
            },
            {
                id: 'stake_4',
                name: 'Tom Brown',
                role: 'Estimator',
                company: 'ABC Construction',
                email: 'tom.brown@abcconstruction.com',
                phone: '(555) 123-4569',
                receivesEmails: false,
                createdAt: new Date().toISOString()
            },
            {
                id: 'stake_5',
                name: "Mike's Electric",
                role: 'Subcontractor',
                company: "Mike's Electric LLC",
                email: 'info@mikeselectric.com',
                phone: '(555) 345-6789',
                receivesEmails: false,
                createdAt: new Date().toISOString()
            }
        ];

        // Sample projects
        const sampleProjects = [
            {
                id: 'proj_1',
                number: '2024-001',
                name: 'Alpha Office Building',
                client: 'Alpha Corp',
                projectManagerId: 'stake_1',
                superintendentId: 'stake_2',
                status: 'active',
                startDate: '2024-01-15',
                endDate: '2024-08-15',
                contractValue: 2500000,
                createdAt: new Date().toISOString()
            },
            {
                id: 'proj_2',
                number: '2024-002',
                name: 'Beta Warehouse',
                client: 'Beta Industries',
                projectManagerId: 'stake_1',
                superintendentId: 'stake_2',
                status: 'active',
                startDate: '2024-02-01',
                endDate: '2024-09-30',
                contractValue: 1800000,
                createdAt: new Date().toISOString()
            },
            {
                id: 'proj_3',
                number: '2024-003',
                name: 'Gamma Retail Center',
                client: 'Gamma Development',
                projectManagerId: 'stake_1',
                status: 'planning',
                startDate: '2024-04-01',
                endDate: '2024-12-15',
                contractValue: 3200000,
                createdAt: new Date().toISOString()
            }
        ];

        // Sample communications
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const sampleCommunications = [
            {
                id: 'comm_1',
                projectId: 'proj_1',
                stakeholderId: 'stake_3',
                type: 'RFI',
                subject: 'HVAC routing clarification',
                notes: 'Need clarification on HVAC routing through structural beams on 3rd floor',
                priority: 'high',
                status: 'pending',
                dueDate: tomorrow.toISOString().split('T')[0],
                createdAt: lastWeek.toISOString()
            },
            {
                id: 'comm_2',
                projectId: 'proj_1',
                stakeholderId: 'stake_5',
                type: 'Lien Release',
                subject: 'January work lien release',
                notes: 'Conditional lien release for January electrical work - $45,000',
                priority: 'medium',
                status: 'pending',
                dueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days overdue
                createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'comm_3',
                projectId: 'proj_2',
                stakeholderId: 'stake_3',
                type: 'Submittal',
                subject: 'Structural steel shop drawings',
                notes: 'Shop drawings for main structural steel frame',
                priority: 'high',
                status: 'in-progress',
                dueDate: nextWeek.toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'comm_4',
                projectId: 'proj_1',
                stakeholderId: 'stake_1',
                type: 'Change Order',
                subject: 'Additional electrical outlets - 2nd floor',
                notes: 'Client requested 12 additional outlets in open office area',
                priority: 'medium',
                status: 'completed',
                dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'comm_5',
                projectId: 'proj_2',
                stakeholderId: 'stake_5',
                type: 'Submittal',
                subject: 'Electrical panel schedule',
                notes: 'Main electrical panel schedule and load calculations',
                priority: 'high',
                status: 'pending',
                dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Sample prospects
        const sampleProspects = [
            {
                id: 'pros_1',
                name: 'Delta Manufacturing Plant',
                client: 'Delta Industries',
                estimatorId: 'stake_4',
                walkDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                proposalDueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estimatedValue: 4500000,
                probability: 75,
                notes: 'Strong relationship with client. Competitive advantage on timeline.',
                status: 'active',
                createdAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'pros_2',
                name: 'Echo Residential Complex',
                client: 'Echo Development',
                estimatorId: 'stake_4',
                walkDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                proposalDueDate: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estimatedValue: 6200000,
                probability: 50,
                notes: 'New client. Price will be key factor.',
                status: 'active',
                createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Sample email recipients
        const sampleEmailRecipients = [
            {
                id: 'recip_1',
                stakeholderId: 'stake_1',
                projectIds: ['proj_1', 'proj_2', 'proj_3'],
                sendTime: '17:00',
                frequency: 'daily',
                createdAt: new Date().toISOString()
            },
            {
                id: 'recip_2',
                stakeholderId: 'stake_2',
                projectIds: ['proj_1', 'proj_2'],
                sendTime: '17:00',
                frequency: 'daily',
                createdAt: new Date().toISOString()
            }
        ];

        // Save all sample data
        this.saveStakeholders(sampleStakeholders);
        this.saveProjects(sampleProjects);
        this.saveCommunications(sampleCommunications);
        this.saveProspects(sampleProspects);
        this.saveEmailRecipients(sampleEmailRecipients);

        console.log('Sample data loaded successfully');
    }
}

// Create global instance
window.dataManager = new DataManager();

