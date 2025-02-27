function generatePDF(data) {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.width;
    const height = doc.internal.pageSize.height;

    // Background
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, width, height, 'F');

    // Header
    doc.setFillColor(89, 169, 195);
    doc.rect(0, 0, width, 45, 'F');
    doc.setFillColor(68, 136, 153);
    doc.roundedRect(0, 40, width, 15, 5, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('PathoTricks Home Pathology', width / 2, 25, { align: 'center' });

    // Patient Info
    doc.setFont('times', 'italic');
    doc.setFontSize(22);
    doc.setTextColor(68, 136, 153);
    doc.text('Patient Test Report', width / 2, 65, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    const patientInfo = [
        [`Serial Number: ${data.serialNumber}`, `Date: ${data.date}`],
        [`Patient Name: ${data.patientName}`, `Age: ${data.patientAge}`],
        [`Gender: ${data.patientGender}`, `Contact: ${data.patientContact}`],
        [`Email: ${data.patientEmail}`]
    ];

    let yPos = 100;
    patientInfo.forEach((row, index) => {
        doc.setFont('helvetica', index % 2 === 0 ? 'normal' : 'bold');
        if (row.length === 2) {
            doc.text(row[0], 25, yPos);
            doc.text(row[1], 120, yPos);
        } else {
            doc.text(row[0], 25, yPos);
        }
        yPos += 12;
    });

    // Selected Tests
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, width - 30, 80, 3, 3, 'F');
    doc.setDrawColor(89, 169, 195);
    doc.roundedRect(15, yPos, width - 30, 80, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(89, 169, 195);
    doc.text('Selected Tests', 20, yPos + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    yPos += 30;

    data.selectedTests.forEach((test) => {
        doc.text(`• ${test}`, 25, yPos);
        yPos += 10;
    });

    // Total Amount
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(15, yPos, width - 30, 25, 3, 3, 'F');
    doc.setDrawColor(89, 169, 195);
    doc.roundedRect(15, yPos, width - 30, 25, 3, 3, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(89, 169, 195);
    doc.text('Total Amount:', 25, yPos + 15);
    doc.text(data.totalAmount, width - 25, yPos + 15, { align: 'right' });

    // Footer
    doc.setFillColor(89, 169, 195);
    doc.rect(0, height - 30, width, 30, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('PathoTricks Sample Collection Center', width / 2, height - 20, { align: 'center' });
    doc.text('Beside ASIT Medical, Babupeth, Chandrapur-442401', width / 2, height - 15, { align: 'center' });
    doc.text('Contact: +91 8899113105 | Email: pathotrickshome@gmail.com', width / 2, height - 10, { align: 'center' });
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.text(`Generated on: ${timestamp}`, width - 25, height - 35, { align: 'right' });

    // Save the PDF
    doc.save(`${data.serialNumber}_${data.patientName}_report.pdf`);
} 