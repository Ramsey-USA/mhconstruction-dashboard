// Excel Export Functionality for Construction Dashboard
// Handles Excel file generation and download using SheetJS

class ExcelExporter {
    constructor() {
        this.workbook = null;
    }

    // Main export function called from UI
    exportToExcel() {
        try {
            this.workbook = XLSX.utils.book_new();
            
            // Add all worksheets
            this.addProjectsSheet();
            this.addCommunicationsSheet();
            this.addProspectsSheet();
            this.addStakeholdersSheet();
            this.addDashboardSheet();
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Construction_Dashboard_Export_${timestamp}.xlsx`;
            
            // Write and download file
            XLSX.writeFile(this.workbook, filename);
            
            dashboard.showNotification('Excel file exported successfully!', 'success');
            
        } catch (error) {
            console.error('Excel export error:', error);
            dashboard.showNotification('Error exporting Excel file', 'error');
        }
    }

    // Projects worksheet
    addProjectsSheet() {
        const projects = dataManager.getProjects();
        const stakeholders = dataManager.getStakeholders();
        const communications = dataManager.getCommunications();
        
        const data = projects.map(project => {
            const pm = stakeholders.find(s => s.id === project.projectManagerId);
            const super_ = stakeholders.find(s => s.id === project.superintendentId);
            const projectComms = communications.filter(c => c.projectId === project.id);
            const overdueCount = projectComms.filter(c => dataManager.isOverdue(c.dueDate)).length;
            const pendingCount = projectComms.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
            
            return {
                'Project Number': project.number,
                'Project Name': project.name,
                'Client': project.client,
                'Project Manager': pm?.name || 'Unassigned',
                'Superintendent': super_?.name || 'Unassigned',
                'Status': project.status.toUpperCase(),
                'Start Date': dataManager.formatDate(project.startDate),
                'End Date': dataManager.formatDate(project.endDate),
                'Contract Value': project.contractValue || 0,
                'Total Communications': projectComms.length,
                'Pending Items': pendingCount,
                'Overdue Items': overdueCount,
                'Health Score': this.calculateProjectHealth(overdueCount, pendingCount),
                'Created Date': dataManager.formatDate(project.createdAt)
            };
        });
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 15 }, // Project Number
            { wch: 30 }, // Project Name
            { wch: 25 }, // Client
            { wch: 20 }, // Project Manager
            { wch: 20 }, // Superintendent
            { wch: 12 }, // Status
            { wch: 12 }, // Start Date
            { wch: 12 }, // End Date
            { wch: 15 }, // Contract Value
            { wch: 12 }, // Total Communications
            { wch: 12 }, // Pending Items
            { wch: 12 }, // Overdue Items
            { wch: 12 }, // Health Score
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = colWidths;
        
        // Add conditional formatting for health scores
        this.addProjectHealthFormatting(worksheet, data.length);
        
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Projects');
    }

    // Communications worksheet
    addCommunicationsSheet() {
        const communications = dataManager.getCommunications();
        const projects = dataManager.getProjects();
        const stakeholders = dataManager.getStakeholders();
        
        const data = communications.map(comm => {
            const project = projects.find(p => p.id === comm.projectId);
            const stakeholder = stakeholders.find(s => s.id === comm.stakeholderId);
            const daysUntilDue = dataManager.getDaysUntilDue(comm.dueDate);
            const isOverdue = dataManager.isOverdue(comm.dueDate);
            
            return {
                'Project': project?.name || 'Unknown Project',
                'Project Number': project?.number || 'N/A',
                'Stakeholder': stakeholder?.name || 'Unknown Stakeholder',
                'Stakeholder Role': stakeholder?.role || 'Unknown',
                'Type': comm.type,
                'Subject': comm.subject,
                'Priority': comm.priority?.toUpperCase() || 'MEDIUM',
                'Status': isOverdue ? 'OVERDUE' : comm.status?.toUpperCase(),
                'Due Date': dataManager.formatDate(comm.dueDate),
                'Days Until Due': daysUntilDue !== null ? daysUntilDue : 'No Due Date',
                'Notes': comm.notes || '',
                'Created Date': dataManager.formatDate(comm.createdAt),
                'Last Updated': dataManager.formatDate(comm.updatedAt || comm.createdAt)
            };
        });
        
        // Sort by due date and priority
        data.sort((a, b) => {
            if (a.Status === 'OVERDUE' && b.Status !== 'OVERDUE') return -1;
            if (b.Status === 'OVERDUE' && a.Status !== 'OVERDUE') return 1;
            return (a['Days Until Due'] || 999) - (b['Days Until Due'] || 999);
        });
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 25 }, // Project
            { wch: 15 }, // Project Number
            { wch: 20 }, // Stakeholder
            { wch: 15 }, // Stakeholder Role
            { wch: 15 }, // Type
            { wch: 40 }, // Subject
            { wch: 10 }, // Priority
            { wch: 12 }, // Status
            { wch: 12 }, // Due Date
            { wch: 12 }, // Days Until Due
            { wch: 50 }, // Notes
            { wch: 15 }, // Created Date
            { wch: 15 }  // Last Updated
        ];
        worksheet['!cols'] = colWidths;
        
        // Add conditional formatting for overdue items
        this.addCommunicationStatusFormatting(worksheet, data.length);
        
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Communications');
    }

    // Prospects worksheet
    addProspectsSheet() {
        const prospects = dataManager.getProspects();
        const stakeholders = dataManager.getStakeholders();
        
        const data = prospects.map(prospect => {
            const estimator = stakeholders.find(s => s.id === prospect.estimatorId);
            const daysUntilProposal = dataManager.getDaysUntilDue(prospect.proposalDueDate);
            const weightedValue = (prospect.estimatedValue || 0) * (prospect.probability / 100);
            
            return {
                'Prospect Name': prospect.name,
                'Client': prospect.client,
                'Estimator': estimator?.name || 'Unassigned',
                'Walk Date': dataManager.formatDate(prospect.walkDate),
                'Proposal Due Date': dataManager.formatDate(prospect.proposalDueDate),
                'Days Until Proposal': daysUntilProposal !== null ? daysUntilProposal : 'No Due Date',
                'Estimated Value': prospect.estimatedValue || 0,
                'Win Probability': `${prospect.probability}%`,
                'Weighted Value': weightedValue,
                'Status': prospect.status?.toUpperCase() || 'ACTIVE',
                'Notes': prospect.notes || '',
                'Created Date': dataManager.formatDate(prospect.createdAt)
            };
        });
        
        // Sort by proposal due date
        data.sort((a, b) => (a['Days Until Proposal'] || 999) - (b['Days Until Proposal'] || 999));
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 30 }, // Prospect Name
            { wch: 25 }, // Client
            { wch: 20 }, // Estimator
            { wch: 12 }, // Walk Date
            { wch: 15 }, // Proposal Due Date
            { wch: 15 }, // Days Until Proposal
            { wch: 15 }, // Estimated Value
            { wch: 12 }, // Win Probability
            { wch: 15 }, // Weighted Value
            { wch: 12 }, // Status
            { wch: 50 }, // Notes
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = colWidths;
        
        // Add summary row
        const totalEstimatedValue = prospects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
        const totalWeightedValue = prospects.reduce((sum, p) => sum + ((p.estimatedValue || 0) * (p.probability / 100)), 0);
        
        const summaryData = [
            {},
            {
                'Prospect Name': 'TOTALS',
                'Estimated Value': totalEstimatedValue,
                'Weighted Value': totalWeightedValue
            }
        ];
        
        XLSX.utils.sheet_add_json(worksheet, summaryData, { origin: -1, skipHeader: true });
        
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Prospects');
    }

    // Stakeholders worksheet
    addStakeholdersSheet() {
        const stakeholders = dataManager.getStakeholders();
        const communications = dataManager.getCommunications();
        const projects = dataManager.getProjects();
        
        const data = stakeholders.map(stakeholder => {
            const stakeholderComms = communications.filter(c => c.stakeholderId === stakeholder.id);
            const overdueComms = stakeholderComms.filter(c => dataManager.isOverdue(c.dueDate));
            const pendingComms = stakeholderComms.filter(c => c.status === 'pending' || c.status === 'in-progress');
            
            // Find projects where this stakeholder is PM or Super
            const managedProjects = projects.filter(p => 
                p.projectManagerId === stakeholder.id || p.superintendentId === stakeholder.id
            );
            
            return {
                'Name': stakeholder.name,
                'Role': stakeholder.role,
                'Company': stakeholder.company || '',
                'Email': stakeholder.email || '',
                'Phone': stakeholder.phone || '',
                'Receives Daily Emails': stakeholder.receivesEmails ? 'Yes' : 'No',
                'Total Communications': stakeholderComms.length,
                'Pending Communications': pendingComms.length,
                'Overdue Communications': overdueComms.length,
                'Managed Projects': managedProjects.map(p => p.name).join(', ') || 'None',
                'Created Date': dataManager.formatDate(stakeholder.createdAt)
            };
        });
        
        // Sort by role, then name
        data.sort((a, b) => {
            if (a.Role !== b.Role) return a.Role.localeCompare(b.Role);
            return a.Name.localeCompare(b.Name);
        });
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = [
            { wch: 25 }, // Name
            { wch: 20 }, // Role
            { wch: 25 }, // Company
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 15 }, // Receives Daily Emails
            { wch: 15 }, // Total Communications
            { wch: 15 }, // Pending Communications
            { wch: 15 }, // Overdue Communications
            { wch: 40 }, // Managed Projects
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Stakeholders');
    }

    // Dashboard summary worksheet
    addDashboardSheet() {
        const stats = dataManager.getDashboardStats();
        const projects = dataManager.getProjects();
        const communications = dataManager.getCommunications();
        const prospects = dataManager.getProspects();
        const stakeholders = dataManager.getStakeholders();
        
        // Summary statistics
        const summaryData = [
            { 'Metric': 'Active Projects', 'Value': stats.activeProjects },
            { 'Metric': 'Total Projects', 'Value': projects.length },
            { 'Metric': 'Pending Communications', 'Value': stats.pendingItems },
            { 'Metric': 'Overdue Communications', 'Value': stats.overdueItems },
            { 'Metric': 'Due This Week', 'Value': stats.dueThisWeek },
            { 'Metric': 'Total Communications', 'Value': communications.length },
            { 'Metric': 'Active Prospects', 'Value': prospects.filter(p => p.status === 'active').length },
            { 'Metric': 'Total Stakeholders', 'Value': stakeholders.length },
            { 'Metric': 'Email Recipients', 'Value': stakeholders.filter(s => s.receivesEmails).length }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(summaryData);
        
        // Add project health breakdown
        const healthData = [
            {},
            { 'Metric': 'PROJECT HEALTH BREAKDOWN', 'Value': '' },
            ...this.getProjectHealthBreakdown()
        ];
        
        XLSX.utils.sheet_add_json(worksheet, healthData, { origin: -1, skipHeader: true });
        
        // Add communication type breakdown
        const commTypeData = [
            {},
            { 'Metric': 'COMMUNICATION TYPE BREAKDOWN', 'Value': '' },
            ...this.getCommunicationTypeBreakdown()
        ];
        
        XLSX.utils.sheet_add_json(worksheet, commTypeData, { origin: -1, skipHeader: true });
        
        // Add prospect pipeline summary
        const pipelineData = [
            {},
            { 'Metric': 'PROSPECT PIPELINE SUMMARY', 'Value': '' },
            ...this.getProspectPipelineSummary()
        ];
        
        XLSX.utils.sheet_add_json(worksheet, pipelineData, { origin: -1, skipHeader: true });
        
        // Set column widths
        worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
        
        XLSX.utils.book_append_sheet(this.workbook, worksheet, 'Dashboard Summary');
    }

    // Helper functions for dashboard data
    getProjectHealthBreakdown() {
        const projects = dataManager.getProjects();
        const communications = dataManager.getCommunications();
        
        let healthy = 0, warning = 0, critical = 0;
        
        projects.forEach(project => {
            const projectComms = communications.filter(c => c.projectId === project.id);
            const overdueCount = projectComms.filter(c => dataManager.isOverdue(c.dueDate)).length;
            const pendingCount = projectComms.filter(c => c.status === 'pending' || c.status === 'in-progress').length;
            
            if (overdueCount > 2 || pendingCount > 10) critical++;
            else if (overdueCount > 0 || pendingCount > 5) warning++;
            else healthy++;
        });
        
        return [
            { 'Metric': 'Healthy Projects', 'Value': healthy },
            { 'Metric': 'Projects with Warnings', 'Value': warning },
            { 'Metric': 'Critical Projects', 'Value': critical }
        ];
    }

    getCommunicationTypeBreakdown() {
        const communications = dataManager.getCommunications();
        const types = {};
        
        communications.forEach(comm => {
            types[comm.type] = (types[comm.type] || 0) + 1;
        });
        
        return Object.entries(types).map(([type, count]) => ({
            'Metric': `${type}s`,
            'Value': count
        }));
    }

    getProspectPipelineSummary() {
        const prospects = dataManager.getProspects();
        
        const totalValue = prospects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
        const weightedValue = prospects.reduce((sum, p) => sum + ((p.estimatedValue || 0) * (p.probability / 100)), 0);
        const avgProbability = prospects.length > 0 ? 
            prospects.reduce((sum, p) => sum + p.probability, 0) / prospects.length : 0;
        
        return [
            { 'Metric': 'Total Pipeline Value', 'Value': totalValue },
            { 'Metric': 'Weighted Pipeline Value', 'Value': Math.round(weightedValue) },
            { 'Metric': 'Average Win Probability', 'Value': `${Math.round(avgProbability)}%` },
            { 'Metric': 'Proposals Due This Week', 'Value': prospects.filter(p => dataManager.isDueSoon(p.proposalDueDate, 7)).length }
        ];
    }

    // Utility functions
    calculateProjectHealth(overdueCount, pendingCount) {
        if (overdueCount > 2 || pendingCount > 10) return 'Critical';
        if (overdueCount > 0 || pendingCount > 5) return 'Warning';
        return 'Healthy';
    }

    addProjectHealthFormatting(worksheet, rowCount) {
        // This would add conditional formatting in a full Excel implementation
        // For now, we'll just ensure the data is properly structured
    }

    addCommunicationStatusFormatting(worksheet, rowCount) {
        // This would add conditional formatting for overdue items
        // For now, we'll just ensure the data is properly structured
    }

    // Export individual sheets
    exportProjectsOnly() {
        try {
            this.workbook = XLSX.utils.book_new();
            this.addProjectsSheet();
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Projects_Export_${timestamp}.xlsx`;
            
            XLSX.writeFile(this.workbook, filename);
            dashboard.showNotification('Projects exported successfully!', 'success');
        } catch (error) {
            console.error('Projects export error:', error);
            dashboard.showNotification('Error exporting projects', 'error');
        }
    }

    exportCommunicationsOnly() {
        try {
            this.workbook = XLSX.utils.book_new();
            this.addCommunicationsSheet();
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Communications_Export_${timestamp}.xlsx`;
            
            XLSX.writeFile(this.workbook, filename);
            dashboard.showNotification('Communications exported successfully!', 'success');
        } catch (error) {
            console.error('Communications export error:', error);
            dashboard.showNotification('Error exporting communications', 'error');
        }
    }

    exportProspectsOnly() {
        try {
            this.workbook = XLSX.utils.book_new();
            this.addProspectsSheet();
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Prospects_Export_${timestamp}.xlsx`;
            
            XLSX.writeFile(this.workbook, filename);
            dashboard.showNotification('Prospects exported successfully!', 'success');
        } catch (error) {
            console.error('Prospects export error:', error);
            dashboard.showNotification('Error exporting prospects', 'error');
        }
    }

    // Export data backup (JSON format)
    exportDataBackup() {
        try {
            const allData = dataManager.exportAllData();
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `Dashboard_Backup_${timestamp}.json`;
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = filename;
            link.click();
            
            dashboard.showNotification('Data backup exported successfully!', 'success');
        } catch (error) {
            console.error('Backup export error:', error);
            dashboard.showNotification('Error exporting data backup', 'error');
        }
    }

    // Import data backup
    importDataBackup(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (dataManager.importAllData(data)) {
                        dashboard.showNotification('Data imported successfully!', 'success');
                        dashboard.loadDashboard();
                        dashboard.populateDropdowns();
                    } else {
                        dashboard.showNotification('Error importing data', 'error');
                    }
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    dashboard.showNotification('Invalid backup file format', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Import error:', error);
            dashboard.showNotification('Error reading backup file', 'error');
        }
    }
}

// Create global instance
window.excelExporter = new ExcelExporter();

// Global functions for HTML onclick handlers
window.exportToExcel = () => excelExporter.exportToExcel();
window.exportProjectsOnly = () => excelExporter.exportProjectsOnly();
window.exportCommunicationsOnly = () => excelExporter.exportCommunicationsOnly();
window.exportProspectsOnly = () => excelExporter.exportProspectsOnly();
window.exportDataBackup = () => excelExporter.exportDataBackup();

