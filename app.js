// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize loading bar
    const loadingProgress = document.querySelector('.loading-progress');
    if (loadingProgress) {
        loadingProgress.style.width = '100%';
    }

    // Show splash screen for 2 seconds
    setTimeout(() => {
        const splashScreen = document.querySelector('.splash-screen');
        const mainContent = document.querySelector('.main-content');
        
        if (splashScreen && mainContent) {
            // Add fade-out class to trigger animation
            splashScreen.classList.add('fade-out');
            
            // After fade-out animation completes, hide splash screen and show main content
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainContent.style.display = 'block';
            }, 500); // Match this with the CSS transition duration
        }
    }, 2000);

    // Initialize page-specific functionality
    initializePage();

    // Handle new patient button
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', () => {
            window.location.href = 'index.html#patient-form';
        });
    }

    // Initialize the form
    const form = document.getElementById('patientForm');
    if (form) {
        console.log('Form found, attaching submit handler');
        form.addEventListener('submit', handleSubmit);
        
        // Generate initial serial number
        generateSerialNumber();
        
        // Set up test selection handlers
        const testCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        testCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSummary);
        });
        
        // Initial summary update
        updateSummary();
    } else {
        console.error('Patient form not found!');
    }
    
    // Initialize other components
    updateDataTrack();
    checkServerHealth();
});

// Function to initialize page-specific functionality
function initializePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch (currentPage) {
        case 'index.html':
            initializeHome();
            break;
        case 'datatrack.html':
            initializeDataTrack();
            break;
        case 'viewdata.html':
            initializeViewData();
            break;
    }
}

// Initialize home page functionality
function initializeHome() {
    // No additional initialization needed for home page
}

// Initialize DataTrack page functionality
function initializeDataTrack() {
    // Add any DataTrack specific initialization here
    const filterBtn = document.querySelector('.filter-btn');
    if (filterBtn) {
        filterBtn.addEventListener('click', handleDataTrackFilter);
    }
}

// Initialize ViewData page functionality
function initializeViewData() {
    // Add any ViewData specific initialization here
    const searchBtn = document.querySelector('.filter-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleViewDataSearch);
    }
}

// Event Handlers
function handleDataTrackFilter() {
    const dateRange = document.getElementById('dateRange').value;
    const testType = document.getElementById('testType').value;
    console.log('Filtering data:', { dateRange, testType });
    // Implement your filter logic here
}

function handleViewDataSearch() {
    const searchQuery = document.getElementById('searchPatient').value;
    const dateFilter = document.getElementById('dateFilter').value;
    console.log('Searching:', { searchQuery, dateFilter });
    // Implement your search logic here
}

// Function to generate serial number
function generateSerialNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PT${year}${month}${day}${random}`;
}

// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Function to format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to validate phone number
function validatePhoneNumber(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// Function to validate email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Export functions for use in other files
window.utils = {
    generateSerialNumber,
    formatCurrency,
    formatDate,
    showNotification,
    validatePhoneNumber,
    validateEmail
};

// Function to update the summary when tests are selected
function updateSummary() {
    const selectedTests = [];
    let totalAmount = 0;
    let summaryText = '';
    
    // Get all checked checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    
    // Update selected tests and total amount
    checkboxes.forEach((checkbox, index) => {
        selectedTests.push(checkbox.value);
        totalAmount += parseFloat(checkbox.dataset.price);
        summaryText += `${index + 1}. ${checkbox.value}\n`;
    });
    
    // Calculate discount (25%)
    const discountAmount = totalAmount * 0.25;
    const finalAmount = totalAmount - discountAmount;
    
    // Update summary display
    document.getElementById('summarySelectedTests').innerHTML = 
        selectedTests.length > 0 ? summaryText.replace(/\n/g, '<br>') : 'N/A';
    document.getElementById('summaryTotalAmount').textContent = 
        selectedTests.length > 0 ? `₹${totalAmount}` : '₹0';
    document.getElementById('summaryDiscount').textContent = 
        selectedTests.length > 0 ? `₹${discountAmount}` : '₹0';
    document.getElementById('summaryFinalAmount').textContent = 
        selectedTests.length > 0 ? `₹${finalAmount}` : '₹0';
}

// Function to update DataTrack table
async function updateDataTrack() {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
        try {
            // First check if server is healthy
            const healthCheck = await fetch('http://localhost:3002/health')
                .catch(() => ({ ok: false }));

            if (!healthCheck.ok) {
                console.warn('Server health check failed - server might be offline');
                // Don't throw error immediately, just show a message in the table
                const dataTrackTable = document.getElementById('dataTrackTable');
                if (dataTrackTable) {
                    dataTrackTable.innerHTML = `
                        <div class="error-message" style="text-align: center; padding: 20px;">
                            <p>Server connection failed. Please ensure the server is running.</p>
                            <p>Steps to start the server:</p>
                            <ol style="text-align: left; display: inline-block;">
                                <li>Open terminal in the project directory</li>
                                <li>Run: npm install (if not done already)</li>
                                <li>Run: npm start</li>
                            </ol>
                            <button onclick="updateDataTrack()" style="margin-top: 10px; padding: 8px 16px; background-color: #2193b0; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-sync"></i> Retry Connection
                            </button>
                        </div>
                    `;
                }
                return; // Exit function instead of throwing error
            }

            // Fetch patient data
            const response = await fetch('http://localhost:3002/api/patients', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch data');
            }

            const patients = await response.json();
            console.log('Received patients:', patients);

            // Check if we're on the main page or datatrack page
            const dataTrackTable = document.getElementById('dataTrackTable');
            const patientTableBody = document.getElementById('patientTableBody');

            if (!dataTrackTable && !patientTableBody) {
                console.log('No table elements found - might be on a different page');
                return;
            }

            if (dataTrackTable) {
                // Main page display
                if (!Array.isArray(patients) || patients.length === 0) {
                    dataTrackTable.innerHTML = `
                        <div class="info-message" style="text-align: center; padding: 20px;">
                            <p>No patient records found</p>
                            <a href="add_patient.html" class="action-btn" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background-color: #2193b0; color: white; text-decoration: none; border-radius: 4px;">
                                <i class="fas fa-user-plus"></i> Add New Patient
                            </a>
                        </div>
                    `;
                    return;
                }

                let tableHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Serial No.</th>
                                <th>Patient Name</th>
                                <th>Tests</th>
                                <th>Amount</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                patients.forEach(data => {
                    const testsList = Array.isArray(data.selectedTests) ? 
                        data.selectedTests.map((test, index) => `${index + 1}. ${test}`).join('<br>') :
                        'No tests';

                    tableHTML += `
                        <tr>
                            <td>${formatDate(data.date)}</td>
                            <td>${data.serialNumber || ''}</td>
                            <td>${data.patientName || ''}</td>
                            <td>${testsList}</td>
                            <td>₹${data.finalAmount || 0}</td>
                            <td>
                                <button onclick="handlePdfGeneration(${JSON.stringify(data).replace(/"/g, '&quot;')})" class="action-btn">
                                    <i class="fas fa-file-pdf"></i> Generate PDF
                                </button>
                            </td>
                        </tr>
                    `;
                });

                tableHTML += `
                        </tbody>
                    </table>
                `;

                dataTrackTable.innerHTML = tableHTML;
            }

            // Successfully updated table, break the retry loop
            break;

        } catch (error) {
            console.error(`Attempt ${retryCount + 1}/${maxRetries} failed:`, error);
            
            if (retryCount === maxRetries - 1) {
                // On final retry, show error to user
                const dataTrackTable = document.getElementById('dataTrackTable');
                if (dataTrackTable) {
                    dataTrackTable.innerHTML = `
                        <div class="error-message" style="text-align: center; padding: 20px;">
                            <p>Error loading data: ${error.message}</p>
                            <button onclick="updateDataTrack()" style="margin-top: 10px; padding: 8px 16px; background-color: #2193b0; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-sync"></i> Retry
                            </button>
                        </div>
                    `;
                }
                return; // Return instead of throwing error
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            retryCount++;
        }
    }
}

// Function to handle PDF generation
async function handlePdfGeneration(data) {
    try {
        generatePDF(data);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(error.message);
    }
}

// Function to generate PDF
async function generatePDF(data) {
    try {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add logo
        const logo = new Image();
        logo.src = 'logo.png';
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
        });
        doc.addImage(logo, 'PNG', 85, 5, 40, 40);
        
        // Add title with gradient-like effect
        doc.setFillColor(33, 147, 176); // #2193b0
        doc.rect(0, 0, 210, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('PathoTricks Laboratory', 105, 50, { align: 'center' });
        
        // Add subtitle
        doc.setTextColor(109, 213, 237); // #6dd5ed
        doc.setFontSize(12);
        doc.text('Clinical Medical Laboratory', 105, 60, { align: 'center' });
        
        // Reset text color for content
        doc.setTextColor(51, 51, 51); // #333333
        
        // Add patient information
        doc.setFillColor(240, 240, 240);
        doc.rect(15, 70, 180, 60, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Patient Information', 20, 80);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Serial Number: ${data.serialNumber || ''}`, 20, 90);
        doc.text(`Name: ${data.patientName}`, 20, 100);
        doc.text(`Age: ${data.age}`, 20, 110);
        doc.text(`Gender: ${data.gender}`, 20, 120);
        doc.text(`Contact: ${data.contactNumber || ''}`, 110, 90);
        doc.text(`Date: ${formatDate(data.date)}`, 110, 100);
        
        // Add selected tests with alternating background
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Selected Tests', 20, 145);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        let yPos = 155;
        data.selectedTests.forEach((test, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(15, yPos - 5, 180, 10, 'F');
            }
            doc.text(`${index + 1}. ${test}`, 20, yPos);
            yPos += 10;
        });
        
        // Add amount details with highlight box
        yPos += 10;
        doc.setFillColor(33, 147, 176, 0.1); // Light blue background
        doc.rect(15, yPos - 5, 180, 45, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Amount Details:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 10;
        doc.text(`Total Amount: ₹${data.totalAmount}`, 30, yPos);
        yPos += 10;
        doc.text(`Discount (25%): ₹${data.discountAmount}`, 30, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 147, 176); // #2193b0
        doc.text(`Final Amount: ₹${data.finalAmount}`, 30, yPos);
        
        // Add footer with gradient
        doc.setFillColor(33, 147, 176);
        doc.rect(0, 277, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PathoTricks Sample Collection Center', 105, 283, { align: 'center' });
        doc.text('Beside ASIT Medical, Babupeth, Chandrapur-442401', 105, 288, { align: 'center' });
        doc.text('Contact: +91 8899113105 | Email: pathotrickshome@gmail.com', 105, 293, { align: 'center' });
        
        // Save the PDF
        doc.save(`PathoTricks_Report_${data.patientName}_${formatDate(data.date)}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Function to check server health
async function checkServerHealth() {
    try {
        const response = await fetch('http://localhost:3002/health', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error('Server health check failed');
        }

        console.log('Server health check passed:', data);
        return true;

    } catch (error) {
        console.error('Server health check failed:', error);
        showServerOfflineMessage();
        return false;
    }
}

function showServerOfflineMessage() {
    const message = `
        <div class="server-offline-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Server Connection Failed</h3>
            <p>Please ensure the server is running:</p>
            <ol>
                <li>Open terminal in project directory</li>
                <li>Run: npm install (if not done)</li>
                <li>Run: npm start</li>
            </ol>
            <button onclick="retryConnection()" class="retry-btn">
                <i class="fas fa-sync"></i> Retry Connection
            </button>
        </div>
    `;

    // Find appropriate container to show message
    const container = document.querySelector('.main-content') || document.body;
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = message;
    container.prepend(messageDiv);
}

async function retryConnection() {
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
        location.reload();
    }
}

// Add these styles to your CSS
const styles = `
.server-offline-message {
    background: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 8px;
    padding: 20px;
    margin: 20px;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.server-offline-message i {
    font-size: 48px;
    color: #856404;
    margin-bottom: 15px;
}

.server-offline-message h3 {
    color: #856404;
    margin-bottom: 10px;
}

.server-offline-message ol {
    text-align: left;
    margin: 15px auto;
    max-width: 300px;
}

.retry-btn {
    background: #856404;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.retry-btn:hover {
    background: #6d5204;
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Check server health when page loads
document.addEventListener('DOMContentLoaded', checkServerHealth);

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        // Check server health first
        const isServerHealthy = await checkServerHealth();
        if (!isServerHealthy) {
            throw new Error('Server is not running. Please start the server and try again.');
        }

        const form = event.target;
        const selectedTests = Array.from(document.querySelectorAll('input[name="test"]:checked'));
        
        if (!selectedTests.length) {
            alert('Please select at least one test');
            return;
        }
        
        if (form.checkValidity()) {
            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            // Collect form data
            const patientData = {
                date: new Date().toISOString().split('T')[0],
                serialNumber: document.getElementById('serialNumber').value,
                patientName: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                gender: document.getElementById('gender').value,
                contactNumber: document.getElementById('contact').value,
                email: document.getElementById('email').value || '',
                address: document.getElementById('address').value || '',
                selectedTests: selectedTests.map(test => test.parentElement.textContent.trim()),
                totalAmount: parseFloat(document.getElementById('summaryTotalAmount').textContent.replace('₹', '')),
                discountAmount: parseFloat(document.getElementById('summaryDiscount').textContent.replace('₹', '')),
                finalAmount: parseFloat(document.getElementById('summaryFinalAmount').textContent.replace('₹', ''))
            };

            // Send data to server with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            try {
                const response = await fetch('http://localhost:3002/api/patients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(patientData),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to save patient data');
                }

                // Show success message
                alert('Patient data saved successfully!');
                
                // Generate PDF
                await generatePDF(patientData);
                
                // Reset form
                form.reset();
                document.getElementById('serialNumber').value = generateSerialNumber();
                updateSummary();

                // Redirect to home page after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                throw fetchError;
            }

        } else {
            // Show validation messages
            const invalidInputs = form.querySelectorAll(':invalid');
            invalidInputs.forEach(input => validateInput(input));
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error: ' + error.message);
    } finally {
        // Reset button state if it exists
        const submitBtn = form.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Patient Data';
            submitBtn.disabled = false;
        }
    }
}

// Function to validate input
function validateInput(input) {
    const validationMessage = input.nextElementSibling;
    if (validationMessage && validationMessage.classList.contains('validation-message')) {
        validationMessage.style.display = input.validity.valid ? 'none' : 'block';
    }
}