// Initialize jsPDF
window.jsPDF = window.jspdf.jsPDF;

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// Function to generate PDF
window.generatePDF = async function(data) {
    try {
        // Check if user is admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            throw new Error('Only administrators can generate PDF reports');
        }

        // Create new document (in portrait, measurements in mm)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add letterhead
        doc.setFontSize(24);
        doc.setTextColor(128, 0, 128); // Purple color for Dal Path diagnostics
        doc.text('Dal Path diagnostics', doc.internal.pageSize.width / 2, 20, { align: 'center' });

        // Add patient details section (left side)
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Name:', 15, 40);
        doc.text(data.patientName, 50, 40);
        
        doc.text('Referred By:', 15, 46);
        doc.text('Dr. Manju', 50, 46); // You can make this dynamic if needed
        
        doc.text('Age / Gender:', 15, 52);
        doc.text(`${data.age} / ${data.gender}`, 50, 52);

        // Add report details (right side)
        doc.text('Report ID:', doc.internal.pageSize.width - 80, 40);
        doc.text(data.serialNumber, doc.internal.pageSize.width - 40, 40);
        
        doc.text('Sampling Date:', doc.internal.pageSize.width - 80, 46);
        doc.text(formatDate(data.date), doc.internal.pageSize.width - 40, 46);
        
        doc.text('Report Date:', doc.internal.pageSize.width - 80, 52);
        doc.text(formatDate(data.date), doc.internal.pageSize.width - 40, 52);

        // Add TEST REPORT heading
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('TEST REPORT', doc.internal.pageSize.width / 2, 65, { align: 'center' });

        // Add table headers
        const headers = ['Test Name', 'Result', 'Ref Range', 'Unit'];
        let startY = 75;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Draw header line
        doc.line(15, startY, doc.internal.pageSize.width - 15, startY);
        
        // Add headers
        doc.text(headers[0], 15, startY + 5);
        doc.text(headers[1], 90, startY + 5);
        doc.text(headers[2], 120, startY + 5);
        doc.text(headers[3], 170, startY + 5);
        
        // Draw header bottom line
        doc.line(15, startY + 7, doc.internal.pageSize.width - 15, startY + 7);

        // Add test results with proper hierarchy
        let currentY = startY + 15;
        
        // Example of Complete Blood Count (CBC) with hierarchy
        doc.setFont('helvetica', 'bold');
        doc.text('Complete Blood Count (CBC)', 15, currentY);
        currentY += 7;
        
        doc.setFont('helvetica', 'normal');
        const cbcTests = [
            { name: 'Haemoglobin (HB)', result: '16', range: 'Male : 14 to 18\nFemale : 11 to 14\nchild : 8 to 11', unit: 'gms/dl' },
            { name: 'Total WBC Count (TC)', result: '5000', range: '4000 to 11000', unit: 'c/cumm' },
            { name: 'Differential Count (DC)', result: '', range: '', unit: '' },
            { name: '  Neutrophils', result: '46', range: '43 to 76', unit: '%' },
            { name: '  Lymphosites', result: '12', range: '20 to 50', unit: '%' },
            { name: '  Eosinophils', result: '30', range: '00 to 05', unit: '%' },
            { name: '  Monocytes', result: '12', range: '00 to 08', unit: '%' },
            { name: '  Basophils', result: '1', range: '00 to 02', unit: '%' },
            { name: 'Red Blood Cells (RBC)', result: '5', range: '4.2 to 6.2', unit: 'millions/ml' },
            { name: 'Platelet Counts (PC)', result: '3', range: '1.4 to 4.5', unit: 'Lakhs/cumm' },
            { name: 'MCH', result: '29', range: '27 to 31', unit: 'pg' },
            { name: 'MCV', result: '90', range: '80 to 96', unit: 'fl' },
            { name: 'MCHC', result: '36', range: '32 to 37', unit: '%' },
            { name: 'PCV', result: '38', range: '37.0 to 47.0', unit: '%' }
        ];

        cbcTests.forEach(test => {
            // Handle subgroups with indentation
            const isSubgroup = test.name.startsWith('  ');
            const xPos = isSubgroup ? 25 : 15;
            
            doc.text(test.name, xPos, currentY);
            if (test.result) doc.text(test.result, 90, currentY);
            if (test.range) {
                const ranges = test.range.split('\n');
                ranges.forEach((range, index) => {
                    doc.text(range, 120, currentY + (index * 5));
                });
            }
            if (test.unit) doc.text(test.unit, 170, currentY);
            
            currentY += test.range.includes('\n') ? 15 : 7;
            
            // Add new page if needed
            if (currentY > doc.internal.pageSize.height - 40) {
                doc.addPage();
                currentY = 20;
            }
        });

        // Add signature section
        const footerY = doc.internal.pageSize.height - 35;
        
        // Add signature images (you'll need to replace these with actual signature images)
        doc.addImage('signature1.png', 'PNG', 30, footerY - 20, 40, 20);
        doc.addImage('signature2.png', 'PNG', doc.internal.pageSize.width - 70, footerY - 20, 40, 20);
        
        // Add signature lines and text
        doc.line(30, footerY, 70, footerY);
        doc.line(doc.internal.pageSize.width - 70, footerY, doc.internal.pageSize.width - 30, footerY);
        
        doc.text('Shiva', 40, footerY + 5);
        doc.text('Lab Technician', 35, footerY + 10);
        
        doc.text('Harish', doc.internal.pageSize.width - 60, footerY + 5);
        doc.text('Pathologist', doc.internal.pageSize.width - 65, footerY + 10);

        // Save the PDF
        const fileName = `${data.serialNumber}_${data.patientName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
};
