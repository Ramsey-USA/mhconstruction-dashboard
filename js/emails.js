// Email Generation and Management for Construction Dashboard
// Handles daily status email generation and Outlook integration

class EmailManager {
    constructor() {
        this.settings = dataManager.getSettings();
    }

    // Generate daily emails for all recipients
    generateDailyEmails() {
        try {
            const recipients = dataManager.getEmailRecipients();
            const stakeholders = dataManager.getStakeholders();
            
            if (recipients.length === 0) {
                dashboard.showNotification('No email recipients configured. Please add recipients in the Email Setup tab.', 'warning');
                return;
            }
            
            let emailsGenerated = 0;
            
            recipients.forEach(recipient => {
                const stakeholder = stakeholders.find(s => s.id === recipient.stakeholderId);
                if (stakeholder && stakeholder.email) {
                    const emailContent = this.generateEmailContent(recipient.id);
                    this.openOutlookEmail(stakeholder.email, emailContent, stakeholder.name);
                    emailsGenerated++;
                }
            });
            
            dashboard.showNotification(`${emailsGenerated} daily status emails prepared in Outlook!`, 'success');
            
        } catch (error) {
            console.error('Email generation error:', error);
            dashboard.showNotification('Error generating daily emails', 'error');
        }
    }

    // Generate email content for specific recipient
    generateEmailContent(recipientId) {
        const recipient = dataManager.getEmailRecipients().find(r => r.id === recipientId);
        const stakeholder = dataManager.getStakeholders().find(s => s.id === recipient.stakeholderId);
        const projects = dataManager.getProjects().filter(p => recipient.projectIds.includes(p.id));
        const settings = dataManager.getSettings();
        
        if (!recipient || !stakeholder) {
            return 'Error: Recipient or stakeholder not found.';
        }
        
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Get all communications for recipient's projects
        const allCommunications = dataManager.getCommunications()
            .filter(c => recipient.projectIds.includes(c.projectId));
        
        // Categorize communications
        const urgentItems = this.getUrgentItems(allCommunications);
        const dueThisWeek = this.getDueThisWeek(allCommunications);
        const completedToday = this.getCompletedToday(allCommunications);
        const actionItems = this.generateActionItems(urgentItems, dueThisWeek, stakeholder);
        const projectSummary = this.generateProjectSummary(projects, allCommunications);
        
        // Build email content
        let emailContent = '';
        
        // Subject line
        const subject = `Daily Project Status - ${stakeholder.name} - ${today.toLocaleDateString()}`;
        
        // Email body
        emailContent += `Subject: ${subject}\n\n`;
        emailContent += `Hi ${stakeholder.name},\n\n`;
        emailContent += `Here's your daily project status update as of 5:00 PM on ${dateStr}:\n\n`;
        
        // Urgent items section
        if (urgentItems.length > 0) {
            emailContent += `🔴 URGENT - Requires Immediate Attention:\n`;
            urgentItems.forEach(item => {
                const project = dataManager.getProjects().find(p => p.id === item.projectId);
                const itemStakeholder = dataManager.getStakeholders().find(s => s.id === item.stakeholderId);
                const daysOverdue = Math.abs(dataManager.getDaysUntilDue(item.dueDate));
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}" overdue by ${daysOverdue} days (${itemStakeholder?.name || 'Unknown Stakeholder'})\n`;
            });
            emailContent += `\n`;
        }
        
        // Due this week section
        if (dueThisWeek.length > 0) {
            emailContent += `🟡 DUE THIS WEEK:\n`;
            dueThisWeek.forEach(item => {
                const project = dataManager.getProjects().find(p => p.id === item.projectId);
                const daysUntil = dataManager.getDaysUntilDue(item.dueDate);
                const dueText = daysUntil === 0 ? 'today' : 
                               daysUntil === 1 ? 'tomorrow' : 
                               `in ${daysUntil} days`;
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}" due ${dueText}\n`;
            });
            emailContent += `\n`;
        }
        
        // Completed today section
        if (completedToday.length > 0) {
            emailContent += `🟢 COMPLETED TODAY:\n`;
            completedToday.forEach(item => {
                const project = dataManager.getProjects().find(p => p.id === item.projectId);
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}" completed\n`;
            });
            emailContent += `\n`;
        }
        
        // Action items section
        if (actionItems.length > 0) {
            emailContent += `📋 YOUR ACTION ITEMS:\n`;
            actionItems.forEach((action, index) => {
                emailContent += `${index + 1}. ${action}\n`;
            });
            emailContent += `\n`;
        }
        
        // Project health summary
        if (projectSummary.length > 0) {
            emailContent += `📊 PROJECT HEALTH SUMMARY:\n`;
            projectSummary.forEach(summary => {
                emailContent += `• ${summary.name}: ${summary.status} ${summary.description}\n`;
            });
            emailContent += `\n`;
        }
        
        // Weather info (placeholder - could be integrated with weather API)
        emailContent += `Weather: Check local forecast for outdoor work planning\n\n`;
        
        // Closing
        emailContent += `Questions or need to discuss anything? Just reply to this email.\n\n`;
        emailContent += `${settings.emailSignature || 'Best regards,\\nProject Engineering Department'}\n`;
        
        return emailContent;
    }

    // Get urgent/overdue items
    getUrgentItems(communications) {
        return communications.filter(comm => dataManager.isOverdue(comm.dueDate))
            .sort((a, b) => {
                const aDays = Math.abs(dataManager.getDaysUntilDue(a.dueDate));
                const bDays = Math.abs(dataManager.getDaysUntilDue(b.dueDate));
                return bDays - aDays; // Most overdue first
            });
    }

    // Get items due this week
    getDueThisWeek(communications) {
        return communications.filter(comm => {
            const daysUntil = dataManager.getDaysUntilDue(comm.dueDate);
            return daysUntil >= 0 && daysUntil <= 7;
        }).sort((a, b) => {
            return dataManager.getDaysUntilDue(a.dueDate) - dataManager.getDaysUntilDue(b.dueDate);
        });
    }

    // Get items completed today
    getCompletedToday(communications) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return communications.filter(comm => {
            if (comm.status !== 'completed' || !comm.updatedAt) return false;
            
            const updatedDate = new Date(comm.updatedAt);
            updatedDate.setHours(0, 0, 0, 0);
            
            return updatedDate.getTime() === today.getTime();
        });
    }

    // Generate action items based on urgent and due items
    generateActionItems(urgentItems, dueThisWeek, stakeholder) {
        const actions = [];
        
        // Actions for overdue items
        urgentItems.forEach(item => {
            const itemStakeholder = dataManager.getStakeholders().find(s => s.id === item.stakeholderId);
            if (itemStakeholder && itemStakeholder.id !== stakeholder.id) {
                actions.push(`Follow up with ${itemStakeholder.name} on overdue ${item.type}: "${item.subject}"`);
            } else {
                actions.push(`Address overdue ${item.type}: "${item.subject}"`);
            }
        });
        
        // Actions for items due soon
        dueThisWeek.slice(0, 3).forEach(item => { // Limit to top 3
            const daysUntil = dataManager.getDaysUntilDue(item.dueDate);
            if (daysUntil <= 2) { // Only items due in 2 days or less
                actions.push(`Prepare for ${item.type} due ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : 'soon'}: "${item.subject}"`);
            }
        });
        
        return actions;
    }

    // Generate project health summary
    generateProjectSummary(projects, communications) {
        return projects.map(project => {
            const projectComms = communications.filter(c => c.projectId === project.id);
            const overdueCount = projectComms.filter(c => dataManager.isOverdue(c.dueDate)).length;
            const pendingCount = projectComms.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
            
            let status, description;
            
            if (overdueCount > 2 || pendingCount > 10) {
                status = '🔴 Attention needed';
                description = `(${overdueCount} overdue, ${pendingCount} pending)`;
            } else if (overdueCount > 0 || pendingCount > 5) {
                status = '🟡 On track with minor issues';
                description = `(${overdueCount} overdue, ${pendingCount} pending)`;
            } else {
                status = '🟢 Healthy';
                description = `(${pendingCount} pending items)`;
            }
            
            return {
                name: project.name,
                status,
                description
            };
        });
    }

    // Open Outlook with pre-filled email
    async openOutlookEmail(toEmail, content, recipientName) {
        try {
            // Try Microsoft 365 integration first
            const microsoft365Response = await fetch('/api/microsoft365/status');
            if (microsoft365Response.ok) {
                const microsoft365Status = await microsoft365Response.json();
                
                if (microsoft365Status.outlookEnabled && microsoft365Status.isAuthenticated) {
                    // Send via Microsoft Graph API
                    const subjectMatch = content.match(/Subject: (.+)/);
                    const subject = subjectMatch ? subjectMatch[1] : `Daily Project Status - ${recipientName}`;
                    const body = content.replace(/Subject: .+\n\n/, '');
                    
                    const emailData = {
                        subject: subject,
                        content: body,
                        recipients: [toEmail],
                        recipientNames: { [toEmail]: recipientName },
                        priority: 'normal'
                    };
                    
                    const sendResponse = await fetch('/api/microsoft365/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailData)
                    });
                    
                    if (sendResponse.ok) {
                        dashboard.showNotification(`✅ Email sent to ${recipientName} via Outlook!`, 'success');
                        return;
                    }
                }
            }
            
            // Fallback to traditional mailto
            const subjectMatch = content.match(/Subject: (.+)/);
            const subject = subjectMatch ? subjectMatch[1] : `Daily Project Status - ${recipientName}`;
            const body = content.replace(/Subject: .+\n\n/, '');
            const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
            window.open(mailtoUrl, '_blank');
            dashboard.showNotification(`📧 Email prepared for ${recipientName}`, 'info');
            
        } catch (error) {
            console.error('Error opening Outlook email:', error);
            this.copyEmailToClipboard(content, toEmail);
        }
    }

    // Fallback: copy email content to clipboard
    copyEmailToClipboard(content, toEmail) {
        try {
            const emailText = `To: ${toEmail}\n\n${content}`;
            
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(emailText).then(() => {
                    dashboard.showNotification('Email content copied to clipboard!', 'info');
                });
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = emailText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                dashboard.showNotification('Email content copied to clipboard!', 'info');
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            dashboard.showNotification('Error copying email content', 'error');
        }
    }

    // Generate email for specific recipient (used in preview)
    generateEmailPreview(recipientId) {
        return this.generateEmailContent(recipientId);
    }

    // Send test email
    sendTestEmail(recipientId) {
        try {
            const recipient = dataManager.getEmailRecipients().find(r => r.id === recipientId);
            const stakeholder = dataManager.getStakeholders().find(s => s.id === recipient.stakeholderId);
            
            if (!stakeholder || !stakeholder.email) {
                dashboard.showNotification('Recipient email not found', 'error');
                return;
            }
            
            const emailContent = this.generateEmailContent(recipientId);
            this.openOutlookEmail(stakeholder.email, emailContent, stakeholder.name);
            
            dashboard.showNotification(`Test email prepared for ${stakeholder.name}!`, 'success');
            
        } catch (error) {
            console.error('Test email error:', error);
            dashboard.showNotification('Error generating test email', 'error');
        }
    }

    // Schedule daily emails (placeholder for future Power Automate integration)
    scheduleAutomaticEmails() {
        const settings = dataManager.getSettings();
        
        if (!settings.autoSendEnabled) {
            dashboard.showNotification('Automatic email sending is disabled', 'warning');
            return;
        }
        
        // This would integrate with Power Automate or similar service
        dashboard.showNotification('Automatic email scheduling requires Power Automate setup. See documentation for details.', 'info');
    }

    // Export email templates for Power Automate
    exportEmailTemplates() {
        try {
            const recipients = dataManager.getEmailRecipients();
            const templates = recipients.map(recipient => {
                const stakeholder = dataManager.getStakeholders().find(s => s.id === recipient.stakeholderId);
                return {
                    recipientId: recipient.id,
                    recipientName: stakeholder?.name || 'Unknown',
                    recipientEmail: stakeholder?.email || '',
                    sendTime: recipient.sendTime,
                    frequency: recipient.frequency,
                    projectIds: recipient.projectIds,
                    template: this.generateEmailTemplate(recipient.id)
                };
            });
            
            const dataStr = JSON.stringify(templates, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Email_Templates_${timestamp}.json`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            link.click();
            
            dashboard.showNotification('Email templates exported for Power Automate setup!', 'success');
            
        } catch (error) {
            console.error('Template export error:', error);
            dashboard.showNotification('Error exporting email templates', 'error');
        }
    }

    // Generate email template with placeholders for Power Automate
    generateEmailTemplate(recipientId) {
        const recipient = dataManager.getEmailRecipients().find(r => r.id === recipientId);
        const stakeholder = dataManager.getStakeholders().find(s => s.id === recipient.stakeholderId);
        
        if (!recipient || !stakeholder) {
            return 'Error: Recipient or stakeholder not found.';
        }
        
        // Template with Power Automate placeholders
        let template = '';
        template += `Hi ${stakeholder.name},\n\n`;
        template += `Here's your daily project status update as of 5:00 PM on {{DATE}}:\n\n`;
        template += `{{URGENT_ITEMS}}\n`;
        template += `{{DUE_THIS_WEEK}}\n`;
        template += `{{COMPLETED_TODAY}}\n`;
        template += `{{ACTION_ITEMS}}\n`;
        template += `{{PROJECT_SUMMARY}}\n`;
        template += `Weather: {{WEATHER_INFO}}\n\n`;
        template += `Questions or need to discuss anything? Just reply to this email.\n\n`;
        template += `{{EMAIL_SIGNATURE}}\n`;
        
        return template;
    }

    // Weekly summary email (for Friday reports)
    generateWeeklySummary(recipientId) {
        const recipient = dataManager.getEmailRecipients().find(r => r.id === recipientId);
        const stakeholder = dataManager.getStakeholders().find(s => s.id === recipient.stakeholderId);
        const projects = dataManager.getProjects().filter(p => recipient.projectIds.includes(p.id));
        
        if (!recipient || !stakeholder) {
            return 'Error: Recipient or stakeholder not found.';
        }
        
        const today = new Date();
        const weekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        
        // Get week's communications
        const weekCommunications = dataManager.getCommunications()
            .filter(c => {
                if (!recipient.projectIds.includes(c.projectId)) return false;
                const createdDate = new Date(c.createdAt);
                return createdDate >= weekStart && createdDate <= today;
            });
        
        const completedThisWeek = weekCommunications.filter(c => c.status === 'completed');
        const addedThisWeek = weekCommunications.filter(c => c.status !== 'completed');
        
        let emailContent = '';
        emailContent += `Subject: Weekly Project Summary - ${stakeholder.name} - Week of ${weekStart.toLocaleDateString()}\n\n`;
        emailContent += `Hi ${stakeholder.name},\n\n`;
        emailContent += `Here's your weekly project summary for the week of ${weekStart.toLocaleDateString()}:\n\n`;
        
        // Week accomplishments
        if (completedThisWeek.length > 0) {
            emailContent += `✅ COMPLETED THIS WEEK:\n`;
            completedThisWeek.forEach(item => {
                const project = projects.find(p => p.id === item.projectId);
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}"\n`;
            });
            emailContent += `\n`;
        }
        
        // New items added
        if (addedThisWeek.length > 0) {
            emailContent += `📝 NEW ITEMS THIS WEEK:\n`;
            addedThisWeek.forEach(item => {
                const project = projects.find(p => p.id === item.projectId);
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}"\n`;
            });
            emailContent += `\n`;
        }
        
        // Next week outlook
        const nextWeekItems = dataManager.getCommunications()
            .filter(c => {
                if (!recipient.projectIds.includes(c.projectId)) return false;
                const daysUntil = dataManager.getDaysUntilDue(c.dueDate);
                return daysUntil >= 0 && daysUntil <= 7;
            });
        
        if (nextWeekItems.length > 0) {
            emailContent += `📅 COMING UP NEXT WEEK:\n`;
            nextWeekItems.forEach(item => {
                const project = projects.find(p => p.id === item.projectId);
                emailContent += `• ${project?.name || 'Unknown Project'}: ${item.type} "${item.subject}" due ${dataManager.formatDate(item.dueDate)}\n`;
            });
            emailContent += `\n`;
        }
        
        emailContent += `Have a great weekend!\n\n`;
        emailContent += `${dataManager.getSettings().emailSignature || 'Best regards,\\nProject Engineering Department'}\n`;
        
        return emailContent;
    }
}

// Create global instance
window.emailManager = new EmailManager();

// Global functions for HTML onclick handlers
window.generateDailyEmails = () => emailManager.generateDailyEmails();
window.sendTestEmail = (recipientId) => emailManager.sendTestEmail(recipientId);
window.exportEmailTemplates = () => emailManager.exportEmailTemplates();

// Update dashboard's generateEmailContent function
window.dashboard.generateEmailContent = (recipientId) => emailManager.generateEmailPreview(recipientId);

