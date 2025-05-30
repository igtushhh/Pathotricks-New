// Define the complete test list
const allTests = [
    { name: 'Albumin', price: 100 },
    { name: 'Alkaline Phosphate', price: 150 },
    { name: 'Amylase', price: 500 },
    { name: 'Bilirubin', price: 150 },
    { name: 'Blood Group', price: 80 },
    { name: 'Cholesterol', price: 200 },
    { name: 'Complete Blood Test', price: 300 },
    { name: 'Covid-19', price: 300 },
    { name: 'Creatinine', price: 100 },
    { name: 'CRP(C-Reactive Protein)', price: 400 },
    { name: 'DCT(Coombs)', price: 300 },
    { name: 'Dengue', price: 800 },
    { name: 'Differential Leucocyte Count', price: 100 },
    { name: 'HB-Electrophoresis', price: 800 },
    { name: 'HBSAG', price: 250 },
    { name: 'HCV', price: 200 },
    { name: 'HDL(High Density Lipoprotin)', price: 150 },
    { name: 'Hemoglobin', price: 80 },
    { name: 'HIV', price: 200 },
    { name: 'HPLC', price: 1000 },
    { name: 'ICT(Coombs)', price: 300 },
    { name: 'KFT', price: 250 },
    { name: 'LFT(Liver Function Test)', price: 550 },
    { name: 'Lipase', price: 600 },
    { name: 'Lipid Profile', price: 450 },
    { name: 'Malaria Antigen', price: 150 },
    { name: 'Platelet Count', price: 100 },
    { name: 'Protein', price: 100 },
    { name: 'PS for MP', price: 100 },
    { name: 'PS for Opinion', price: 200 },
    { name: 'Retic Count', price: 300 },
    { name: 'Scrus Typhus', price: 800 },
    { name: 'SGOT', price: 100 },
    { name: 'SGPT', price: 100 },
    { name: 'Sicking Test', price: 250 },
    { name: 'Sodium/Potasium', price: 450 },
    { name: 'Stool Routine', price: 300 },
    { name: 'Stool Routine(Reducing Substance)', price: 400 },
    { name: 'Stool Routine(Reducing Occult Blood)', price: 400 },
    { name: 'Stool Routine(RS 40B)', price: 500 },
    { name: 'TFT(Thyroid Function Test) T3', price: 150 },
    { name: 'TFT(Thyroid Function Test) T4', price: 150 },
    { name: 'TFT(Thyroid Function Test) TSH', price: 150 },
    { name: 'Total Leucocyte Count', price: 100 },
    { name: 'Triglyceride', price: 150 },
    { name: 'Urea', price: 150 },
    { name: 'Urine Routine', price: 80 },
    { name: 'VDRL', price: 150 },
    { name: 'Widal', price: 150 }
];

// Update summary function
function updateSummary() {
    const total = calculateTotal();
    const discount = calculateDiscount();
    const final = calculateFinalAmount();

    document.getElementById('totalAmount').textContent = `₹${total}`;
    document.getElementById('discountAmount').textContent = `₹${discount}`;
    document.getElementById('finalAmount').textContent = `₹${final}`;
}

// Populate tests function
function populateTests() {
    console.log("Populating tests..."); // Debug log
    const testList = document.getElementById('testList');
    if (!testList) {
        console.error('Test list container not found!');
        return;
    }
    
    testList.innerHTML = ''; // Clear existing content

    // Sort tests alphabetically
    const sortedTests = [...allTests].sort((a, b) => a.name.localeCompare(b.name));

    // Create test items
    sortedTests.forEach(test => {
        const testDiv = document.createElement('div');
        testDiv.className = 'test-item';
        testDiv.innerHTML = `
            <div class="test-item-content">
                <label class="test-label" title="${test.name}">
                    <input type="checkbox" value="${test.name}" data-price="${test.price}">
                    <span class="test-name">${test.name}</span>
                    <span class="test-price">₹${test.price}</span>
                </label>
            </div>
        `;

        // Add change event listener to checkbox
        const checkbox = testDiv.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            updateSelectedTests();
            updateSummary();
        });

        testList.appendChild(testDiv);
    });

    console.log(`Populated ${sortedTests.length} tests`); // Debug log
}

// Search functionality
function filterTests() {
    const searchText = document.getElementById('searchTests').value.toLowerCase();
    const testItems = document.querySelectorAll('.test-item');
    
    testItems.forEach(item => {
        const testName = item.querySelector('.test-name').textContent.toLowerCase();
        const matches = testName.includes(searchText);
        item.style.display = matches ? 'flex' : 'none';
        // Add/remove highlight class
        item.classList.toggle('highlight', matches && searchText.length > 0);
    });
}

// Function to generate serial number from server
async function generateSerialNumber() {
    try {
        const response = await fetch('http://localhost:3002/api/next-serial-number');
        if (!response.ok) {
            throw new Error('Failed to generate serial number');
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to generate serial number');
        }
        console.log('Generated serial number:', data.serialNumber);
        return data.serialNumber;
    } catch (error) {
        console.error('Error generating serial number:', error);
        throw error;
    }
}

// Function to validate serial number
function validateSerialNumber(serialNumber) {
    if (!serialNumber) return false;
    
    // Clean the serial number
    const cleanSerialNumber = serialNumber.trim().replace(/\s+/g, '');
    
    // Check basic format PT-YYYYMMDDXXXXX or PTYYYYMMDDXXXXX
    if (!/^PT[-]?\d{8}\d{5}$/.test(cleanSerialNumber)) {
        throw new Error(`Invalid serial number format: ${serialNumber}. Expected format: PT-YYYYMMDDXXXXX`);
    }
    
    // Extract date and count
    const dateStr = cleanSerialNumber.slice(cleanSerialNumber.indexOf('PT') + 2).replace('-', '').slice(0, 8);
    const count = parseInt(cleanSerialNumber.slice(-5));
    
    // Validate count
    if (count > 99999) {
        throw new Error('Patient number exceeds daily limit');
    }
    
    // Validate date
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month - 1, day);
    
    const isValidDate = !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        (date.getMonth() + 1) === month &&
        date.getDate() === day;

    if (!isValidDate) {
        throw new Error('Invalid date in serial number');
    }
    
    // Return standardized format
    return `PT-${dateStr}${count.toString().padStart(5, '0')}`;
}

// Function to initialize form
async function initializeForm() {
    try {
        // Generate initial serial number
        const serialNumber = await generateSerialNumber();
        if (serialNumber) {
            const serialNumberInput = document.getElementById('serialNumber');
            if (serialNumberInput) {
                serialNumberInput.value = serialNumber;
                // Make it read-only to prevent manual changes
                serialNumberInput.readOnly = true;
            }
        }
    } catch (error) {
        console.error('Error initializing form:', error);
        showNotification('Error generating serial number. Please try again.', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Populate tests first
        populateTests();
        
        // Add search functionality
        const searchInput = document.getElementById('searchTests');
        if (searchInput) {
            searchInput.addEventListener('input', filterTests);
        }

        // Initialize form with serial number
        await initializeForm();
        
        // Add form submit handler
        const form = document.getElementById('patientForm');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }

        // Add change event listener to test checkboxes
        document.querySelectorAll('.test-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedTests);
        });
        
        // Add event listener to validate serial number on input
        const serialNumberInput = document.getElementById('serialNumber');
        if (serialNumberInput) {
            serialNumberInput.addEventListener('input', (e) => {
                try {
                    validateSerialNumber(e.target.value);
                    e.target.setCustomValidity('');
                } catch (error) {
                    e.target.setCustomValidity(error.message);
                }
            });
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showNotification('Error initializing page. Please refresh.', 'error');
    }
});

// Helper function to generate serial number
function getSelectedTests() {
    const selectedTests = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        selectedTests.push({
            name: checkbox.value,
            price: parseInt(checkbox.dataset.price)
        });
    });
    return selectedTests;
}

function calculateTotal() {
    let total = 0;
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        total += parseInt(checkbox.dataset.price);
    });
    return total;
}

function calculateDiscount() {
    const total = calculateTotal();
    return Math.round(total * 0.25); // 25% discount
}

function calculateFinalAmount() {
    const total = calculateTotal();
    const discount = calculateDiscount();
    return total - discount;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <div class="notification-progress"></div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Form submission handler
async function handleSubmit(event) {
    event.preventDefault();
    
    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        // Get and validate serial number
        const serialNumber = document.getElementById('serialNumber').value;
        console.log('Serial number:', serialNumber); // Debug log

        try {
            validateSerialNumber(serialNumber);
        } catch (error) {
            throw new Error(`Invalid serial number: ${error.message}`);
        }

        // Validate selected tests
        const selectedTests = getSelectedTests();
        if (selectedTests.length === 0) {
            throw new Error('Please select at least one test');
        }

        // Prepare form data
        const formData = {
            serialNumber: serialNumber,
            patientName: document.getElementById('name').value,
            age: parseInt(document.getElementById('age').value),
            gender: document.getElementById('gender').value,
            contactNumber: document.getElementById('contact').value,
            email: document.getElementById('email').value || '',
            address: document.getElementById('address').value || '',
            selectedTests: selectedTests,
            totalAmount: calculateTotal(),
            discountAmount: calculateDiscount(),
            finalAmount: calculateFinalAmount(),
            status: 'pending',
            date: new Date()
        };

        // Log the data being sent
        console.log('Sending data:', formData);

        // Send data to server
        const response = await fetch('http://localhost:3002/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Check response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save patient data');
        }

        const savedData = await response.json();
        console.log('Saved data:', savedData);

        // Show success message
        showNotification('Patient data saved successfully', 'success');
        
        // Reset form
        event.target.reset();
        
        // Reset test selections
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Update summary
        updateSummary();
        
        // Generate new serial number
        await initializeForm();
        
    } catch (error) {
        console.error('Error saving patient:', error);
        showNotification(error.message, 'error');
    } finally {
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Update the Patient model schema
const patientSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                // Validate format: YYYY-MM-DD-XXXX
                return /^\d{4}-\d{2}-\d{2}-\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid serial number format!`
        }
    },
    // ... rest of the schema
});

// Add this function to test serial number generation
function testSerialNumberGeneration() {
    console.log('Testing serial number generation...');
    
    // Generate multiple serial numbers
    for (let i = 0; i < 5; i++) {
        const serialNumber = generateSerialNumber();
        console.log(`Generated serial number ${i + 1}: ${serialNumber}`);
    }

    // Test date change
    localStorage.removeItem('lastSerialDate');
    localStorage.removeItem('serialCount');
    console.log('After resetting localStorage:', generateSerialNumber());
}

// Call this in development to test
if (process.env.NODE_ENV === 'development') {
    testSerialNumberGeneration();
}

function updateSelectedTests() {
    const selectedTests = getSelectedTests();
    const selectedTestsList = document.getElementById('selectedTestsList');
    
    selectedTestsList.innerHTML = selectedTests.map(test => `
        <div class="selected-test-item">
            <span class="test-name">${test.name}</span>
            <span class="test-price">₹${test.price}</span>
            <i class="fas fa-times remove-test" onclick="removeTest('${test.name}')"></i>
        </div>
    `).join('');
    
    // Update totals
    updateSummary();
}

function removeTest(testName) {
    const checkbox = document.querySelector(`input[value="${testName}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateSelectedTests();
    }
}