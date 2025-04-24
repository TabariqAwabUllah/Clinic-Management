import React, { useState } from 'react';
import { Edit, Trash2, Printer, CheckCircle, XCircle } from 'lucide-react';
import PrintInvoice from './PrintInvoice';

const InvoiceList = ({ invoices, onDelete, onEdit, onStatusChange, formatDate }) => {
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // const formatDate = (dateString) => {
  //   return new Date(dateString).toLocaleDateString('es-ES', {
  //     year: 'numeric',
  //     month: '2-digit',
  //     day: '2-digit'
  //   });
  // };



// const formatDate = (dateString) => {
//   const date = new Date(dateString);
//   // Format as DD/MM/YYYY
//   const day = date.getDate().toString().padStart(2, '0');
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const year = date.getFullYear();
  
//   return `${day}/${month}/${year}`;
// };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setPrintModalOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxable Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {console.log("invoices before map in list",invoices)}
              {invoices.map((invoice, in_i) => (
                <tr 
                  key={invoice.id}
                  className={`hover:bg-gray-50 ${
                    invoice.status === 'pending' ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.number}
                    {/* {console.log("invoice ",in_i,":", invoice ,"invoice.number: ",invoice.number )} */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate">
                      {invoice.services || 'No services listed'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.taxableAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.vatAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.discountAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatusClasses(invoice.status)
                    }`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      {/* Print button */}
                      <button
                        onClick={() => handlePrint(invoice)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Edit button */}
                      {/* { invoice.status === 'pending' &&( */}
                      <button
                        onClick={() => onEdit(invoice)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {/* )} */}

                      {/* Mark as Paid button */}
                      {/* it only appears if the invoice is neither "completed" nor "cancelled". */}
                      {invoice.status !== 'completed' && invoice.status !== 'cancelled' &&(
                        <button
                          onClick={() => onStatusChange(invoice.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cancel button */}
                      {invoice.status !== 'cancelled' && (
                        <button
                          onClick={() => onStatusChange(invoice.id, 'cancelled')}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Invoice"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => onDelete(invoice.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No invoices found
            </div>
          )}
        </div>
      </div>

      {printModalOpen && selectedInvoice && (
        <PrintInvoice
          invoice={selectedInvoice}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </>
  );
};

export default InvoiceList;