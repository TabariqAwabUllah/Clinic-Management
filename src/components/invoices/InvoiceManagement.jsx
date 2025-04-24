// InvoiceManagement/index.jsx
import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Upload } from 'lucide-react';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import InvoiceSearch from './InvoiceSearch';
import { generateInvoiceNumber, filterInvoices, calculateFilteredTotals } from './utils';
import * as XLSX from 'xlsx';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchParams, setSearchParams] = useState({
    name: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
  });

  useEffect(() => {
    loadInvoices();
    loadPatients();
    loadServices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await window.electronAPI.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const data = await window.electronAPI.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadServices = async () => {
    try {
      const data = await window.electronAPI.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleCreateInvoice = async (invoiceData) => {
    try {
      console.log("Print 1 in handle Create Invoice");
      
      // Generate a unique invoice number in the frontend
      // const invoiceNumber = await generateInvoiceNumber(invoiceData.date);
      const newInvoice = {
        ...invoiceData,
        // number: invoiceNumber
      };
      console.log("Print 2 in handle Create Invoice");

      await window.electronAPI.addInvoice(newInvoice);

      console.log("Print 3 in handle Create Invoice");
      await loadInvoices();
      console.log("Print 4 Done in handle Create Invoice");
      setShowForm(false);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      
      
    }
  };

  const handleEditInvoice = async (invoiceData) => {

    try {
      console.log("print 1 in edit invoice");
      
      await window.electronAPI.updateInvoice({
        ...invoiceData,
        id: editingInvoice.id
      });
      console.log("print 2 in edit invoice");
      await loadInvoices();
      console.log("print 3  in edit invoice");
      setShowForm(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      // alert(`Error saving invoice: Enter Price and unit`);
    }
  };

  const handleEdit = (invoice) => {
    console.log("Editing invoice:", invoice);
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await window.electronAPI.deleteInvoice(id);
        await loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };


  const formatDateToDD_MM_YYYY = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        await window.electronAPI.updateInvoiceStatus(id, 'cancelled');
        await loadInvoices(); // Refresh the data
        return; // Exit the function to prevent toggling
      }

      await window.electronAPI.updateInvoiceStatus(id, newStatus);
      await loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  // Filter invoices based on search parameters
  const filteredInvoices = filterInvoices(invoices, searchParams);
  const searchTotals = calculateFilteredTotals(filteredInvoices);

  const handleExportToExcel = () => {
    // console.log("invoices 23",invoices);
      
    // const exportData = filteredInvoices.map(invoice => ({
    //   'number': invoice.number,
    //   'patientName': invoice.patientName,
    //   'date': new Date(invoice.date).toISOString().split('T')[0],
    //   'services': invoice.services,
    //   'items': invoice.items.map(item => ({
    //    'service':item.service,
    //    'serviceName': item.serviceName,
    //    'unitPrice': item.unitPrice,
    //    'length': item.length,
    //   })),
    //   'taxableAmount': invoice.taxableAmount,
    //   'vatAmount': invoice.vatAmount,
    //   'totalAmount': invoice.totalAmount,
    //   'status': invoice.status,
    //   'patientId': invoice.patientId,
    // }));
    
    const exportData = filteredInvoices.flatMap(invoice => 
      invoice.items.map((item, index) => ({
        'number': index === 0 ? invoice.number : '', // Only show invoice number in the first row
        'patientName': index === 0 ? invoice.patientName : '',
        'date': index === 0 ? formatDateToDD_MM_YYYY(invoice.date) : '',
        'services': index === 0 ? invoice.services : '',
        'id': index === 0 ? invoice.id : '',
        'description': item.description || '',
        'discount': item.discount || '',
        'service': item.service || '',
        'serviceName': item.serviceName || '',
        'unitPrice': item.unitPrice || '',
        'units': item.units || '',
        'vat': item.vat || '',
        'discountAmount': index ===0 ? invoice.discountAmount : '',
        'taxableAmount': index === 0 ? invoice.taxableAmount : '',
        'vatAmount': index === 0 ? invoice.vatAmount : '',
        'totalAmount': index === 0 ? invoice.totalAmount : '',
        'status': index === 0 ? invoice.status : '',
        'patientId': index === 0 ? invoice.patientId : '',
        'patientDNI': index === 0 ? invoice.patientDNI : '',
      }))
    );
    
    // console.log("exportData",exportData);
    
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 15 }, // number
      { wch: 20 }, // Patient Name
      { wch: 15 }, // Date
      { wch: 20 }, // services
      { wch: 40 }, // services
      { wch: 10 },  // taxable
      { wch: 10 },  // vattaxable
      { wch: 10 },  // total
      { wch: 10 },  // status
      { wch: 10 },  // P DNI
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    
    const date = new Date().toISOString().split('T')[0];

    XLSX.writeFile(wb, `Invoices_list_${date}.xlsx`);
  };


  const formatDateForDatabase = (dateString) => {
    try {
      // Check if it's already in DD/MM/YYYY format
      if (typeof dateString === 'string' && dateString.includes('/')) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD for database
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
      }
      
      // Handle Excel date (could be a number or date object)
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        // Valid date - format as YYYY-MM-DD
        return date.toISOString().split('T')[0];
      }
      
      return dateString; // Return as is if can't parse
    } catch (error) {
      console.error("Error formatting date from Excel:", dateString, error);
      return dateString;
    }
  };

  const handleImportExcel = async (event) => {
    console.log("print 1");
    
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      console.log("Print 2");
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("jsonData", jsonData);
        console.log("print 3 in imprt");
        
        // Get existing invoices from database
        const existingInvoices = await window.electronAPI.getInvoices();
        const existingInvoiceNumbers = new Set(existingInvoices.map(inv => inv.number));
        
        console.log("existingInvoiceNumbers", existingInvoiceNumbers);
        console.log("print 4 in imprt");
        
        // Group by invoice number
        const invoiceGroups = {};
        let lastInvoiceNumber = null;
        
        jsonData.forEach(row => {
          // Get invoice number from row or use last one if this row is a continuation
          let invoiceNumber = row['number']?.toString().trim() || '';
          
          // If this row doesn't have an invoice number but we've seen one before,
          // it's likely a secondary item for the last invoice
          if (!invoiceNumber && lastInvoiceNumber) {
            invoiceNumber = lastInvoiceNumber;
          }
          
          // Skip if no invoice number (shouldn't happen with our logic now)
          if (!invoiceNumber) {
            console.log("Skipping row with no invoice number:", row);
            return;
          }
          
          // Remember this invoice number for potential next rows
          lastInvoiceNumber = invoiceNumber;
          
          // Skip if this invoice number already exists in database
          if (existingInvoiceNumbers.has(invoiceNumber)) {
            return;
          }
          
          // Create a new invoice group if it doesn't exist
          if (!invoiceGroups[invoiceNumber]) {
            invoiceGroups[invoiceNumber] = {
              number: invoiceNumber,
              patientName: row['patientName']?.toString() || '',
              date: row['date'] ? formatDateForDatabase(row['date']) : '',
              services: row['services']?.toString() || '',
              id: row['id'] || '',
              taxableAmount: row['taxableAmount'] || 0,
              vatAmount: row['vatAmount'] || 0,
              totalAmount: row['totalAmount'] || 0,
              discountAmount: row['discountAmount'] || 0,
              status: row['status']?.toString().toLowerCase() || 'pending',
              patientId: row['patientId'] || '',
              patientDNI: row['patientDNI']?.toString() || '',
              items: []
            };
          }
          
          // Always add the item data if it has any relevant fields
          if (row['service'] || row['serviceName'] || row['unitPrice']) {
            invoiceGroups[invoiceNumber].items.push({
              description: row['description'] || '',
              discount: row['discount'] || 0,
              service: row['service'] || '',
              serviceName: row['serviceName']?.toString() || '',
              unitPrice: row['unitPrice'] || '',
              units: row['units'] || '',
              vat: row['vat'] || ''
            });
          }
        });
        
        // Convert groups to array
        const formattedInvoices = Object.values(invoiceGroups);
        
        console.log("print 6 in imprt");
        console.log("formattedInvoices", formattedInvoices);
        
        // Check if we have any invoices to import
        if (formattedInvoices.length === 0) {
          alert("No new invoices to import. All invoice numbers already exist in the database.");
          return;
        }
        
        // Insert new invoices
        for (const invoice of formattedInvoices) {
          await window.electronAPI.addInvoice(invoice);
        }
        
        console.log("print 7 in imprt");
        
        // Calculate unique invoice numbers in jsonData for better statistics
        const uniqueInvoiceNumbersInImport = new Set();
        jsonData.forEach(row => {
          const num = row['number']?.toString().trim();
          if (num) uniqueInvoiceNumbersInImport.add(num);
        });
        
        const skippedCount = uniqueInvoiceNumbersInImport.size - formattedInvoices.length;
        
        alert(`Imported ${formattedInvoices.length} new invoices with all items. Skipped ${skippedCount} existing invoices.`);
        console.log("print 8 in imprt");
        
        await loadInvoices();
        event.target.value = null; // Reset the file input
      };
      
      console.log("print 9 in imprt");
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing invoices:', error);
      alert('Error importing invoices. Please check the file format.', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              Import Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Search */}
      <InvoiceSearch
        searchParams={searchParams}
        onSearchChange={setSearchParams}
        totals={searchTotals}
      />

      {/* Form or List */}
      {showForm ? (
        <InvoiceForm
          patients={patients}
          services={services}
          onSubmit={editingInvoice ? handleEditInvoice : handleCreateInvoice}
          onCancel={handleCancel}
          initialData={editingInvoice}
        />
      ) : (
        <InvoiceList
          invoices={filteredInvoices}
          onDelete={handleDeleteInvoice}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          formatDate={formatDateToDD_MM_YYYY}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;