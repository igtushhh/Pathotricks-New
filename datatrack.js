import API_URL from './config.js';

export class DataTracker {
    constructor() {
        console.log('DataTracker constructor called');
        this.filters = {
            dateRange: 'all',
            status: 'all',
            searchQuery: ''
        };
        this.initialize();
        this.setupStatusUpdates();
    }

    setupStatusUpdates() {
        // Add this method to handle status updates globally
        window.updatePatientStatus = async (patientId, newStatus) => {
            try {
                const response = await fetch(`${API_URL}/api/patients/${patientId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                if (!response.ok) {
                    throw new Error('Failed to update status');
                }

                // Refresh the data
                await this.fetchAndDisplayData();
                this.showSuccess('Status updated successfully');
            } catch (error) {
                console.error('Error:', error);
                this.showError('Failed to update status');
            }
        };
    }

    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <div class="notification-progress"></div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async initialize() {
        try {
            console.log('Initializing DataTracker...');
            await this.fetchAndDisplayData();
            await this.fetchAndDisplayStats();
            this.setupEventListeners();
            console.log('DataTracker initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize data tracker');
        }
    }

    setupEventListeners() {
        const filterForm = document.getElementById('filterForm');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFilterChange();
            });
        }
    }

    async fetchAndDisplayData() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'flex';

        try {
            const queryParams = new URLSearchParams(this.filters);
            const url = `${API_URL}/api/patients?${queryParams}`;
            
            console.log('Fetching data from:', url);
            
            const response = await fetch(url);
            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const patients = await response.json();
            console.log('Received patients data:', patients);

            this.displayData(patients);
        } catch (error) {
            console.error('Data fetch error:', error);
            this.showError(`Failed to fetch data: ${error.message}`);
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    async fetchAndDisplayStats() {
        try {
            const response = await fetch(`${API_URL}/api/statistics`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const stats = await response.json();
            console.log('Fetched stats:', stats);
            this.updateStatistics(stats);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    }

    updateStatistics(stats) {
        // Update total patients
        const totalPatientsElement = document.querySelector('.stat-card:nth-child(1) .stat-number');
        if (totalPatientsElement) {
            totalPatientsElement.textContent = stats.totalPatients;
        }

        // Update tests conducted
        const totalTestsElement = document.querySelector('.stat-card:nth-child(2) .stat-number');
        if (totalTestsElement) {
            totalTestsElement.textContent = stats.totalTests;
        }

        // Update revenue
        const revenueElement = document.querySelector('.stat-card:nth-child(3) .stat-number');
        if (revenueElement) {
            revenueElement.textContent = `₹${stats.totalRevenue.toLocaleString('en-IN')}`;
        }
    }

    displayData(patients) {
        const tableBody = document.getElementById('patientTableBody');
        if (!tableBody) {
            console.error('Table body element not found!');
            return;
        }

        try {
            console.log('Displaying data for', patients.length, 'patients');
            
            if (!Array.isArray(patients)) {
                console.error('Invalid patients data:', patients);
                throw new Error('Invalid data format received from server');
            }

            if (patients.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <p>No patients found</p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Clear existing content
            tableBody.innerHTML = '';

            // Add each patient row
            patients.forEach((patient, index) => {
                console.log(`Processing patient ${index + 1}:`, patient.serialNumber);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(patient.date).toLocaleDateString('en-IN')}</td>
                    <td>${patient.serialNumber}</td>
                    <td>${patient.patientName}</td>
                    <td>${patient.selectedTests.map(test => test.name).join(', ')}</td>
                    <td>
                        <span class="status-badge ${patient.status}">
                            ${patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                        </span>
                    </td>
                    <td>₹${patient.finalAmount.toLocaleString('en-IN')}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="window.updatePatientStatus('${patient._id}', 'pending')" 
                                class="status-btn ${patient.status === 'pending' ? 'active' : ''}">
                                Pending
                            </button>
                            <button onclick="window.updatePatientStatus('${patient._id}', 'processing')" 
                                class="status-btn ${patient.status === 'processing' ? 'active' : ''}">
                                Processing
                            </button>
                            <button onclick="window.updatePatientStatus('${patient._id}', 'completed')" 
                                class="status-btn ${patient.status === 'completed' ? 'active' : ''}">
                                Completed
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            console.log('Data display completed');
        } catch (error) {
            console.error('Error displaying data:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="error">
                        Error displaying data: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    handleFilterChange() {
        this.filters = {
            dateRange: document.getElementById('dateRange').value,
            status: document.getElementById('statusFilter').value,
            searchQuery: document.getElementById('searchQuery').value
        };
        this.fetchAndDisplayData();
    }

    showError(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <div class="notification-progress"></div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing DataTracker');
    new DataTracker();
});
