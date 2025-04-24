// InvoiceManagement/utils.js

// Generate a unique invoice number based on the year
export const generateInvoiceNumber = async (date) => {
    try {
      const year = new Date(date).getFullYear();
      const yearPrefix = year.toString().slice(-2); // Last two digits of the year
      
      // Get all existing invoices to find the highest number for this year
      const existingInvoices = await window.electronAPI.getInvoices();
      
      // Filter invoices from the current year and extract their numbers
      const currentYearInvoices = existingInvoices
        .filter(inv => inv.number.startsWith(yearPrefix))
        .map(inv => parseInt(inv.number.substring(2))); // Extract the numeric part
      
      // Find the highest number
      let maxNumber = 0;
      if (currentYearInvoices.length > 0) {
        maxNumber = Math.max(...currentYearInvoices);
      }
      
      // Generate next number
      const nextNumber = maxNumber + 1;
      
      // Format: YY + sequential number padded to 4 digits
      const invoiceNumber = `${yearPrefix}${nextNumber.toString().padStart(4, '0')}`;
      
      console.log(`Generated invoice number: ${invoiceNumber}`);
      return invoiceNumber;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error; // Rethrow so the caller knows there was a problem
    }
  };

// Calculate totals for an invoice line item
export const calculateLineTotals = (item) => {
  try {
      const unitPrice = parseFloat(item?.unitPrice) || 0;
      const units = parseInt(item?.units) || 0;
      const discount = parseFloat(item?.discount) || 0;
      // Make VAT optional with default value of 0
      const vat = item?.vat !== undefined ? parseFloat(item.vat) : 0;

      const subtotal = unitPrice * units;
      const discountAmount = subtotal * (discount / 100);
      const vatAmount = (subtotal - discountAmount) * (vat / 100);

      return {
          subtotal: subtotal - discountAmount,
          vat: vatAmount,
          discount: discountAmount,
          total: subtotal - discountAmount + vatAmount
      };
  } catch (error) {
      console.error('Error calculating line totals:', error);
      return { subtotal: 0, vat: 0, total: 0 };
  }
};

// Calculate totals for an entire invoice
export const calculateInvoiceTotals = (items) => {
  try {
      if (!Array.isArray(items)) return { subtotal: 0, vat: 0, total: 0 };

      return items.reduce((acc, item) => {
          const lineTotals = calculateLineTotals(item);
          return {
              subtotal: (acc.subtotal || 0) + lineTotals.subtotal,
              vat: (acc.vat || 0) + lineTotals.vat,
              total: (acc.total || 0) + lineTotals.total
          };
      }, { subtotal: 0, vat: 0, total: 0 });
  } catch (error) {
      console.error('Error calculating invoice totals:', error);
      return { subtotal: 0, vat: 0, total: 0 };
  }
};

// Format currency
export const formatCurrency = (amount) => {
  try {
      const number = parseFloat(amount);
      if (isNaN(number)) return '0.00 €';
      
      return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR'
      }).format(number);
  } catch (error) {
      console.error('Error formatting currency:', error);
      return '0.00 €';
  }
};

// Format date
export const formatDate = (dateString) => {
  try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      return date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
      });
  } catch (error) {
      console.error('Error formatting date:', error);
      return '';
  }
};


// Filter invoices based on search criteria (status)
export const filterInvoices = (invoices, searchParams) => {
    try {
        if (!Array.isArray(invoices)) return [];
        if (!searchParams) return invoices;
  
        return invoices.filter(invoice => {
            // Filter by name
            const matchesName = !searchParams.name || 
                (invoice?.patientName || '').toLowerCase().includes(searchParams.name.toLowerCase());
            
            // Filter by date range
            const invoiceDate = new Date(invoice?.date || '');
            const fromDate = searchParams.dateFrom ? new Date(searchParams.dateFrom) : null;
            const toDate = searchParams.dateTo ? new Date(searchParams.dateTo) : null;
            
            const matchesDateRange = (!fromDate || !isNaN(invoiceDate.getTime()) && invoiceDate >= fromDate) && 
                (!toDate || !isNaN(invoiceDate.getTime()) && invoiceDate <= toDate);
  
            // Filter by status
            const matchesStatus = !searchParams.status || searchParams.status === 'all' || 
                invoice.status === searchParams.status || 
                (searchParams.status === 'paid' && invoice.status === 'completed'); // Handle 'paid' status alias for 'completed'
  
            return matchesName && matchesDateRange && matchesStatus;
        });
    } catch (error) {
        console.error('Error filtering invoices:', error);
        return [];
    }
  };

// Calculate totals for filtered invoices
export const calculateFilteredTotals = (invoices) => {
  try {
      if (!Array.isArray(invoices)) return { count: 0, total: 0 };

      return invoices.reduce((acc, invoice) => ({
          count: acc.count + 1,
          total: acc.total + (parseFloat(invoice?.totalAmount) || 0)
      }), { count: 0, total: 0 });
  } catch (error) {
      console.error('Error calculating filtered totals:', error);
      return { count: 0, total: 0 };
  }
};