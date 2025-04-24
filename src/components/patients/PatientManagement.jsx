import React, { useState, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet,Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import PatientForm from './PatientForm';
import PatientList from './PatientList';


const PatientManagement = ({ onScheduleAppointment }) => {
  const [patients, setPatients] = useState([]);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await window.electronAPI.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleAddPatient = async (patientData) => {
    try {
      await window.electronAPI.addPatient(patientData);
      await loadPatients();
      setIsAddingPatient(false);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleUpdatePatient = async (patientData) => {
    try {
      await window.electronAPI.updatePatient(patientData);
      await loadPatients();
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await window.electronAPI.deletePatient(patientId);
        await loadPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const handleExportToExcel = () => {
    // Prepare data for export
    const exportData = filteredPatients.map(patient => ({
      'Full Name': `${patient.firstName} ${patient.lastName} ${patient.secondLastName || ''}`.trim(),
      'DNI': patient.dni,
      'Date of Birth': new Date(patient.dob).toLocaleDateString(),
      'Cell Phone': patient.cellPhone,
      'Email': patient.email || '',
      'Address': patient.address || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // Full Name
      { wch: 15 }, // DNI
      { wch: 15 }, // Date of Birth
      { wch: 15 }, // Cell Phone
      { wch: 25 }, // Email
      { wch: 40 }  // Address
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');

    // Generate file name with current date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `patients_list_${date}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
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
  
        const existingPatients = await window.electronAPI.getPatients();
        const existingDNIs = new Set(existingPatients.map(p => p.dni));
  
        const formattedPatients = jsonData
          .filter(row => !existingDNIs.has(row['DNI']?.toString()))
          .map(row => {
            let dobDate;
            try {
              dobDate = new Date(row['Date of Birth']);
              if (isNaN(dobDate.getTime())) throw new Error('Invalid date');
            } catch {
              dobDate = new Date();
            }
  
            return {
              firstName: row['Full Name']?.split(' ')[0] || '',
              lastName: row['Full Name']?.split(' ')[1] || '',
              secondLastName: row['Full Name']?.split(' ').slice(2).join(' ') || '',
              dni: row['DNI']?.toString() || '',
              dob: `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, '0')}-${String(dobDate.getDate()).padStart(2, '0')}`,
              cellPhone: row['Cell Phone']?.toString() || '',
              email: row['Email']?.toString() || '',
              address: row['Address']?.toString() || ''
            };
          });
  
        for (const patient of formattedPatients) {
          await window.electronAPI.addPatient(patient);
        }
        
        alert(`Imported ${formattedPatients.length} new patients. Skipped ${jsonData.length - formattedPatients.length} existing records.`);
        await loadPatients();
        event.target.value = null;
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing patients:', error);
      alert('Error importing patients. Please check the file format.');
    }
  };
  const handleSchedule = (patient) => {
    onScheduleAppointment({
      patient,
      defaultDate: new Date().toISOString().split('T')[0],
      defaultTime: '09:00'
    });
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName} ${patient.secondLastName} ${patient.dni}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
        </div>
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
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>
          <button 
            onClick={() => setIsAddingPatient(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Add New Patient
          </button>
        </div>
      </div>

      {/* Form Section */}
      {(isAddingPatient || selectedPatient) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <PatientForm
            patient={selectedPatient}
            onSubmit={selectedPatient ? handleUpdatePatient : handleAddPatient}
            onCancel={() => {
              setIsAddingPatient(false);
              setSelectedPatient(null);
            }}
          />
        </div>
      )}

      {/* List Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Patients List</h2>
        <PatientList
          patients={filteredPatients}
          onEdit={setSelectedPatient}
          onDelete={handleDeletePatient}
          onSchedule={handleSchedule}
        />
      </div>
    </div>
  );
};

export default PatientManagement;