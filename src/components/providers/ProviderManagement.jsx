import React, { useState, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet,Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

import { UserPlus } from 'lucide-react';
import ProviderList from './ProviderList';
import ProviderForm from './ProviderForm';

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.getProviders();
      const activeProviders = Array.isArray(data) 
        ? data
          .filter(provider => provider.active !== false)
          .map(provider => ({
            id: provider.id,
            firstName: provider.firstName || provider.name?.split(' ')[0] || '',
            lastName: provider.lastName || provider.name?.split(' ')[1] || '',
            specialty: provider.specialty || '',
            email: provider.email || '',
            phone: provider.phone || '',
            color: provider.color || '#E5E7EB',
            status: provider.status || 'active'
          }))
          // Sort by ID in descending order (newest first)
          .sort((a, b) => b.id - a.id)
        : [];
      setProviders(activeProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
      setError('Failed to load providers');
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedProvider) {
        // Update existing provider
        await window.electronAPI.updateProvider({
          id: selectedProvider.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialty: formData.specialty,
          email: formData.email,
          phone: formData.phone,
          color: formData.color
        });
      } else {
        // Add new provider
        await window.electronAPI.addProvider({
          firstName: formData.firstName,
          lastName: formData.lastName,
          specialty: formData.specialty,
          email: formData.email,
          phone: formData.phone,
          color: formData.color
        });
      }
      await loadProviders();
      setIsFormOpen(false);
      setSelectedProvider(null);
    } catch (error) {
      console.error('Error saving provider:', error);
      setError(error.message || 'Failed to save provider');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (providerId) => {
    setIsLoading(true);
    setError(null);
    try {
      await window.electronAPI.deleteProvider(providerId);
      await loadProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      setError('Failed to delete provider');
    } finally {
      setIsLoading(false);
    }
  };
  const handleExportToExcel = () => {
    const exportData = providers.map(provider => ({
      'Full Name': `${provider.firstName} ${provider.lastName}`.trim(),
      'Specialty': provider.specialty,
      'Email': provider.email || '',
      'Phone': provider.phone || '',
      'Color': provider.color
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 30 }, // Full Name
      { wch: 20 }, // Specialty
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }  // Color
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Providers');
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `providers_list_${date}.xlsx`);
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        console.log("e.target.result",e.target.result);
        
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const existingProviders = await window.electronAPI.getProviders();
        const existingNames = new Set(
          existingProviders.map(p => `${p.firstName} ${p.lastName}`.toLowerCase().trim())
        );

        const formattedProviders = jsonData
          .filter(row => {
            
            const fullName = row['Full Name']?.toLowerCase().trim() || '';
            return !existingNames.has(fullName);
          })
          .map(row => {
            console.log("row in formattedProviders",row);
            
            const nameParts = (row['Full Name'] || '').split(' ');
            return {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              specialty: row['Specialty'] || '',
              email: row['Email'] || '',
              phone: row['Phone'] || '',
              color: row['Color'] || '#E5E7EB'
            };
          });

        for (const provider of formattedProviders) {
          await window.electronAPI.addProvider(provider);
        }
        
        alert(`Imported ${formattedProviders.length} new providers. Skipped ${jsonData.length - formattedProviders.length} existing records.`);
        await loadProviders();
        event.target.value = null;
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing providers:', error);
      alert('Error importing providers. Please check the file format.');
    }
  };
  // Sort providers by ID in descending order
  const sortedProviders = [...providers].sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Provider Management</h2>
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
            onClick={() => {
              setSelectedProvider(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            <UserPlus className="w-4 h-4" />
            Add Provider
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      <ProviderList
        providers={sortedProviders}
        onEdit={(provider) => {
          setSelectedProvider(provider);
          setIsFormOpen(true);
        }}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      <ProviderForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProvider(null);
        }}
        onSubmit={handleSubmit}
        initialData={selectedProvider}
        isLoading={isLoading}
        providers={sortedProviders}
      />
    </div>
  );
};

export default ProviderManagement;