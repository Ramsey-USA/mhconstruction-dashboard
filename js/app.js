// Main Application JavaScript for Construction Dashboard
// Handles UI interactions, tab management, and form processing

class ConstructionDashboard {
    constructor() {
        console.log('🏗️ ConstructionDashboard constructor called');
        console.log('🔍 Window dashboard being set to:', this);
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        console.log('🔧 ConstructionDashboard init called');
        this.bindEvents();
        this.loadDashboard();
        this.populateDropdowns();
        this.setupAutoRefresh();
        console.log('✅ ConstructionDashboard init completed');
    }

    // Event Binding
    bindEvents() {
        // Form submissions - add null checks
        const addProjectForm = document.getElementById('add-project-form');
        if (addProjectForm) {
            addProjectForm.addEventListener('submit', (e) => this.handleAddProject(e));
        }
        
        const addCommunicationForm = document.getElementById('add-communication-form');
        if (addCommunicationForm) {
            addCommunicationForm.addEventListener('submit', (e) => this.handleAddCommunication(e));
        }
        
        const addProspectForm = document.getElementById('add-prospect-form');
        if (addProspectForm) {
            addProspectForm.addEventListener('submit', (e) => this.handleAddProspect(e));
        }
        
        const addStakeholderForm = document.getElementById('add-stakeholder-form');
        if (addStakeholderForm) {
            addStakeholderForm.addEventListener('submit', (e) => this.handleAddStakeholder(e));
        }
        
        const addRecipientForm = document.getElementById('add-recipient-form');
        if (addRecipientForm) {
            addRecipientForm.addEventListener('submit', (e) => this.handleAddEmailRecipient(e));
        }

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Settings changes - add null checks
        const autoSendEnabled = document.getElementById('auto-send-enabled');
        if (autoSendEnabled) {
            autoSendEnabled.addEventListener('change', (e) => this.saveSettings());
        }
        
        const sendTime = document.getElementById('send-time');
        if (sendTime) {
            sendTime.addEventListener('change', (e) => this.saveSettings());
        }
        
        const emailSignature = document.getElementById('email-signature');
        if (emailSignature) {
            emailSignature.addEventListener('change', (e) => this.saveSettings());
        }
    }

    // Tab Management
    showTab(tabName, clickedElement = null) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log(`Tab ${tabName} activated successfully`);
        } else {
            console.error(`Tab element with id '${tabName}' not found`);
        }
        
        // Add active class to clicked nav tab
        if (clickedElement) {
            clickedElement.classList.add('active');
            console.log('Active class added to clicked element');
        } else {
            // Fallback: find the nav tab by matching the onclick attribute
            const navTab = document.querySelector(`.nav-tab[onclick*="${tabName}"]`);
            if (navTab) {
                navTab.classList.add('active');
                console.log('Active class added via fallback method');
            }
        }
        
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
        console.log('📊 Loading dashboard...');
        await this.loadDashboardStats();
        this.loadCriticalAlerts();
        this.loadUpcomingDeadlines();
        this.loadRecentActivity();
    }

    async loadDashboardStats() {
        console.log('📈 Loading dashboard stats...');
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
        this.updateCommunicationsFilters();
        this.filterCommunications();
    }

    updateCommunicationsFilters() {
        const projects = dataManager.getProjects();
        const projectFilter = document.getElementById('project-filter');
        const currentProject = projectFilter.value;
        
        projectFilter.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            if (project.id === currentProject) option.selected = true;
            projectFilter.appendChild(option);
        });
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
        this.updateCommunicationsCounter(communications.length, dataManager.getCommunications().length);
    }

    filterProjectCommunications(projectId) {
        // Set the project filter and trigger filtering
        const projectFilter = document.getElementById('project-filter');
        if (projectFilter) {
            projectFilter.value = projectId;
            this.filterCommunications();
        }
    }

    updateCommunicationsCounter(filtered, total) {
        // Add or update communications counter
        let counter = document.querySelector('.communications-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'communications-counter';
            const filterSection = document.querySelector('.filters');
            filterSection.parentNode.insertBefore(counter, filterSection.nextSibling);
        }
        
        const overdueCount = dataManager.getCommunications().filter(c => dataManager.isOverdue(c.dueDate)).length;
        counter.innerHTML = `
            <i class="fas fa-comments"></i>
            Showing ${filtered} of ${total} communications
            ${overdueCount > 0 ? `<span style="color: #ffeb3b; margin-left: 1rem;"><i class="fas fa-exclamation-triangle"></i> ${overdueCount} overdue</span>` : ''}
        `;
    }

    displayCommunications(communications) {
        const projects = dataManager.getProjects();
        const stakeholders = dataManager.getStakeholders();
        const container = document.getElementById('communications-list');
        
        if (communications.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        // Sort by priority: overdue first, then by due date
        communications.sort((a, b) => {
            const aOverdue = dataManager.isOverdue(a.dueDate);
            const bOverdue = dataManager.isOverdue(b.dueDate);
            
            if (aOverdue && !bOverdue) return -1;
            if (!aOverdue && bOverdue) return 1;
            
            const aDate = new Date(a.dueDate || '9999-12-31');
            const bDate = new Date(b.dueDate || '9999-12-31');
            return aDate - bDate;
        });
        
        container.innerHTML = communications.map(comm => {
            const project = projects.find(p => p.id === comm.projectId);
            const stakeholder = stakeholders.find(s => s.id === comm.stakeholderId);
            const isOverdue = dataManager.isOverdue(comm.dueDate);
            const daysUntil = dataManager.getDaysUntilDue(comm.dueDate);
            
            // Determine urgency class
            let urgencyClass = '';
            if (isOverdue) {
                urgencyClass = 'overdue-priority';
            } else if (daysUntil !== null && daysUntil <= 3) {
                urgencyClass = 'urgent-priority';
            }
            
            return `
                <div class="communication-item comm-type-${comm.type.toLowerCase().replace(' ', '-')} ${urgencyClass}">
                    <div class="communication-header">
                        <div class="communication-title">
                            <h4>${comm.subject}</h4>
                            <div class="communication-meta">
                                <div class="communication-meta-item project-meta">
                                    <i class="fas fa-building"></i>
                                    <span>${project?.name || 'Unknown Project'}</span>
                                </div>
                                <div class="communication-meta-item stakeholder-meta">
                                    <i class="fas fa-user"></i>
                                    <span>${stakeholder?.name || 'Unknown Stakeholder'}</span>
                                </div>
                                <div class="communication-meta-item type-meta">
                                    <i class="fas fa-tag"></i>
                                    <span>${comm.type}</span>
                                </div>
                                ${comm.dueDate ? `
                                    <div class="communication-meta-item date-meta">
                                        <i class="fas fa-calendar${isOverdue ? '-times' : '-check'}"></i>
                                        <span>Due: ${dataManager.formatDate(comm.dueDate)}${daysUntil !== null ? ` (${daysUntil > 0 ? daysUntil + ' days' : 'today'})` : ''}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="communication-status-container">
                            <span class="type-badge">${comm.type}</span>
                            <span class="communication-status status-${isOverdue ? 'overdue' : comm.status.replace(' ', '-').toLowerCase()}">${isOverdue ? 'OVERDUE' : comm.status}</span>
                        </div>
                    </div>
                    ${comm.notes ? `<div class="communication-content">${comm.notes}</div>` : ''}
                    <div class="communication-actions">
                        <button class="btn btn-primary" onclick="dashboard.editCommunication('${comm.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${comm.status !== 'Completed' ? `
                            <button class="btn btn-success" onclick="dashboard.markCompleted('${comm.id}')">
                                <i class="fas fa-check"></i> Complete
                            </button>
                        ` : ''}
                        <button class="btn btn-info" onclick="dashboard.duplicateCommunication('${comm.id}')">
                            <i class="fas fa-copy"></i> Duplicate
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
                        <button class="btn btn-info" onclick="syncProspectToCalendar('${prospect.id}', 'walk')" title="Sync Walk Date to Outlook Calendar" ${!prospect.walkDate ? 'disabled' : ''}>
                            <i class="fas fa-calendar-plus"></i> Sync Walk
                        </button>
                        <button class="btn btn-info" onclick="syncProspectToCalendar('${prospect.id}', 'proposal')" title="Sync Proposal Due Date to Outlook Calendar" ${!prospect.proposalDueDate ? 'disabled' : ''}>
                            <i class="fas fa-calendar-check"></i> Sync Proposal
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
            const editId = e.target.dataset.editId;
            const project = {
                number: document.getElementById('project-number').value,
                name: document.getElementById('project-name').value,
                client: document.getElementById('project-client').value,
                projectManagerId: document.getElementById('project-manager').value,
                superintendentId: document.getElementById('project-superintendent').value,
                startDate: document.getElementById('project-start-date').value,
                endDate: document.getElementById('project-end-date').value,
                contractValue: parseFloat(document.getElementById('project-value').value) || 0,
                status: document.getElementById('project-status').value || 'active'
            };
            
            if (editId) {
                // Update existing project
                await dataManager.updateProject(editId, project);
                this.showNotification('Project updated successfully!', 'success');
                delete e.target.dataset.editId;
                document.querySelector('#add-project-modal h3').textContent = 'Add New Project';
            } else {
                // Add new project
                await dataManager.addProject(project);
                this.showNotification('Project added successfully!', 'success');
            }
            
            this.closeModal('add-project-modal');
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
            const editId = e.target.dataset.editId;
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
            
            if (editId) {
                // Update existing communication
                await dataManager.updateCommunication(editId, communication);
                this.showNotification('Communication updated successfully!', 'success');
                delete e.target.dataset.editId;
                document.querySelector('#add-communication-modal h3').textContent = 'Add New Communication';
            } else {
                // Add new communication
                await dataManager.addCommunication(communication);
                this.showNotification('Communication added successfully!', 'success');
            }
            
            this.closeModal('add-communication-modal');
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
            const editId = e.target.dataset.editId;
            const prospectData = {
                name: document.getElementById('prospect-name').value,
                client: document.getElementById('prospect-client').value,
                estimatorId: document.getElementById('prospect-estimator').value,
                walkDate: document.getElementById('prospect-walk-date').value,
                proposalDueDate: document.getElementById('prospect-proposal-date').value,
                estimatedValue: parseFloat(document.getElementById('prospect-value').value) || 0,
                probability: parseInt(document.getElementById('prospect-probability').value),
                notes: document.getElementById('prospect-notes').value,
                status: 'active'
            };
            
            if (editId) {
                // Update existing prospect
                await dataManager.updateProspect(editId, prospectData);
                this.showNotification('Prospect updated successfully!', 'success');
                delete e.target.dataset.editId;
                document.querySelector('#add-prospect-modal h3').textContent = 'Add New Prospect';
            } else {
                // Add new prospect
                await dataManager.addProspect(prospectData);
                this.showNotification('Prospect added successfully!', 'success');
            }
            
            this.closeModal('add-prospect-modal');
            this.loadProspects();
            e.target.reset();
        } catch (error) {
            console.error('Error adding/updating prospect:', error);
            this.showNotification('Failed to save prospect. Please try again.', 'error');
        }
    }

    async handleAddStakeholder(e) {
        e.preventDefault();
        
        try {
            const editId = e.target.dataset.editId;
            const stakeholder = {
                name: document.getElementById('stakeholder-name').value,
                role: document.getElementById('stakeholder-role').value,
                company: document.getElementById('stakeholder-company').value,
                email: document.getElementById('stakeholder-email').value,
                phone: document.getElementById('stakeholder-phone').value,
                receivesEmails: document.getElementById('stakeholder-receives-emails').checked
            };
            
            if (editId) {
                // Update existing stakeholder
                await dataManager.updateStakeholder(editId, stakeholder);
                this.showNotification('Stakeholder updated successfully!', 'success');
                delete e.target.dataset.editId;
                document.querySelector('#add-stakeholder-modal h3').textContent = 'Add New Stakeholder';
            } else {
                // Add new stakeholder
                await dataManager.addStakeholder(stakeholder);
                this.showNotification('Stakeholder added successfully!', 'success');
            }
            
            this.closeModal('add-stakeholder-modal');
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
            const editId = e.target.dataset.editId;
            const selectedProjects = Array.from(document.getElementById('recipient-projects').selectedOptions)
                .map(option => option.value);
            
            const stakeholderId = document.getElementById('recipient-stakeholder').value;
            
            const recipient = {
                stakeholderId: stakeholderId,
                projectIds: selectedProjects,
                sendTime: document.getElementById('recipient-send-time').value,
                frequency: document.getElementById('recipient-frequency').value
            };
            
            if (editId) {
                // Update existing recipient
                await dataManager.updateEmailRecipient(editId, recipient);
                this.showNotification('Email recipient updated successfully!', 'success');
                delete e.target.dataset.editId;
                document.querySelector('#add-recipient-modal h3').textContent = 'Add New Email Recipient';
            } else {
                // Add new recipient
                await dataManager.addEmailRecipient(recipient);
                this.showNotification('Email recipient added successfully!', 'success');
                
                // Update the stakeholder to indicate they now receive emails
                const stakeholder = dataManager.getStakeholders().find(s => s.id === stakeholderId);
                if (stakeholder && !stakeholder.receivesEmails) {
                    await dataManager.updateStakeholder(stakeholderId, { receivesEmails: true });
                }
            }
            
            this.closeModal('add-recipient-modal');
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

    // Project CRUD operations
    editProject(projectId) {
        const project = dataManager.getProjects().find(p => p.id === projectId);
        if (project) {
            // Populate the form with existing data
            document.getElementById('project-number').value = project.number;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-client').value = project.client;
            document.getElementById('project-manager').value = project.projectManagerId || '';
            document.getElementById('project-superintendent').value = project.superintendentId || '';
            document.getElementById('project-start-date').value = project.startDate;
            document.getElementById('project-end-date').value = project.endDate;
            document.getElementById('project-value').value = project.contractValue;
            document.getElementById('project-status').value = project.status;
            
            // Store the ID for updating
            document.getElementById('add-project-form').dataset.editId = projectId;
            document.querySelector('#add-project-modal h3').textContent = 'Edit Project';
            
            this.showAddProjectModal();
        }
    }

    viewProjectDetails(projectId) {
        const project = dataManager.getProjects().find(p => p.id === projectId);
        if (!project) {
            this.showNotification('Project not found', 'error');
            return;
        }

        const stakeholders = dataManager.getStakeholders();
        const communications = dataManager.getCommunications().filter(c => c.projectId === projectId);
        const pm = stakeholders.find(s => s.id === project.projectManagerId);
        const super_ = stakeholders.find(s => s.id === project.superintendentId);
        
        // Calculate project statistics
        const overdueComms = communications.filter(c => dataManager.isOverdue(c.dueDate));
        const pendingComms = communications.filter(c => c.status === 'Pending' || c.status === 'In Progress');
        const completedComms = communications.filter(c => c.status === 'Completed');
        
        // Group communications by type
        const commsByType = {
            'RFI': communications.filter(c => c.type === 'RFI'),
            'Submittal': communications.filter(c => c.type === 'Submittal'),
            'Change Order': communications.filter(c => c.type === 'Change Order'),
            'Lien Release': communications.filter(c => c.type === 'Lien Release'),
            'General': communications.filter(c => c.type === 'General')
        };

        // Create detailed view content
        const detailsHTML = `
            <div class="project-details-modal">
                <div class="project-details-header">
                    <div class="project-title">
                        <h2>${project.name}</h2>
                        <p>Project #${project.number} • ${project.client}</p>
                        <span class="project-status status-${project.status}">${project.status}</span>
                    </div>
                </div>
                
                <div class="project-details-grid">
                    <div class="project-info-section">
                        <h3><i class="fas fa-info-circle"></i> Project Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Project Manager:</label>
                                <span>${pm?.name || 'Unassigned'}</span>
                            </div>
                            <div class="info-item">
                                <label>Superintendent:</label>
                                <span>${super_?.name || 'Unassigned'}</span>
                            </div>
                            <div class="info-item">
                                <label>Start Date:</label>
                                <span>${dataManager.formatDate(project.startDate)}</span>
                            </div>
                            <div class="info-item">
                                <label>End Date:</label>
                                <span>${dataManager.formatDate(project.endDate)}</span>
                            </div>
                            <div class="info-item">
                                <label>Contract Value:</label>
                                <span>$${(project.contractValue || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-stats-section">
                        <h3><i class="fas fa-chart-bar"></i> Communication Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number">${communications.length}</div>
                                <div class="stat-label">Total Communications</div>
                            </div>
                            <div class="stat-item overdue">
                                <div class="stat-number">${overdueComms.length}</div>
                                <div class="stat-label">Overdue Items</div>
                            </div>
                            <div class="stat-item pending">
                                <div class="stat-number">${pendingComms.length}</div>
                                <div class="stat-label">Pending Items</div>
                            </div>
                            <div class="stat-item completed">
                                <div class="stat-number">${completedComms.length}</div>
                                <div class="stat-label">Completed Items</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="project-communications-section">
                        <h3><i class="fas fa-comments"></i> Communications by Type</h3>
                        <div class="comm-types-grid">
                            ${Object.entries(commsByType).map(([type, comms]) => `
                                <div class="comm-type-summary">
                                    <div class="comm-type-header">
                                        <span class="comm-type-name">${type}</span>
                                        <span class="comm-type-count">${comms.length}</span>
                                    </div>
                                    ${comms.length > 0 ? `
                                        <div class="comm-type-breakdown">
                                            <small>
                                                ${comms.filter(c => c.status === 'Completed').length} completed, 
                                                ${comms.filter(c => c.status === 'Pending' || c.status === 'In Progress').length} pending,
                                                ${comms.filter(c => dataManager.isOverdue(c.dueDate)).length} overdue
                                            </small>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${overdueComms.length > 0 ? `
                        <div class="project-alerts-section">
                            <h3><i class="fas fa-exclamation-triangle"></i> Overdue Items</h3>
                            <div class="overdue-items-list">
                                ${overdueComms.slice(0, 5).map(comm => {
                                    const stakeholder = stakeholders.find(s => s.id === comm.stakeholderId);
                                    return `
                                        <div class="overdue-item">
                                            <div class="overdue-content">
                                                <strong>${comm.type}: ${comm.subject}</strong>
                                                <p>Assigned to: ${stakeholder?.name || 'Unknown'}</p>
                                                <p>Due: ${dataManager.formatDate(comm.dueDate)} (${Math.abs(dataManager.getDaysUntilDue(comm.dueDate))} days overdue)</p>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${overdueComms.length > 5 ? `<p><small>... and ${overdueComms.length - 5} more overdue items</small></p>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="project-details-actions">
                    <button class="btn btn-secondary" onclick="dashboard.editProject('${projectId}')">
                        <i class="fas fa-edit"></i> Edit Project
                    </button>
                    <button class="btn btn-primary" onclick="dashboard.showTab('communications', null); dashboard.filterProjectCommunications('${projectId}')">
                        <i class="fas fa-comments"></i> View All Communications
                    </button>
                    <button class="btn btn-info" onclick="dashboard.exportProjectReport('${projectId}')">
                        <i class="fas fa-file-excel"></i> Export Report
                    </button>
                </div>
            </div>
        `;

        // Create and show the modal
        let modal = document.getElementById('project-details-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'project-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3>Project Details</h3>
                        <span class="close" onclick="dashboard.closeModal('project-details-modal')">&times;</span>
                    </div>
                    <div class="modal-body" id="project-details-body">
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        document.getElementById('project-details-body').innerHTML = detailsHTML;
        modal.style.display = 'block';
    }

    deleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            dataManager.deleteProject(projectId);
            this.showNotification('Project deleted successfully!', 'success');
            this.loadProjects();
            this.loadDashboard();
        }
    }

    // Communication CRUD operations
    editCommunication(communicationId) {
        const communication = dataManager.getCommunications().find(c => c.id === communicationId);
        if (communication) {
            document.getElementById('comm-project').value = communication.projectId;
            document.getElementById('comm-stakeholder').value = communication.stakeholderId;
            document.getElementById('comm-type').value = communication.type;
            document.getElementById('comm-subject').value = communication.subject;
            document.getElementById('comm-notes').value = communication.notes || '';
            document.getElementById('comm-priority').value = communication.priority;
            document.getElementById('comm-status').value = communication.status;
            document.getElementById('comm-due-date').value = communication.dueDate;
            
            document.getElementById('add-communication-form').dataset.editId = communicationId;
            document.querySelector('#add-communication-modal h3').textContent = 'Edit Communication';
            
            this.showAddCommunicationModal();
        }
    }

    deleteCommunication(communicationId) {
        if (confirm('Are you sure you want to delete this communication?')) {
            dataManager.deleteCommunication(communicationId);
            this.showNotification('Communication deleted successfully!', 'success');
            this.loadCommunications();
            this.loadDashboard();
        }
    }

    duplicateCommunication(communicationId) {
        const communication = dataManager.getCommunications().find(c => c.id === communicationId);
        if (communication) {
            const duplicate = {
                ...communication,
                id: 'comm_' + Date.now(),
                subject: communication.subject + ' (Copy)',
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            dataManager.addCommunication(duplicate);
            this.showNotification('Communication duplicated successfully!', 'success');
            this.loadCommunications();
        }
    }

    // Prospect CRUD operations
    editProspect(prospectId) {
        const prospect = dataManager.getProspects().find(p => p.id === prospectId);
        if (prospect) {
            document.getElementById('prospect-name').value = prospect.name;
            document.getElementById('prospect-client').value = prospect.client;
            document.getElementById('prospect-estimator').value = prospect.estimatorId || '';
            document.getElementById('prospect-walk-date').value = prospect.walkDate;
            document.getElementById('prospect-proposal-date').value = prospect.proposalDueDate;
            document.getElementById('prospect-value').value = prospect.estimatedValue;
            document.getElementById('prospect-probability').value = prospect.probability;
            document.getElementById('prospect-notes').value = prospect.notes || '';
            
            document.getElementById('add-prospect-form').dataset.editId = prospectId;
            document.querySelector('#add-prospect-modal h3').textContent = 'Edit Prospect';
            
            this.showAddProspectModal();
        }
    }

    deleteProspect(prospectId) {
        if (confirm('Are you sure you want to delete this prospect?')) {
            dataManager.deleteProspect(prospectId);
            this.showNotification('Prospect deleted successfully!', 'success');
            this.loadProspects();
        }
    }

    // Stakeholder CRUD operations
    editStakeholder(stakeholderId) {
        const stakeholder = dataManager.getStakeholders().find(s => s.id === stakeholderId);
        if (stakeholder) {
            document.getElementById('stakeholder-name').value = stakeholder.name;
            document.getElementById('stakeholder-role').value = stakeholder.role;
            document.getElementById('stakeholder-company').value = stakeholder.company;
            document.getElementById('stakeholder-email').value = stakeholder.email;
            document.getElementById('stakeholder-phone').value = stakeholder.phone;
            document.getElementById('stakeholder-receives-emails').checked = stakeholder.receivesEmails;
            
            document.getElementById('add-stakeholder-form').dataset.editId = stakeholderId;
            document.querySelector('#add-stakeholder-modal h3').textContent = 'Edit Stakeholder';
            
            this.showAddStakeholderModal();
        }
    }

    deleteStakeholder(stakeholderId) {
        if (confirm('Are you sure you want to delete this stakeholder?')) {
            dataManager.deleteStakeholder(stakeholderId);
            this.showNotification('Stakeholder deleted successfully!', 'success');
            this.loadStakeholders();
            this.populateDropdowns();
        }
    }

    // Email recipient CRUD operations
    editEmailRecipient(recipientId) {
        const recipient = dataManager.getEmailRecipients().find(r => r.id === recipientId);
        if (recipient) {
            document.getElementById('recipient-stakeholder').value = recipient.stakeholderId;
            document.getElementById('recipient-send-time').value = recipient.sendTime;
            document.getElementById('recipient-frequency').value = recipient.frequency;
            
            // Handle project IDs (assuming checkboxes or multi-select)
            const projectCheckboxes = document.querySelectorAll('input[name="recipient-projects"]');
            projectCheckboxes.forEach(checkbox => {
                checkbox.checked = recipient.projectIds.includes(checkbox.value);
            });
            
            document.getElementById('add-recipient-form').dataset.editId = recipientId;
            document.querySelector('#add-recipient-modal h3').textContent = 'Edit Email Recipient';
            
            this.showAddRecipientModal();
        }
    }

    deleteEmailRecipient(recipientId) {
        if (confirm('Are you sure you want to delete this email recipient?')) {
            dataManager.deleteEmailRecipient(recipientId);
            this.showNotification('Email recipient deleted successfully!', 'success');
            this.loadEmailRecipients();
        }
    }

    duplicateCommunication(communicationId) {
        const communications = dataManager.getCommunications();
        const comm = communications.find(c => c.id === communicationId);
        
        if (comm) {
            const duplicateComm = {
                ...comm,
                id: dataManager.generateId(),
                subject: comm.subject + ' (Copy)',
                status: 'Pending',
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            
            communications.push(duplicateComm);
            dataManager.saveCommunications(communications);
            this.showNotification('Communication duplicated successfully!', 'success');
            this.loadCommunications();
        }
    }

    clearCommunicationFilters() {
        document.getElementById('project-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('status-filter').value = '';
        this.filterCommunications();
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

    editProspect(prospectId) {
        const prospects = dataManager.getProspects();
        const prospect = prospects.find(p => p.id === prospectId);
        
        if (!prospect) {
            this.showNotification('Prospect not found', 'error');
            return;
        }

        // Populate edit form with existing data
        document.getElementById('prospect-name').value = prospect.name || '';
        document.getElementById('prospect-client').value = prospect.client || '';
        document.getElementById('prospect-estimator').value = prospect.estimatorId || '';
        document.getElementById('prospect-walk-date').value = prospect.walkDate || '';
        document.getElementById('prospect-due-date').value = prospect.proposalDueDate || '';
        document.getElementById('prospect-value').value = prospect.estimatedValue || '';
        document.getElementById('prospect-probability').value = prospect.probability || '';
        document.getElementById('prospect-notes').value = prospect.notes || '';

        // Change form to edit mode
        const modal = document.getElementById('add-prospect-modal');
        const modalTitle = modal.querySelector('.modal-header h3');
        const submitButton = modal.querySelector('button[type="submit"]');
        
        modalTitle.textContent = 'Edit Prospect';
        submitButton.textContent = 'Update Prospect';
        
        // Store the prospect ID for the update operation
        modal.dataset.editingProspectId = prospectId;
        
        this.openModal('add-prospect-modal');
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

    // Project report export
    exportProjectReport(projectId) {
        const project = dataManager.getProjects().find(p => p.id === projectId);
        if (!project) {
            this.showNotification('Project not found', 'error');
            return;
        }

        // Use the existing excel export functionality but filter for specific project
        if (typeof exportToExcel === 'function') {
            // Temporarily filter data to only this project
            const originalGetProjects = dataManager.getProjects;
            const originalGetCommunications = dataManager.getCommunications;
            
            // Override methods to return only this project's data
            dataManager.getProjects = () => [project];
            dataManager.getCommunications = () => originalGetCommunications.call(dataManager).filter(c => c.projectId === projectId);
            
            // Export the filtered data
            exportToExcel();
            
            // Restore original methods
            dataManager.getProjects = originalGetProjects;
            dataManager.getCommunications = originalGetCommunications;
            
            this.showNotification('Project report exported successfully!', 'success');
        } else {
            this.showNotification('Export functionality not available', 'error');
        }
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
window.clearCommunicationFilters = () => dashboard.clearCommunicationFilters();
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

window.listOneDriveBackups = async () => {
    const button = document.querySelector('button[onclick="listOneDriveBackups()"]');
    const originalText = button.textContent;
    
    try {
        button.textContent = 'Loading...';
        button.disabled = true;
        
        const response = await fetch('/api/microsoft365/backups');
        const data = await response.json();
        
        if (data.success && data.backups && data.backups.length > 0) {
            let backupList = 'Available backups:\n\n';
            data.backups.forEach((backup, index) => {
                backupList += `${index + 1}. ${backup.name} (${backup.lastModified})\n`;
            });
            alert(backupList);
        } else {
            alert('No backups found in OneDrive');
        }
    } catch (error) {
        console.error('Error listing backups:', error);
        alert('Failed to list backups: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

window.testOutlookIntegration = async () => {
    const button = document.querySelector('button[onclick="testOutlookIntegration()"]');
    const originalText = button.textContent;
    
    try {
        button.textContent = 'Testing...';
        button.disabled = true;
        
        const response = await fetch('/api/microsoft365/test-outlook', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('Outlook integration successful! Test calendar event created.');
        } else {
            alert('Outlook test failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error testing Outlook:', error);
        alert('Outlook test failed: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
};

window.openAdminConsentUrl = async () => {
    try {
        const response = await fetch('/api/microsoft365/admin-consent-url');
        const data = await response.json();
        
        if (data.success && data.url) {
            window.open(data.url, '_blank');
        } else {
            alert('Failed to get admin consent URL: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error getting admin consent URL:', error);
        alert('Failed to open admin consent: ' + error.message);
    }
};

// Outlook Calendar Integration Functions
window.syncProspectToCalendar = async (prospectId, dateType) => {
    try {
        const prospects = dataManager.getProspects();
        const prospect = prospects.find(p => p.id === prospectId);
        
        if (!prospect) {
            alert('Prospect not found');
            return;
        }

        let eventData;
        
        if (dateType === 'walk') {
            eventData = {
                subject: `Walk-through: ${prospect.name}`,
                description: `
                    <p><strong>Project:</strong> ${prospect.name}</p>
                    <p><strong>Client:</strong> ${prospect.client}</p>
                    <p><strong>Estimated Value:</strong> $${(prospect.estimatedValue || 0).toLocaleString()}</p>
                    <p><strong>Win Probability:</strong> ${prospect.probability}%</p>
                    ${prospect.notes ? `<p><strong>Notes:</strong> ${prospect.notes}</p>` : ''}
                    <p><em>Automatically created from Construction Dashboard</em></p>
                `,
                startTime: new Date(prospect.walkDate + 'T09:00:00').toISOString(),
                endTime: new Date(prospect.walkDate + 'T11:00:00').toISOString(),
                location: prospect.client + ' Site',
                reminderMinutes: 60 // 1 hour reminder
            };
        } else if (dateType === 'proposal') {
            eventData = {
                subject: `Proposal Due: ${prospect.name}`,
                description: `
                    <p><strong>Project:</strong> ${prospect.name}</p>
                    <p><strong>Client:</strong> ${prospect.client}</p>
                    <p><strong>Estimated Value:</strong> $${(prospect.estimatedValue || 0).toLocaleString()}</p>
                    <p><strong>Win Probability:</strong> ${prospect.probability}%</p>
                    <p><strong>Walk Date:</strong> ${dataManager.formatDate(prospect.walkDate)}</p>
                    ${prospect.notes ? `<p><strong>Notes:</strong> ${prospect.notes}</p>` : ''}
                    <p><em>Automatically created from Construction Dashboard</em></p>
                `,
                startTime: new Date(prospect.proposalDueDate + 'T08:00:00').toISOString(),
                endTime: new Date(prospect.proposalDueDate + 'T09:00:00').toISOString(),
                location: 'Office',
                reminderMinutes: 24 * 60 // 24 hour reminder (1 day)
            };
        }

        const response = await fetch('/api/microsoft365/calendar-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();
        
        if (result.success) {
            dashboard.showNotification(`${dateType === 'walk' ? 'Walk-through' : 'Proposal due'} event added to Outlook calendar!`, 'success');
        } else {
            dashboard.showNotification(`Failed to create calendar event: ${result.error || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error syncing to calendar:', error);
        dashboard.showNotification('Error syncing to calendar: ' + error.message, 'error');
    }
};

window.syncAllProspectDates = async () => {
    const button = document.querySelector('button[onclick="syncAllProspectDates()"]');
    if (button) {
        const originalText = button.textContent;
        button.textContent = 'Syncing...';
        button.disabled = true;
        
        try {
            const prospects = dataManager.getProspects();
            let syncCount = 0;
            let errorCount = 0;
            
            for (const prospect of prospects) {
                try {
                    // Sync walk date
                    if (prospect.walkDate) {
                        await syncProspectToCalendar(prospect.id, 'walk');
                        syncCount++;
                    }
                    
                    // Sync proposal due date
                    if (prospect.proposalDueDate) {
                        await syncProspectToCalendar(prospect.id, 'proposal');
                        syncCount++;
                    }
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } catch (error) {
                    console.error(`Error syncing prospect ${prospect.name}:`, error);
                    errorCount++;
                }
            }
            
            if (errorCount === 0) {
                dashboard.showNotification(`Successfully synced ${syncCount} calendar events!`, 'success');
            } else {
                dashboard.showNotification(`Synced ${syncCount} events with ${errorCount} errors. Check console for details.`, 'warning');
            }
            
        } catch (error) {
            console.error('Error during bulk sync:', error);
            dashboard.showNotification('Error during bulk sync: ' + error.message, 'error');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
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
}

// Global Functions for Email Management
function showCreateEmailModal() {
    const modal = document.getElementById('create-email-modal');
    if (modal) {
        modal.style.display = 'block';
        populateEmailModal();
    }
}

function populateEmailModal() {
    // Populate projects
    const projects = dataManager.getProjects();
    const projectContainer = document.getElementById('project-selection');
    if (projectContainer) {
        projectContainer.innerHTML = projects.map(project => `
            <label>
                <input type="checkbox" value="${project.id}" name="project"> 
                ${project.name} (${project.number})
            </label>
        `).join('');
    }

    // Populate stakeholders
    const stakeholders = dataManager.getStakeholders();
    const stakeholderContainer = document.getElementById('stakeholder-selection');
    if (stakeholderContainer) {
        stakeholderContainer.innerHTML = stakeholders.map(stakeholder => `
            <label>
                <input type="checkbox" value="${stakeholder.id}" name="stakeholder"> 
                ${stakeholder.name} (${stakeholder.email || 'No email'})
            </label>
        `).join('');
    }

    // Set default dates
    const today = new Date();
    document.getElementById('date-from').value = today.toISOString().split('T')[0];
    document.getElementById('date-to').value = today.toISOString().split('T')[0];

    // Handle date range changes
    document.getElementById('date-range').addEventListener('change', function() {
        const customRange = document.getElementById('custom-date-range');
        if (this.value === 'custom') {
            customRange.style.display = 'block';
        } else {
            customRange.style.display = 'none';
        }
    });
}

function updateEmailType() {
    const emailType = document.getElementById('email-type').value;
    const subjectField = document.getElementById('email-subject');
    
    // Update placeholder subject based on type
    const subjectMap = {
        daily: 'Daily Project Update - [Date]',
        weekly: 'Weekly Project Report - Week of [Date]',
        urgent: 'URGENT: Items Requiring Immediate Attention',
        project: 'Project Status Summary - [Date]',
        custom: 'Custom Email Subject'
    };
    
    subjectField.placeholder = subjectMap[emailType] || 'Email Subject';
    
    // Update content checkboxes based on type
    if (emailType === 'urgent') {
        document.getElementById('include-urgent').checked = true;
        document.getElementById('include-due-soon').checked = false;
        document.getElementById('include-completed').checked = false;
        document.getElementById('include-new').checked = false;
    } else if (emailType === 'project') {
        document.getElementById('include-project-health').checked = true;
    }
    
    // Update preview
    previewEmail();
}

function previewEmail() {
    try {
        // Get selected options
        const selectedProjects = Array.from(document.querySelectorAll('input[name="project"]:checked')).map(cb => cb.value);
        const selectedStakeholders = Array.from(document.querySelectorAll('input[name="stakeholder"]:checked')).map(cb => cb.value);
        
        if (selectedProjects.length === 0 || selectedStakeholders.length === 0) {
            document.getElementById('email-composition-preview').innerHTML = 
                '<p style="color: var(--text-muted);">Please select at least one project and one stakeholder to preview the email.</p>';
            return;
        }

        const options = {
            emailType: document.getElementById('email-type').value,
            dateRange: document.getElementById('date-range').value,
            selectedProjects: selectedProjects,
            selectedStakeholders: selectedStakeholders.slice(0, 1), // Preview for first stakeholder only
            includeUrgent: document.getElementById('include-urgent').checked,
            includeDueSoon: document.getElementById('include-due-soon').checked,
            includeCompleted: document.getElementById('include-completed').checked,
            includeNew: document.getElementById('include-new').checked,
            includeProjectHealth: document.getElementById('include-project-health').checked,
            additionalMessage: document.getElementById('additional-message').value,
            customSubject: document.getElementById('email-subject').value
        };

        const emails = emailManager.createProjectEmail(options);
        
        if (emails.length > 0) {
            const previewContent = `Subject: ${emails[0].subject}\n\n${emails[0].content}`;
            document.getElementById('email-composition-preview').innerHTML = `<pre>${previewContent}</pre>`;
        } else {
            document.getElementById('email-composition-preview').innerHTML = 
                '<p style="color: var(--danger-color);">Error generating email preview. Please check your selections.</p>';
        }
    } catch (error) {
        console.error('Preview error:', error);
        document.getElementById('email-composition-preview').innerHTML = 
            '<p style="color: var(--danger-color);">Error generating email preview.</p>';
    }
}

function createDailyUpdate() {
    showCreateEmailModal();
    document.getElementById('email-type').value = 'daily';
    document.getElementById('date-range').value = 'today';
    updateEmailType();
}

function createWeeklyReport() {
    showCreateEmailModal();
    document.getElementById('email-type').value = 'weekly';
    document.getElementById('date-range').value = 'this-week';
    updateEmailType();
}

function createUrgentAlert() {
    showCreateEmailModal();
    document.getElementById('email-type').value = 'urgent';
    document.getElementById('date-range').value = 'today';
    updateEmailType();
}

function createProjectSummary() {
    showCreateEmailModal();
    document.getElementById('email-type').value = 'project';
    document.getElementById('date-range').value = 'this-week';
    updateEmailType();
}

// Enhanced email form handler
document.getElementById('create-email-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    try {
        const selectedProjects = Array.from(document.querySelectorAll('input[name="project"]:checked')).map(cb => cb.value);
        const selectedStakeholders = Array.from(document.querySelectorAll('input[name="stakeholder"]:checked')).map(cb => cb.value);
        
        if (selectedProjects.length === 0) {
            dashboard.showNotification('Please select at least one project.', 'warning');
            return;
        }
        
        if (selectedStakeholders.length === 0) {
            dashboard.showNotification('Please select at least one stakeholder.', 'warning');
            return;
        }

        const options = {
            emailType: document.getElementById('email-type').value,
            dateRange: document.getElementById('date-range').value,
            selectedProjects: selectedProjects,
            selectedStakeholders: selectedStakeholders,
            includeUrgent: document.getElementById('include-urgent').checked,
            includeDueSoon: document.getElementById('include-due-soon').checked,
            includeCompleted: document.getElementById('include-completed').checked,
            includeNew: document.getElementById('include-new').checked,
            includeProjectHealth: document.getElementById('include-project-health').checked,
            additionalMessage: document.getElementById('additional-message').value,
            customSubject: document.getElementById('email-subject').value
        };

        const emails = emailManager.createProjectEmail(options);
        
        if (emails.length > 0) {
            // Open emails in Outlook
            emails.forEach(email => {
                emailManager.openOutlookEmail(email.to, email.content, email.stakeholderName, email.subject);
            });
            
            dashboard.showNotification(`${emails.length} email(s) prepared in Outlook!`, 'success');
            closeModal('create-email-modal');
        } else {
            dashboard.showNotification('No emails were generated. Please check your selections.', 'warning');
        }
    } catch (error) {
        console.error('Email creation error:', error);
        dashboard.showNotification('Error creating emails. Please try again.', 'error');
    }
});
