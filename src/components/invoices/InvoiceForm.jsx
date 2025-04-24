import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { calculateLineTotals } from './utils';

const InvoiceForm = ({ patients, services, onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    items: [{
      service: '',
      unitPrice: '',
      units: 1,
      vat: 0,
      discount: 0
    }],
    status: 'pending',
    date: new Date().toISOString().split('T')[0]
  });


  // Initialize form with initialData if provided
  // useEffect(() => {
  //   if (initialData) {
  //     console.log("Initial Data Loaded:", initialData); // Debugging
  
  //     setFormData({
  //       patientId: initialData.patientId || '',
  //       date: initialData.date || new Date().toISOString().split('T')[0],
  //       status: initialData.status || 'pending',
  //       items: initialData.items?.length > 0 ? initialData.items : [{
  //         service: '',
  //         unitPrice: 0,
  //         units: 1,
  //         vat: 0,
  //         discount: 0
  //       }]
  //     });
  //   }
  // }, [initialData]);
  
  const formatDateForDisplay = (isoDate) => { // Format a date string from YYYY-MM-DD to DD/MM/YYYY for display
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Parse a DD/MM/YYYY date to YYYY-MM-DD for the form data
  const parseDateForData = (displayDate) => {
    if (!displayDate) return '';
    const [day, month, year] = displayDate.split('/');
    return `${year}-${month}-${day}`;
  };

  // Update the form data when display date changes
  const handleDateChange = (e) => {
    const newDisplayDate = e.target.value;
    setDisplayDate(newDisplayDate);
    
    // Update the actual form data with the ISO format date
    setFormData({
      ...formData,
      date: parseDateForData(newDisplayDate)
    });
  };

  // State for the displayed date value
  const [displayDate, setDisplayDate] = useState(
    initialData?.date 
      ? formatDateForDisplay(initialData.date)
      : formatDateForDisplay(new Date().toISOString().split('T')[0])
  );
  

  useEffect(() => {
    if (initialData) {
      console.log("Initial Data Loaded inside useEffect:", initialData);
      setFormData({
        id: initialData.id,
        patientId: initialData.patientId || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        status: initialData.status || 'pending',
        items: initialData.items?.length > 0 ? initialData.items.map(item => ({
          service: item.service || '',
          unitPrice: item.unitPrice || '',
          units: item.units || 1,
          vat: item.vat || 0,
          discount: item.discount || 0
        })) : [{
          service: '',
          unitPrice: '',
          units: 1,
          vat: 0,
          discount: 0
        }]
      });
    }
  }, [initialData]);

  

  const addServiceLine = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        service: '',
        unitPrice: '',
        units: 1,
        vat: 0,
        discount: 0
      }]
    });
  };

  // Auto-fill service price when service is selected
  const handleServiceChange = (index, serviceId) => {
    const selectedService = services.find(s => s.id === parseInt(serviceId));
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      service: serviceId,
      unitPrice: selectedService?.defaultPrice || ''
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting form:", formData); 
    onSubmit(formData);
  };


  // Ensure the display date is updated when initialData changes
  useEffect(() => {
    if (initialData?.date) {
      setDisplayDate(formatDateForDisplay(initialData.date));
    }
  }, [initialData]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">
          {initialData ? 'Edit Invoice' : 'New Invoice'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Patient
            </label>
            <select
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
            >
              <option value="">Select patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {`${patient.firstName}, ${patient.secondLastName}, ${patient.lastName}`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            {/* <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              value={displayDate}
              onChange={handleDateChange}
              placeholder="DD/MM/YYYY"
              pattern="\\d{2}/\\d{2}/\\d{4}"
              required
            /> */}
          </div>
        </div>

        <div className="space-y-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2">Service</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Units</th>
                <th className="px-4 py-2">VAT % (Optional)</th>
                <th className="px-4 py-2">Discount %</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => {
                const totals = calculateLineTotals(item);
                return (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <select
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={item.service}
                        onChange={(e) => handleServiceChange(index, e.target.value)}
                        required
                      >
                        <option value="">Select service</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...item, unitPrice: parseFloat(e.target.value) };
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={item.units}
                        min="1"
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...item, units: parseInt(e.target.value) };
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={item.vat || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...item, vat: parseFloat(e.target.value) };
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        className="w-full rounded-md border border-gray-300 p-2"
                        value={item.discount || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...item, discount: parseFloat(e.target.value) };
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {totals.total.toFixed(2)}€
                    </td>
                    <td className="px-4 py-2">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            type="button"
            onClick={addServiceLine}
            className="mt-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Add Service
          </button>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
          onClick={onSubmit}
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;