import React, { useState } from 'react';
import { Calendar, Users, FileText, ClipboardList, UserPlus, Settings } from 'lucide-react';

// Import components from their locations
import Dashboard from './components/dashboard/Dashboard';
import PatientManagement from './components/patients/PatientManagement';
import AppointmentManagement from './components/appointments/AppointmentManagement';
import InvoiceManagement from './components/invoices/InvoiceManagement';
import ProviderManagement from './components/providers/ProviderManagement';
import ServiceManagement from './components/services/ServiceManagement';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CLINICA SANT GERVSI</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="w-full">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap space-x-2 md:space-x-4 mb-8 bg-white p-1 rounded-lg shadow">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'dashboard' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'patients' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Patients
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'appointments' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'invoices' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Invoices
            </button>
            
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'providers' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Providers
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'services' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Services
            </button>
            
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={setActiveTab} />
          )}
          
          {activeTab === 'patients' && <PatientManagement />}
          
          {activeTab === 'appointments' && <AppointmentManagement />}
          
          {activeTab === 'providers' && <ProviderManagement />}
          
          {activeTab === 'services' && <ServiceManagement />}
          
          {activeTab === 'invoices' && <InvoiceManagement />}
          
        </div>
      </main>
    </div>
  );
};

export default App;