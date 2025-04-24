import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import logo from '../../assets/logo.png'

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full transform transition-all">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const PrintInvoice = ({ invoice, onClose }) => {
  const printRef = useRef();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateItemTotal = (item) => {
    const subtotal = (parseFloat(item.unitPrice) || 0) * (parseInt(item.units) || 0);
    const discountAmount = subtotal * ((parseFloat(item.discountRate) || 0) / 100);
    const vatAmount = (subtotal - discountAmount) * ((parseFloat(item.vatRate) || 0) / 100);
    return subtotal - discountAmount + vatAmount;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=900,height=600');
    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura #${invoice.number}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .company-info {
              margin-bottom: 20px;
            }
            .client-info {
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background-color: #f8f9fa;
              font-weight: 600;
            }
            .totals {
              width: 300px;
              margin-left: auto;
              margin-top: 20px;
            }
            .totals table {
              margin: 0;
            }
            .totals td {
              border: none;
            }
            .total-row {
              font-weight: bold;
              font-size: 1.1em;
              border-top: 2px solid #eee;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              text-align: center;
              color: #666;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vista Previa de Factura</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div ref={printRef} className="bg-white">
          <div className="invoice-container">
            <div className="header">
              <div className="company-info">
                <img src={logo} alt="Logo de la Empresa" className="h-12 mb-4" />
                <p className="text-gray-600">
                  Neurofeedback Barcelona<br />
                  Mare de Déu de la Salut, 78, 3E<br />
                  08024 Barcelona<br />
                  93 218 73 42<br />
                  info@neurofeedback.cat

                </p>
              </div>
              <div className="invoice-details">
                <h1 className="text-2xl font-bold mb-2">FACTURA</h1>
                <p>
                  <strong>Factura #:</strong> {invoice.number}<br />
                  <strong>Fecha:</strong> {formatDate(invoice.date)}<br />
                </p>
              </div>
            </div>

            <div className="client-info">
              <h3 className="text-lg font-semibold mb-2">Facturar a:</h3>
              <div className="text-gray-600">
                <p>
                  <strong>{invoice.patientName}</strong><br />
                  {invoice.patientDNI && `DNI: ${invoice.patientDNI}`}
                </p>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th className="text-right">Precio unidad</th>
                  <th className="text-right">Unidades</th>
                  <th className="text-right">IVA %</th>
                  <th className="text-right">Descuento %</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.serviceName || item.description}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right">{item.units}</td>
                    <td className="text-right">{item.vatRate || item.vat}%</td>
                    <td className="text-right">{item.discountRate || item.discount || 0}%</td>
                    <td className="text-right">{formatCurrency(calculateItemTotal(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals">
              <table>
                <tbody>
                  <tr>
                    <td>Subtotal:</td>
                    <td className="text-right">{formatCurrency(invoice.taxableAmount)}</td>
                  </tr>
                  <tr>
                    <td>IVA:</td>
                    <td className="text-right">{formatCurrency(invoice.vatAmount)}</td>
                  </tr>
                  <tr className="total-row">
                    <td>Total:</td>
                    <td className="text-right">{formatCurrency(invoice.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Factura
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PrintInvoice;