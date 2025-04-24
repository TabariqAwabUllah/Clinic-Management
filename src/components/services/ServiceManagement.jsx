import React, { useState, useEffect } from 'react';
import { Plus, FileSpreadsheet, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import ServiceList from './ServiceList';
import ServiceForm from './ServiceForm';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const data = await window.electronAPI.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (selectedService) {
        await window.electronAPI.updateService({
          id: selectedService.id,
          ...formData
        });
      } else {
        await window.electronAPI.addService(formData);
      }
      
      await loadServices();
      setIsFormOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      setError(error.message || 'Failed to save service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      setIsLoading(true);
      setError(null);
      await window.electronAPI.deleteService(serviceId);
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    const exportData = services.map(service => ({
      'Service Name': service.name
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [{ wch: 40 }];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Services');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `services_list_${date}.xlsx`);
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const existingServices = await window.electronAPI.getServices();
        const existingNames = new Set(
          existingServices.map(s => s.name.toLowerCase().trim())
        );

        const formattedServices = jsonData
          .filter(row => {
            const serviceName = row['Service Name']?.toLowerCase().trim() || '';
            return !existingNames.has(serviceName);
          })
          .map(row => ({
            name: row['Service Name']?.trim() || ''
          }));

        for (const service of formattedServices) {
          await window.electronAPI.addService(service);
        }
        
        alert(`Imported ${formattedServices.length} new services. Skipped ${jsonData.length - formattedServices.length} existing records.`);
        await loadServices();
        event.target.value = null;
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing services:', error);
      alert('Error importing services. Please check the file format.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
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
            Export Excel
          </button>
          <button
            onClick={() => {
              setSelectedService(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      <ServiceList
        services={services}
        onEdit={(service) => {
          setSelectedService(service);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <ServiceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedService(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedService}
      />
    </div>
  );
};

export default ServiceManagement;