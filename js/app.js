// Main Application JavaScript for Construction Dashboard
// Handles UI interactions, tab management, and form processing

class ConstructionDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
        this.populateDropdowns();
        this.setupAutoRefresh();
    }

    // Event Binding
    bindEvents() {
        // Form submissions
        document.getElementById('add-project-form').addEventListener('submit', (e) => this.handleAddProject(e));
        document.getElementById('add-communication-form').addEventListener('submit', (e) => this.handleAddCommunication(e));
        document.getElementById('add-prospect-form').addEventListener('submit', (e) => this.handleAddProspect(e));
        document.getElementById('add-stakeholder-form').addEventListener('submit', (e) => this.handleAddStakeholder(e));
        document.getElementById('add-recipient-form').addEventListener('submit', (e) => this.handleAddEmailRecipient(e));

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Settings changes
        document.getElementById('auto-send-enabled').addEventListener('change', (e) => this.saveSettings());
        document.getElementById('send-time').addEventListener('change', (e) => this.saveSettings());
        document.getElementById('email-signature').addEventListener('change', (e) => this.saveSettings());
    }

    // Tab Management
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to clicked nav tab
        event.target.classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'projects':
                this.loadProjects();
                break;
            case 'communications':
                this.loadCommunications();
                break;
            case 'prospects':
                this.loadProspects();
                break;
            case 'stakeholders':
                this.loadStakeholders();
                break;
            case 'emails':
                this.loadEmailSetup();
                break;
            case 'microsoft365':
                this.loadMicrosoft365Status();
                break;
        }
    }

    // Dashboard Loading
    async loadDashboard() {
        await this.loadDashboardStats();
        this.loadCriticalAlerts();
        this.loadUpcomingDeadlines();
        this.loadRecentActivity();
    }

    async loadDashboardStats() {
        try {
            const stats = await dataManager.getDashboardStats();
            
            document.getElementById('active-projects').textContent = stats.activeProjects;
            document.getElementById('pending-items').textContent = stats.pendingItems;
            document.getElementById('overdue-items').textContent = stats.overdueItems;
            document.getElementById('due-this-week').textContent = stats.dueThisWeek;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    loadCriticalAlerts() {
        const alerts = dataManager.getCriticalAlerts();
        const container = document.getElementById('critical-alerts');
        
        if (alerts.length === 0) {
            container.innerHTML = '<div class="alert alert-info"><div class="alert-content"><div class="alert-icon"><i class="fas fa-check-circle"></i></div><div class="alert-text"><h4>All Clear!</h4><p>No critical alerts at this time.</p></div></div></div>';
            return;
        }
        
        container.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="${alert.icon}"></i>
                    </div>
                    <div class="alert-text">
                        <h4>${alert.title}</h4>
                        <p>${alert.message}</p>
                    </div>
                </div>
                <div class="alert-actions">
                    ${alert.daysOverdue ? `<span class="overdue-badge">${alert.daysOverdue} days overdue</span>` : ''}
                    ${alert.daysUntil !== undefined ? `<span class="due-badge">Due in ${alert.daysUntil} days</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    loadUpcomingDeadlines() {
        const deadlines = dataManager.getUpcomingDeadlines();
        const container = document.getElementById('upcoming-deadlines');
        
        if (deadlines.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No upcoming deadlines in the next 2 weeks.</p>';
            return;
        }
        
        container.innerHTML = deadlines.map(deadline => {
            const urgencyClass = deadline.daysUntil <= 1 ? 'deadline-critical' : 
                               deadline.daysUntil <= 3 ? 'deadline-warning' : 'deadline-normal';
            
            return `
                <div class="deadline-item ${urgencyClass}">
                    <div class="deadline-content">
                        <div class="deadline-date">
                            ${deadline.daysUntil === 0 ? 'Today' : 
                              deadline.daysUntil === 1 ? 'Tomorrow' : 
                              `${deadline.daysUntil} days`}
                        </div>
                        <div class="deadline-info">
                            <h4>${deadline.title}</h4>
                            <p>${deadline.type} • ${deadline.project} • ${deadline.stakeholder}</p>
                        </div>
                    </div>
                    <div class="deadline-priority">
                        <span class="priority-${deadline.priority}">${deadline.priority.toUpperCase()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadRecentActivity() {
        const activities = dataManager.getRecentActivity();
        const container = document.getElementById('recent-activity');
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No recent activity.</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h5>${activity.title}</h5>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">
                    ${this.formatTimeAgo(activity.time)}
                </div>
            </div>
        `).join('');
    }

    // Projects Management
    loadProjects() {
        const projects = dataManager.getProjects();
        const stakeholders = dataManager.getStakeholders();
        const container = document.getElementById('projects-grid');
        
        if (projects.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No projects found. Click "Add Project" to get started.</p>';
            return;
        }
        
        container.innerHTML = projects.map(project => {
            const pm = stakeholders.find(s => s.id === project.projectManagerId);
            const super_ = stakeholders.find(s => s.id === project.superintendentId);
            const communications = dataManager.getCommunications().filter(c => c.projectId === project.id);
            const overdueCount = communications.filter(c => dataManager.isOverdue(c.dueDate)).length;
            
            return `
                <div class="project-card">
                    <div class="project-header">
                        <div class="project-title">
                            <h3>${project.name}</h3>
                            <p>#${project.number} • ${project.client}</p>
                        </div>
                        <span class="project-status status-${project.status}">${project.status}</span>
                    </div>
                    <div class="project-details">
                        <div class="project-detail">
                            <i class="fas fa-user"></i>
                            <span>PM: ${pm?.name || 'Unassigned'}</span>
                        </div>
                        <div class="project-detail">
                            <i class="fas fa-hard-hat"></i>
                            <span>Super: ${super_?.name || 'Unassigned'}</span>
                        </div>
                        <div class="project-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${dataManager.formatDate(project.startDate)}</span>
                        </div>
                        <div class="project-detail">
                            <i class="fas fa-dollar-sign"></i>
                            <span>$${(project.contractValue || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    ${overdueCount > 0 ? `<div class="project-alerts"><i class="fas fa-exclamation-triangle"></i> ${overdueCount} overdue items</div>` : ''}
                    <div class="project-actions">
                        <button class="btn btn-primary" onclick="dashboard.viewProjectDetails('${project.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-secondary" onclick="dashboard.editProject('${project.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="dashboard.deleteProject('${project.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Communications Management
    loadCommunications() {
        this.filterCommunications();
    }

    filterCommunications() {
        const projectFilter = document.getElementById('project-filter').value;
        const typeFilter = document.getElementById('type-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        let communications = dataManager.getCommunications();
        
        if (projectFilter) {
            communications = communications.filter(c => c.projectId === projectFilter);
        }
        if (typeFilter) {
            communications = communications.filter(c => c.type === typeFilter);
        }
        if (statusFilter) {
            communications = communications.filter(c => c.status === statusFilter);
        }
        
        this.displayCommunications(communications);
    }

    displayCommunications(communications) {
        const projects = dataManager.getProjects();
        const stakeholders = dataManager.getStakeholders();
        const container = document.getElementById('communications-list');
        
        if (communications.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No communications found.</p>';
            return;
        }
        
        // Sort by due date and priority
        communications.sort((a, b) => {
            if (dataManager.isOverdue(a.dueDate) && !dataManager.isOverdue(b.dueDate)) return -1;
            if (!dataManager.isOverdue(a.dueDate) && dataManager.isOverdue(b.dueDate)) return 1;
            return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
        });
        
        container.innerHTML = communications.map(comm => {
            const project = projects.find(p => p.id === comm.projectId);
            const stakeholder = stakeholders.find(s => s.id === comm.stakeholderId);
            const isOverdue = dataManager.isOverdue(comm.dueDate);
            const daysUntil = dataManager.getDaysUntilDue(comm.dueDate);
            
            return `
                <div class="communication-item comm-type-${comm.type.toLowerCase().replace(' ', '-')}">
                    <div class="communication-header">
                        <div class="communication-title">
                            <h4>${comm.subject}</h4>
                            <div class="communication-meta">
                                <span><i class="fas fa-building"></i> ${project?.name || 'Unknown Project'}</span>
                                <span><i class="fas fa-user"></i> ${stakeholder?.name || 'Unknown Stakeholder'}</span>
                                <span><i class="fas fa-tag"></i> ${comm.type}</span>
                                ${comm.dueDate ? `<span><i class="fas fa-calendar"></i> Due: ${dataManager.formatDate(comm.dueDate)}</span>` : ''}
                            </div>
                        </div>
                        <span class="communication-status status-${isOverdue ? 'overdue' : comm.status.replace(' ', '-')}">${isOverdue ? 'OVERDUE' : comm.status}</span>
                    </div>
                    ${comm.notes ? `<div class="communication-content"><p>${comm.notes}</p></div>` : ''}
                    <div class="communication-actions">
                        <button class="btn btn-primary" onclick="dashboard.editCommunication('${comm.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-success" onclick="dashboard.markCompleted('${comm.id}')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                        <button class="btn btn-danger" onclick="dashboard.deleteCommunication('${comm.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Prospects Management
    loadProspects() {
        const prospects = dataManager.getProspects();
        const stakeholders = dataManager.getStakeholders();
        const container = document.getElementById('prospects-list');
        
        if (prospects.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No prospects found. Click "Add Prospect" to get started.</p>';
            return;
        }
        
        container.innerHTML = prospects.map(prospect => {
            const estimator = stakeholders.find(s => s.id === prospect.estimatorId);
            const isDueSoon = dataManager.isDueSoon(prospect.proposalDueDate, 7);
            
            // Determine probability category for styling
            let probabilityCategory = 'medium';
            if (prospect.probability >= 70) probabilityCategory = 'high';
            else if (prospect.probability < 40) probabilityCategory = 'low';
            
            return `
                <div class="prospect-item" data-probability="${probabilityCategory}">
                    <div class="prospect-status status-${prospect.status || 'active'}"></div>
                    <div class="prospect-header">
                        <div class="prospect-title">
                            <h4>${prospect.name}</h4>
                            <p>${prospect.client}</p>
                        </div>
                        <span class="prospect-probability">${prospect.probability}% Win Probability</span>
                    </div>
                    <div class="prospect-details">
                        <div class="prospect-detail estimator-detail">
                            <i class="fas fa-user"></i>
                            <span><span class="detail-label">Estimator:</span> <span class="detail-value">${estimator?.name || 'Unassigned'}</span></span>
                        </div>
                        <div class="prospect-detail date-detail">
                            <i class="fas fa-calendar"></i>
                            <span><span class="detail-label">Walk Date:</span> <span class="detail-value">${dataManager.formatDate(prospect.walkDate)}</span></span>
                        </div>
                        <div class="prospect-detail date-detail">
                            <i class="fas fa-calendar-check"></i>
                            <span><span class="detail-label">Proposal Due:</span> <span class="detail-value">${dataManager.formatDate(prospect.proposalDueDate)}</span></span>
                        </div>
                        <div class="prospect-detail value-detail">
                            <i class="fas fa-dollar-sign"></i>
                            <span><span class="detail-label">Est. Value:</span> <span class="detail-value">$${(prospect.estimatedValue || 0).toLocaleString()}</span></span>
                        </div>
                    </div>
                    ${isDueSoon ? '<div class="prospect-alert"><i class="fas fa-clock"></i> Proposal due soon!</div>' : ''}
                    ${prospect.notes ? `<div class="prospect-notes"><p>${prospect.notes}</p></div>` : ''}
                    <div class="prospect-actions">
                        <button class="btn btn-primary" onclick="dashboard.editProspect('${prospect.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-success" onclick="dashboard.convertToProject('${prospect.id}')">
                            <i class="fas fa-building"></i> Convert to Project
                        </button>
                        <button class="btn btn-danger" onclick="dashboard.deleteProspect('${prospect.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Stakeholders Management
    loadStakeholders() {
        const stakeholders = dataManager.getStakeholders();
        const container = document.getElementById('stakeholders-list');
        
        if (stakeholders.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: #7f8c8d; padding: 2rem;">No stakeholders found. Click "Add Stakeholder" to get started.</p>';
            return;
        }
        
        container.innerHTML = stakeholders.map(stakeholder => `
            <div class="stakeholder-item" data-role="${stakeholder.role}">
                <div class="stakeholder-header">
                    <div class="stakeholder-avatar">
                        ${stakeholder.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="stakeholder-info">
                        <h4>${stakeholder.name}</h4>
                        <p class="stakeholder-role">${stakeholder.role}${stakeholder.company ? ` • ${stakeholder.company}` : ''}</p>
                    </div>
                </div>
                <div class="stakeholder-contact">
                    ${stakeholder.email ? `<div class="contact-item email-item" onclick="window.location.href='mailto:${stakeholder.email}'" title="Send email to ${stakeholder.name}"><i class="fas fa-envelope"></i> ${stakeholder.email}</div>` : ''}
                    ${stakeholder.phone ? `<div class="contact-item phone-item" onclick="window.location.href='tel:${stakeholder.phone}'" title="Call ${stakeholder.name}"><i class="fas fa-phone"></i> ${stakeholder.phone}</div>` : ''}
                    ${stakeholder.receivesEmails ? '<div class="contact-item receives-emails"><i class="fas fa-mail-bulk"></i> Receives daily emails</div>' : ''}
                </div>
                <div class="stakeholder-actions">
                    <button class="btn btn-primary" onclick="dashboard.editStakeholder('${stakeholder.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="dashboard.deleteStakeholder('${stakeholder.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Email Setup Management
    loadEmailSetup() {
        this.loadEmailRecipients();
        this.loadEmailSettings();
        this.updateEmailPreview();
    }

    loadEmailRecipients() {
        const recipients = dataManager.getEmailRecipients();
        const stakeholders = dataManager.getStakeholders();
        const projects = dataManager.getProjects();
        const container = document.getElementById('email-recipients-list');
        
        container.innerHTML = recipients.map(recipient => {
            const stakeholder = stakeholders.find(s => s.id === recipient.stakeholderId);
            const assignedProjects = projects.filter(p => recipient.projectIds.includes(p.id));
            
            return `
                <div class="recipient-item">
                    <div class="recipient-info">
                        <h5>${stakeholder?.name || 'Unknown Stakeholder'}</h5>
                        <p>${assignedProjects.map(p => p.name).join(', ')}</p>
                        <p>Sends at ${recipient.sendTime} • ${recipient.frequency}</p>
                    </div>
                    <div class="recipient-actions">
                        <button class="btn btn-secondary" onclick="dashboard.editEmailRecipient('${recipient.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="dashboard.deleteEmailRecipient('${recipient.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update preview dropdown
        const previewSelect = document.getElementById('preview-recipient');
        previewSelect.innerHTML = '<option value="">Select recipient to preview</option>' +
            recipients.map(recipient => {
                const stakeholder = stakeholders.find(s => s.id === recipient.stakeholderId);
                return `<option value="${recipient.id}">${stakeholder?.name || 'Unknown'}</option>`;
            }).join('');
    }

    loadEmailSettings() {
        const settings = dataManager.getSettings();
        
        document.getElementById('auto-send-enabled').checked = settings.autoSendEnabled;
        document.getElementById('send-time').value = settings.sendTime;
        document.getElementById('email-signature').value = settings.emailSignature;
    }

    updateEmailPreview() {
        const recipientId = document.getElementById('preview-recipient').value;
        const container = document.getElementById('email-preview-content');
        
        if (!recipientId) {
            container.innerHTML = '<p style="color: #7f8c8d;">Select a recipient to preview their daily email.</p>';
            return;
        }
        
        const emailContent = this.generateEmailContent(recipientId);
        container.innerHTML = `<pre>${emailContent}</pre>`;
    }

    // Form Handlers
    async handleAddProject(e) {
        e.preventDefault();
        
        try {
            const project = {
                number: document.getElementById('project-number').value,
                name: document.getElementById('project-name').value,
                client: document.getElementById('project-client').value,
                projectManagerId: document.getElementById('project-manager').value,
                superintendentId: document.getElementById('project-superintendent').value,
                startDate: document.getElementById('project-start-date').value,
                endDate: document.getElementById('project-end-date').value,
                contractValue: parseFloat(document.getElementById('project-value').value) || 0,
                status: 'active'
            };
            
            await dataManager.addProject(project);
            this.closeModal('add-project-modal');
            this.showNotification('Project added successfully!', 'success');
            this.loadProjects();
            this.populateDropdowns();
            e.target.reset();
        } catch (error) {
            console.error('Error adding project:', error);
            this.showNotification('Failed to add project. Please try again.', 'error');
        }
    }

    async handleAddCommunication(e) {
        e.preventDefault();
        
        try {
            const communication = {
                projectId: document.getElementById('comm-project').value,
                stakeholderId: document.getElementById('comm-stakeholder').value,
                type: document.getElementById('comm-type').value,
                subject: document.getElementById('comm-subject').value,
                notes: document.getElementById('comm-notes').value,
                priority: document.getElementById('comm-priority').value,
                dueDate: document.getElementById('comm-due-date').value,
                status: document.getElementById('comm-status').value
            };
            
            await dataManager.addCommunication(communication);
            this.closeModal('add-communication-modal');
            this.showNotification('Communication added successfully!', 'success');
            this.loadCommunications();
            e.target.reset();
        } catch (error) {
            console.error('Error adding communication:', error);
            this.showNotification('Failed to add communication. Please try again.', 'error');
        }
    }

    async handleAddProspect(e) {
        e.preventDefault();
        
        try {
            const prospect = {
                name: document.getElementById('prospect-name').value,
                client: document.getElementById('prospect-client').value,
                estimatorId: document.getElementById('prospect-estimator').value,
                walkDate: document.getElementById('prospect-walk-date').value,
                proposalDueDate: document.getElementById('prospect-due-date').value,
                estimatedValue: parseFloat(document.getElementById('prospect-value').value) || 0,
                probability: parseInt(document.getElementById('prospect-probability').value),
                notes: document.getElementById('prospect-notes').value,
                status: 'active'
            };
            
            await dataManager.addProspect(prospect);
            this.closeModal('add-prospect-modal');
            this.showNotification('Prospect added successfully!', 'success');
            this.loadProspects();
            e.target.reset();
        } catch (error) {
            console.error('Error adding prospect:', error);
            this.showNotification('Failed to add prospect. Please try again.', 'error');
        }
    }

    async handleAddStakeholder(e) {
        e.preventDefault();
        
        try {
            const stakeholder = {
                name: document.getElementById('stakeholder-name').value,
                role: document.getElementById('stakeholder-role').value,
                company: document.getElementById('stakeholder-company').value,
                email: document.getElementById('stakeholder-email').value,
                phone: document.getElementById('stakeholder-phone').value,
                receivesEmails: document.getElementById('stakeholder-receives-emails').checked
            };
            
            await dataManager.addStakeholder(stakeholder);
            this.closeModal('add-stakeholder-modal');
            this.showNotification('Stakeholder added successfully!', 'success');
            this.loadStakeholders();
            this.populateDropdowns();
            e.target.reset();
        } catch (error) {
            console.error('Error adding stakeholder:', error);
            this.showNotification('Failed to add stakeholder. Please try again.', 'error');
        }
    }

    async handleAddEmailRecipient(e) {
        e.preventDefault();
        
        try {
            const selectedProjects = Array.from(document.getElementById('recipient-projects').selectedOptions)
                .map(option => option.value);
            
            const stakeholderId = document.getElementById('recipient-stakeholder').value;
            
            const recipient = {
                stakeholderId: stakeholderId,
                projectIds: selectedProjects,
                sendTime: document.getElementById('recipient-time').value,
                frequency: document.getElementById('recipient-frequency').value
            };
            
            // Add the email recipient
            await dataManager.addEmailRecipient(recipient);
            
            // Update the stakeholder to indicate they now receive emails
            const stakeholder = dataManager.getStakeholders().find(s => s.id === stakeholderId);
            if (stakeholder && !stakeholder.receivesEmails) {
                await dataManager.updateStakeholder(stakeholderId, { receivesEmails: true });
            }
            
            this.closeModal('add-recipient-modal');
            this.showNotification('Email recipient added successfully!', 'success');
            this.loadEmailRecipients();
            this.loadStakeholders(); // Refresh stakeholders list to show updated status
            e.target.reset();
        } catch (error) {
            console.error('Error adding email recipient:', error);
            this.showNotification('Failed to add email recipient. Please try again.', 'error');
        }
    }

    // Utility Functions
    populateDropdowns() {
        const stakeholders = dataManager.getStakeholders();
        const projects = dataManager.getProjects();
        
        // Project Manager dropdown
        const pmSelect = document.getElementById('project-manager');
        const pms = stakeholders.filter(s => s.role === 'Project Manager');
        pmSelect.innerHTML = '<option value="">Select PM</option>' +
            pms.map(pm => `<option value="${pm.id}">${pm.name}</option>`).join('');
        
        // Superintendent dropdown
        const superSelect = document.getElementById('project-superintendent');
        const supers = stakeholders.filter(s => s.role === 'Superintendent');
        superSelect.innerHTML = '<option value="">Select Superintendent</option>' +
            supers.map(super_ => `<option value="${super_.id}">${super_.name}</option>`).join('');
        
        // Estimator dropdown
        const estimatorSelect = document.getElementById('prospect-estimator');
        const estimators = stakeholders.filter(s => s.role === 'Estimator');
        estimatorSelect.innerHTML = '<option value="">Select Estimator</option>' +
            estimators.map(est => `<option value="${est.id}">${est.name}</option>`).join('');
        
        // Communication project dropdown
        const commProjectSelect = document.getElementById('comm-project');
        commProjectSelect.innerHTML = '<option value="">Select Project</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        // Communication stakeholder dropdown
        const commStakeholderSelect = document.getElementById('comm-stakeholder');
        commStakeholderSelect.innerHTML = '<option value="">Select Stakeholder</option>' +
            stakeholders.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
        
        // Filter dropdowns
        const projectFilter = document.getElementById('project-filter');
        projectFilter.innerHTML = '<option value="">All Projects</option>' +
            projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        
        // Email recipient dropdowns
        const recipientStakeholderSelect = document.getElementById('recipient-stakeholder');
        // Show all stakeholders, not just those who currently receive emails
        recipientStakeholderSelect.innerHTML = '<option value="">Select Stakeholder</option>' +
            stakeholders.map(s => `<option value="${s.id}">${s.name} (${s.role})</option>`).join('');
        
        const recipientProjectsSelect = document.getElementById('recipient-projects');
        recipientProjectsSelect.innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }

    // Microsoft 365 Management
    loadMicrosoft365Status() {
        // Load Microsoft 365 status using the global function
        if (typeof window.loadMicrosoft365Status === 'function') {
            window.loadMicrosoft365Status();
        }
    }

    // Modal Management
    showAddProjectModal() {
        // Populate project manager and superintendent dropdowns
        this.populateDropdowns();
        document.getElementById('add-project-modal').style.display = 'block';
    }

    showAddCommunicationModal() {
        // Populate project and stakeholder dropdowns
        this.populateDropdowns();
        document.getElementById('add-communication-modal').style.display = 'block';
    }

    showAddProspectModal() {
        // Populate estimator dropdown
        this.populateDropdowns();
        document.getElementById('add-prospect-modal').style.display = 'block';
    }

    showAddStakeholderModal() {
        document.getElementById('add-stakeholder-modal').style.display = 'block';
    }

    showAddRecipientModal() {
        // Populate stakeholder dropdown with current stakeholders who receive emails
        this.populateDropdowns();
        document.getElementById('add-recipient-modal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Action Handlers
    markCompleted(communicationId) {
        dataManager.updateCommunication(communicationId, { status: 'completed' });
        this.showNotification('Communication marked as completed!', 'success');
        this.loadCommunications();
        this.loadDashboard();
    }

    deleteCommunication(communicationId) {
        if (confirm('Are you sure you want to delete this communication?')) {
            dataManager.deleteCommunication(communicationId);
            this.showNotification('Communication deleted!', 'success');
            this.loadCommunications();
            this.loadDashboard();
        }
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This will also delete all related communications.')) {
            dataManager.deleteProject(projectId);
            this.showNotification('Project deleted!', 'success');
            this.loadProjects();
            this.loadDashboard();
            this.populateDropdowns();
        }
    }

    deleteProspect(prospectId) {
        if (confirm('Are you sure you want to delete this prospect?')) {
            dataManager.deleteProspect(prospectId);
            this.showNotification('Prospect deleted!', 'success');
            this.loadProspects();
        }
    }

    deleteStakeholder(stakeholderId) {
        if (confirm('Are you sure you want to delete this stakeholder?')) {
            dataManager.deleteStakeholder(stakeholderId);
            this.showNotification('Stakeholder deleted!', 'success');
            this.loadStakeholders();
            this.populateDropdowns();
        }
    }

    deleteEmailRecipient(recipientId) {
        if (confirm('Are you sure you want to remove this email recipient?')) {
            // Get the recipient before deleting to check stakeholder
            const recipients = dataManager.getEmailRecipients();
            const recipientToDelete = recipients.find(r => r.id === recipientId);
            
            dataManager.deleteEmailRecipient(recipientId);
            
            // Check if this stakeholder has any other email recipients
            if (recipientToDelete) {
                const remainingRecipients = dataManager.getEmailRecipients();
                const hasOtherRecipients = remainingRecipients.some(r => r.stakeholderId === recipientToDelete.stakeholderId);
                
                // If no other recipients for this stakeholder, set receivesEmails to false
                if (!hasOtherRecipients) {
                    dataManager.updateStakeholder(recipientToDelete.stakeholderId, { receivesEmails: false });
                    this.loadStakeholders(); // Refresh stakeholders list
                }
            }
            
            this.showNotification('Email recipient removed!', 'success');
            this.loadEmailRecipients();
        }
    }

    // Settings
    saveSettings() {
        const settings = {
            autoSendEnabled: document.getElementById('auto-send-enabled').checked,
            sendTime: document.getElementById('send-time').value,
            emailSignature: document.getElementById('email-signature').value,
            companyName: 'Your Construction Company',
            yourName: 'Project Engineer'
        };
        
        dataManager.saveSettings(settings);
        this.showNotification('Settings saved!', 'success');
    }

    // Notifications
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Auto-refresh
    setupAutoRefresh() {
        // Refresh dashboard every 5 minutes
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.loadDashboard();
            }
        }, 5 * 60 * 1000);
        
        // Check for 5pm email sending
        this.checkEmailTime();
        setInterval(() => this.checkEmailTime(), 60 * 1000); // Check every minute
    }

    checkEmailTime() {
        const settings = dataManager.getSettings();
        if (!settings.autoSendEnabled) return;
        
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        if (currentTime === settings.sendTime) {
            this.generateDailyEmails();
        }
    }

    // Utility
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
}

// Global functions for HTML onclick handlers
window.showTab = (tabName) => dashboard.showTab(tabName);
window.showAddProjectModal = () => dashboard.showAddProjectModal();
window.showAddCommunicationModal = () => dashboard.showAddCommunicationModal();
window.showAddProspectModal = () => dashboard.showAddProspectModal();
window.showAddStakeholderModal = () => dashboard.showAddStakeholderModal();
window.showAddRecipientModal = () => dashboard.showAddRecipientModal();
window.closeModal = (modalId) => dashboard.closeModal(modalId);
window.filterCommunications = () => dashboard.filterCommunications();
window.updateEmailPreview = () => dashboard.updateEmailPreview();
window.hideNotification = () => {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
};

// Microsoft 365 global functions
window.loadMicrosoft365Status = async () => {
    try {
        const response = await fetch('/api/microsoft365/status');
        const data = await response.json();
        
        const statusElement = document.getElementById('m365-status');
        const lastBackupElement = document.getElementById('last-backup');
        
        if (data.authenticated) {
            statusElement.textContent = 'Connected';
            statusElement.className = 'status connected';
            lastBackupElement.textContent = data.lastBackup || 'Never';
        } else {
            statusElement.textContent = 'Not Connected';
            statusElement.className = 'status disconnected';
            lastBackupElement.textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error loading Microsoft 365 status:', error);
        const statusElement = document.getElementById('m365-status');
        if (statusElement) {
            statusElement.textContent = 'Error';
            statusElement.className = 'status error';
        }
    }
};

window.testMicrosoft365Connection = async () => {
    const button = document.querySelector('button[onclick="testMicrosoft365Connection()"]');
    const originalText = button.textContent;
    
    try {
        button.textContent = 'Testing...';
        button.disabled = true;
        
        const response = await fetch('/api/microsoft365/test', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('Microsoft 365 connection successful!');
            loadMicrosoft365Status();
        } else {
            alert('Connection failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        alert('Connection test failed: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

window.backupToOneDrive = async () => {
    const button = document.querySelector('button[onclick="backupToOneDrive()"]');
    const originalText = button.textContent;
    
    try {
        button.textContent = 'Backing up...';
        button.disabled = true;
        
        const response = await fetch('/api/microsoft365/backup', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('Backup completed successfully!');
            loadMicrosoft365Status();
        } else {
            alert('Backup failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error during backup:', error);
        alert('Backup failed: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ConstructionDashboard();
    
    // Load Microsoft 365 status if on the Microsoft 365 tab
    const m365Tab = document.getElementById('microsoft365');
    if (m365Tab) {
        loadMicrosoft365Status();
    }
    
    // Update footer status indicators
    updateFooterStatus();
});

// Update footer status indicators
function updateFooterStatus() {
    // Update Microsoft 365 status in footer
    fetch('/api/microsoft365/status')
        .then(response => response.json())
        .then(data => {
            const footerM365Status = document.getElementById('footer-m365-status');
            const footerBackupStatus = document.getElementById('footer-backup-status');
            
            if (footerM365Status) {
                if (data.isAuthenticated) {
                    footerM365Status.className = 'status-indicator connected';
                    footerM365Status.title = 'Microsoft 365 Connected';
                } else {
                    footerM365Status.className = 'status-indicator disconnected';
                    footerM365Status.title = 'Microsoft 365 Not Connected';
                }
            }
            
            if (footerBackupStatus) {
                if (data.isAuthenticated && data.oneDriveEnabled) {
                    footerBackupStatus.className = 'status-indicator connected';
                    footerBackupStatus.title = 'Cloud Backup Active';
                } else {
                    footerBackupStatus.className = 'status-indicator warning';
                    footerBackupStatus.title = 'Cloud Backup Not Configured';
                }
            }
        })
        .catch(error => {
            console.error('Error updating footer status:', error);
            const footerM365Status = document.getElementById('footer-m365-status');
            const footerBackupStatus = document.getElementById('footer-backup-status');
            
            if (footerM365Status) {
                footerM365Status.className = 'status-indicator disconnected';
                footerM365Status.title = 'Microsoft 365 Error';
            }
            
            if (footerBackupStatus) {
                footerBackupStatus.className = 'status-indicator disconnected';
                footerBackupStatus.title = 'Cloud Backup Error';
            }
        });
}

