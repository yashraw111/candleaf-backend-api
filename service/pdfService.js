import PDFDocument from 'pdfkit';

function buildInvoicePDF(order, user) {
  // Return a Promise to handle the asynchronous nature of PDF generation
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData); // Resolve the promise with the PDF buffer
    });

    // --- PDF Content Generation (your existing code is perfect) ---
    doc.fontSize(20).text('Candleaf Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: #${order.id}`);
    doc.text(`Order Date: ${new Date().toLocaleDateString()}`); // Use current date for new order
    doc.moveDown(2);
    doc.fontSize(14).text('Bill To:', { underline: true });
    doc.fontSize(12).text(user.username).text(order.shipping_address);
    doc.moveDown(2);
    const tableTop = doc.y;
    doc.fontSize(12).text('Product', 50, tableTop);
    doc.text('Quantity', 280, tableTop, { width: 90, align: 'right' });
    doc.text('Price', 370, tableTop, { width: 90, align: 'right' });
    doc.text('Total', 0, tableTop, { align: 'right' });
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
    let position = tableTop + 30;
    order.items.forEach(item => {
        const itemPrice = item.pr_price || item.price; // Handle price field inconsistency
        doc.fontSize(10).text(item.pr_name, 50, position);
        doc.text(item.quantity, 280, position, { width: 90, align: 'right' });
        doc.text(`$${itemPrice.toFixed(2)}`, 370, position, { width: 90, align: 'right' });
        doc.text(`$${(itemPrice * item.quantity).toFixed(2)}`, 0, position, { align: 'right' });
        position += 25;
    });
    doc.moveTo(50, position).lineTo(550, position).stroke();
    doc.moveDown(2);
    doc.fontSize(14).text(`Total: $${order.total_amount.toFixed(2)}`, { align: 'right' });
    // --- End of PDF Content ---

    doc.end();
  });
}

export { buildInvoicePDF };