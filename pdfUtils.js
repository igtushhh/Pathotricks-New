// PDF Generation Utilities
class PDFGenerator {
    constructor() {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded');
        }
        this.jsPDF = window.jspdf.jsPDF;
    }

    // Create header section
    createHeader(doc, patient) {
        doc.setFillColor(44, 62, 80);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Pathotricks', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Clinical Medical Laboratory', 105, 30, { align: 'center' });

        // Add formatted serial number
        const serialDate = patient.serialNumber.slice(0, 6);
        const serialNum = patient.serialNumber.slice(7);
        const formattedDate = `${serialDate.slice(4,6)}/${serialDate.slice(2,4)}/${serialDate.slice(0,2)}`;
        
        doc.setFontSize(12);
        doc.text(`Serial No: ${patient.serialNumber}`, 15, 30);
        doc.text(`Date: ${formattedDate}`, doc.internal.pageSize.width - 15, 30, { align: 'right' });
    }

    // Create patient information section
    createPatientInfo(doc, patient) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text('Blood Test Report', 105, 50, { align: 'center' });

        const patientInfo = [
            ['Patient Name:', patient.patientName],
            ['Serial Number:', patient.serialNumber],
            ['Age/Gender:', `${patient.age} years / ${patient.gender.toUpperCase()}`],
            ['Contact:', patient.contactNumber],
            ['Report Date:', new Date().toLocaleDateString('en-IN')],
            ['Sample Collection:', new Date(patient.createdAt).toLocaleDateString('en-IN')]
        ];

        doc.autoTable({
            startY: 60,
            head: [],
            body: patientInfo,
            theme: 'plain',
            styles: { fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { cellWidth: 60 }
            }
        });
    }

    // Create test results section
    createTestResults(doc, tests) {
        const testHeaders = [['Test Name', 'Result', 'Normal Range', 'Units', 'Status']];
        const testData = tests.map(test => [
            test.name,
            test.result || '--',
            test.normalRange || this.getDefaultRange(test.name),
            test.units || this.getDefaultUnits(test.name),
            test.status || 'Pending'
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: testHeaders,
            body: testData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: {
                fillColor: [44, 62, 80],
                textColor: [255, 255, 255]
            },
            columnStyles: {
                4: {
                    fontStyle: 'bold',
                    halign: 'center'
                }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 4) {
                    const status = data.cell.raw.toLowerCase();
                    if (status === 'high') {
                        data.cell.styles.textColor = [192, 57, 43];
                    } else if (status === 'low') {
                        data.cell.styles.textColor = [41, 128, 185];
                    } else if (status === 'normal') {
                        data.cell.styles.textColor = [39, 174, 96];
                    }
                }
            }
        });
    }

    // Create footer section
    createFooter(doc) {
        const footerY = doc.internal.pageSize.height - 30;
        
        doc.setFontSize(10);
        doc.text('Authorized Signatory:', 14, footerY);
        doc.text('Dr. Pathotricks', 14, footerY + 10);

        doc.text('Laboratory Details:', 120, footerY);
        doc.setFontSize(8);
        doc.text('Pathotricks Clinical Medical Laboratory', 120, footerY + 5);
        doc.text('Contact: +91 8899113105', 120, footerY + 10);
        doc.text('Email: pathotrickshome@gmail.com', 120, footerY + 15);

        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('This is a computer-generated report and does not require physical signature.', 105, footerY + 20, { align: 'center' });
    }

    // Get default range for test
    getDefaultRange(testName) {
        const ranges = {
            'Hemoglobin': '13-17',
            'RBC Count': '4.5-5.5',
            'WBC Count': '4000-11000',
            'Platelets': '150000-450000',
            'Blood Sugar': '70-100',
            'Creatinine': '0.7-1.3',
            'Urea': '7-20',
            'SGPT': '7-56',
            'SGOT': '5-40',
            'Albumin': '3.5-5.5',
            'Total Protein': '6.0-8.3',
            'Cholesterol': '150-200'
        };
        return ranges[testName] || '--';
    }

    // Get default units for test
    getDefaultUnits(testName) {
        const units = {
            'Hemoglobin': 'g/dL',
            'RBC Count': 'million/µL',
            'WBC Count': 'cells/µL',
            'Platelets': '/µL',
            'Blood Sugar': 'mg/dL',
            'Creatinine': 'mg/dL',
            'Urea': 'mg/dL',
            'SGPT': 'U/L',
            'SGOT': 'U/L',
            'Albumin': 'g/dL',
            'Total Protein': 'g/dL',
            'Cholesterol': 'mg/dL'
        };
        return units[testName] || '--';
    }

    // Generate complete PDF
    async generateReport(patient) {
        try {
            const doc = new this.jsPDF();

            this.createHeader(doc, patient);
            this.createPatientInfo(doc, patient);
            this.createTestResults(doc, patient.selectedTests);
            this.createFooter(doc);

            const filename = `${patient.serialNumber}_blood_report.pdf`;
            doc.save(filename);
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }
}

// Export the class
window.PDFGenerator = PDFGenerator; 