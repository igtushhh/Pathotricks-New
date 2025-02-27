// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show splash screen for 2 seconds
    setTimeout(() => {
        document.querySelector('.splash-screen').style.display = 'none';
        document.querySelector('.main-content').style.display = 'block';
    }, 2000);

    // Add event listeners for form submission
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // Initialize data loading
    loadPatientData();
});

async function loadPatientData() {
    try {
        const response = await fetch('http://localhost:3002/api/patients');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        console.log('Loaded patient data:', data); // Debug log
        window.allPatientData = data;
        displayPatientData(data);
    } catch (error) {
        console.error('Error loading patient data:', error);
        showError('Failed to load patient data. Please try again.');
    }
}

function handleSearch(e) {
    e.preventDefault();
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const searchQuery = document.getElementById('searchQuery').value.toLowerCase();

    if (!window.allPatientData) {
        console.log('No data available to filter');
        return;
    }

    let filteredData = window.allPatientData;

    // Filter by date range
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filteredData = filteredData.filter(patient => {
            if (!patient.createdAt) return false;
            const patientDate = new Date(patient.createdAt);
            return patientDate >= start && patientDate <= end;
        });
    }

    // Filter by search query
    if (searchQuery) {
        filteredData = filteredData.filter(patient => {
            return (
                (patient.patientName && patient.patientName.toLowerCase().includes(searchQuery)) ||
                (patient.serialNumber && patient.serialNumber.toString().includes(searchQuery)) ||
                (patient.contactNumber && patient.contactNumber.includes(searchQuery))
            );
        });
    }

    displayPatientData(filteredData);
}

function displayPatientData(patients) {
    const container = document.querySelector('.patient-records-grid');
    if (!container) return;

    if (!patients.length) {
        container.innerHTML = '<div class="no-data">No patients found for the selected date range</div>';
        return;
    }

    container.innerHTML = patients.map(patient => `
        <div class="patient-card">
            <div class="patient-header">
                <h3>${patient.patientName || 'N/A'}</h3>
                <span class="patient-id">#${patient.serialNumber || 'N/A'}</span>
            </div>
            <div class="patient-info">
                <p><strong>Age/Gender:</strong> ${patient.age || 'N/A'}/${patient.gender || 'N/A'}</p>
                <p><strong>Contact:</strong> ${patient.contactNumber || 'N/A'}</p>
                <p><strong>Tests:</strong> ${patient.selectedTests ? patient.selectedTests.map(test => test.name).join(', ') : 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-badge ${(patient.status || 'pending').toLowerCase()}">${patient.status || 'Pending'}</span></p>
                <p><strong>Date:</strong> ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div class="patient-actions">
                <button onclick="viewDetails('${patient._id}')" class="action-btn">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button onclick="generateReport('${patient._id}')" class="action-btn">
                    <i class="fas fa-file-pdf"></i> Generate Report
                </button>
            </div>
        </div>
    `).join('');
}

function viewDetails(patientId) {
    // Implement view details functionality
    console.log('Viewing details for patient:', patientId);
}

function generateReport(patientId) {
    // Implement report generation functionality
    console.log('Generating report for patient:', patientId);
}

function showError(message) {
    // Create and show error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
