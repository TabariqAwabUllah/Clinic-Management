import React, { useState, useEffect } from 'react';
import { Plus, Calendar, List, FileSpreadsheet, Upload  } from 'lucide-react';
import AppointmentForm from './AppointmentForm';
import AppointmentCalendar from './AppointmentCalendar';
import AppointmentList from './AppointmentList';
import * as XLSX from 'xlsx';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-red-600">Something went wrong.</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('calendar');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  useEffect(() => {
    loadAppointments();
    loadServices();
  }, []);


  const formatToDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadAppointments = async () => {
    try {
      setIsAppointmentsLoading(true);
      setError(null);
      console.log("print 2.1");
      
      const data = await window.electronAPI.getAppointments();
      setAppointments(data || []);
      console.log("print 2.2 Data", data);
      
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
      setAppointments([]);
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const loadServices = async () => {
    
    try {
      
      setIsServicesLoading(true);
      setError(null);
      const data = await window.electronAPI.getServices();
      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load services');
      setServices([]);
    } finally {
    
      setIsServicesLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    console.log(" print 1, Updating status:", "id:", appointmentId, "status:",  newStatus );

    try {
      
      setIsAppointmentsLoading(true);
      setError(null);
      console.log(" print 2, Updating status:", "id:", appointmentId, "status:",  newStatus );
      
      const response = await window.electronAPI.updateAppointmentStatus({
        id: appointmentId,
        status: newStatus
      });
      console.log("response",response);
      
      await loadAppointments(); // Reload appointments after status update
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      setIsAppointmentsLoading(true);
      setError(null);
      await window.electronAPI.addAppointment(appointmentData);
      await loadAppointments();
      setView('calendar');
      setSelectedDate(null);
      setSelectedTime(null);
      alert('Appointment scheduled successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('Failed to schedule appointment');
      alert('Error scheduling appointment. Please try again.');
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const handleUpdateAppointment = async (appointmentData) => {
    try {
      setIsAppointmentsLoading(true);
      setError(null);
      await window.electronAPI.updateAppointment({
        ...appointmentData,
        id: selectedAppointment.id
      });
      await loadAppointments();
      setView('calendar');
      setSelectedAppointment(null);
      alert('Appointment updated successfully!');
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
      alert('Error updating appointment. Please try again.');
    } finally {
      setIsAppointmentsLoading(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        setIsAppointmentsLoading(true);
        setError(null);
        await window.electronAPI.deleteAppointment(id);
        await loadAppointments();
        alert('Appointment deleted successfully!');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        setError('Failed to delete appointment');
        alert('Error deleting appointment. Please try again.');
      } finally {
        setIsAppointmentsLoading(false);
      }
    }
  };
 
 
  const handleExportToExcel = () => {
    // Use filtered appointments if there are any, otherwise use all appointments
    const appointmentsToExport = view === 'list' && filteredAppointments.length > 0 
      ? filteredAppointments 
      : appointments;
      
    const exportData = appointmentsToExport.map(appointment => {
      // First try to find service by exact ID match
      let service = services.find(s => s.id === appointment.serviceType);
      
      // If not found, try parsing serviceType as integer
      if (!service) {
        service = services.find(s => s.id === parseInt(appointment.serviceType));
      }
  
      return {
        'Patient Name': appointment.patientName,
        'Provider Name': appointment.providerName,
        'Service': service ? service.name : 'Unknown Service',
        'Date': appointment.appointmentDate,
        'Time': appointment.appointmentTime,
        'Duration (min)': appointment.duration,
        'Status': appointment.status,
        'Notes': appointment.notes || ''
      };
    });
  
    // Log for debugging
    console.log('Services:', services);
    console.log('Export Data:', exportData);
  
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 20 }, // Patient Name
      { wch: 20 }, // Provider Name
      { wch: 20 }, // Service
      { wch: 12 }, // Date
      { wch: 8 },  // Time
      { wch: 8 },  // Duration
      { wch: 10 }, // Status
      { wch: 30 }  // Notes
    ];
    ws['!cols'] = colWidths;
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    
    const date = new Date().toLocaleDateString();
    XLSX.writeFile(wb, `appointments_${date}.xlsx`);
  };
  
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          dateNF: 'yyyy-mm-dd'
        });
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
        // Get all required data
        const existingAppointments = await window.electronAPI.getAppointments();
        const providers = await window.electronAPI.getProviders();
        const patients = await window.electronAPI.getPatients();
  
        // Create maps for lookups
        const existingSlots = new Set(
          existingAppointments.map(apt => 
            `${apt.appointmentDate}-${apt.appointmentTime}-${apt.providerId}`
          )
        );
  
        const providersMap = new Map(
          providers.map(p => [`${p.firstName} ${p.lastName}`.toLowerCase(), p.id])
        );
  
        const patientsMap = new Map();
        patients.forEach(p => {
          // Full name mapping
          const fullName = [p.firstName, p.lastName, p.secondLastName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          patientsMap.set(fullName, p);
  
          // First + Last name mapping
          const firstLastName = `${p.firstName} ${p.lastName}`.toLowerCase();
          patientsMap.set(firstLastName, p);
  
          // Add individual names for flexible matching
          const firstNameOnly = p.firstName.toLowerCase();
          patientsMap.set(firstNameOnly, p);
        });
  
        console.log('Available patients:', Array.from(patientsMap.keys()));
  
        const formattedAppointments = jsonData
          .map(row => {
            if (!row['Patient Name'] || !row['Provider Name'] || !row['Date'] || !row['Time']) {
              console.log('Missing required fields:', row);
              return null;
            }
  
            const searchPatient = row['Patient Name'].toLowerCase().trim();
            const patient = patientsMap.get(searchPatient);
            
            if (!patient) {
              console.log('Patient not found. Search key:', searchPatient);
              return null;
            }
  
            const providerId = providersMap.get(row['Provider Name'].toLowerCase());
            if (!providerId) {
              console.log('Provider not found:', row['Provider Name']);
              return null;
            }
  
            let appointmentDate = row['Date'];
            if (typeof appointmentDate === 'number') {
              appointmentDate = new Date((appointmentDate - 25569) * 86400 * 1000)
                // .toLocaleDateString();
                .toISOString().split('T')[0];
            }
  
            const slot = `${appointmentDate}-${row['Time']}-${providerId}`;
            if (existingSlots.has(slot)) {
              console.log('Duplicate appointment slot:', slot);
              return null;
            }
  
            const service = services.find(s => 
              s.name.toLowerCase() === row['Service']?.toLowerCase()
            );
  
            return {
              patientId: patient.id,
              patientName: `${patient.firstName} ${patient.lastName}${patient.secondLastName ? ' ' + patient.secondLastName : ''}`,
              providerId,
              providerName: row['Provider Name'],
              serviceType: service?.id,
              appointmentDate,
              appointmentTime: row['Time'],
              duration: parseInt(row['Duration (min)']) || 30,
              status: row['Status']?.toLowerCase() || 'scheduled',
              notes: row['Notes'] || ''
            };
          })
          .filter(apt => apt !== null);
  
        let successCount = 0;
        let errorCount = 0;
  
        for (const appointment of formattedAppointments) {
          try {
            await window.electronAPI.addAppointment(appointment);
            successCount++;
          } catch (error) {
            console.error('Error adding appointment:', error);
            errorCount++;
          }
        }
        
        alert(`Successfully imported ${successCount} appointments. Failed to import ${errorCount} appointments.`);
        await loadAppointments();
        event.target.value = null;
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing appointments:', error);
      alert('Error importing appointments. Please check the file format.');
    }
  };

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  
  const handleSlotSelect = (date, time) => {
    setSelectedDate(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]));
    setSelectedTime(time);
    setView('form');
  };

  if (isServicesLoading || isAppointmentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          <div className="flex items-center space-x-2">


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
              onClick={() => setView(view === 'calendar' ? 'list' : 'calendar')}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              {view === 'calendar' ? (
                <>
                  <List className="w-4 h-4" />
                  List View
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Calendar View
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedAppointment(null);
                setSelectedDate(formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]));
                setSelectedTime('09:00');
                setView('form');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </div>
        </div>

        {view === 'form' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {selectedAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
              </h2>
            </div>
            <div className="p-6">
              <AppointmentForm
                appointment={selectedAppointment}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSubmit={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
                onCancel={() => {
                  setView('calendar');
                  setSelectedAppointment(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                }}
              />
            </div>
          </div>
        ) : view === 'calendar' ? (
          <AppointmentCalendar
            appointments={appointments}
            services={services}
            onSlotSelect={handleSlotSelect}
            currentDate={currentDate}
            onNextWeek={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
            onPrevWeek={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
            onTodayClick={() => setCurrentDate(new Date())}
          />
        ) : (
          <AppointmentList
            appointments={appointments}
            services={services}
            onEdit={(appointment) => {
              setSelectedAppointment(appointment);
              setView('form');
            }}
            onDelete={handleDeleteAppointment}
            onStatusChange={handleStatusChange}
            onFilteredAppointmentsChange={setFilteredAppointments}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AppointmentManagement;