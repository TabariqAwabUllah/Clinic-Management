// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { UserCircle2, CalendarPlus, FileText } from 'lucide-react';
import DailyCalendar from './DailyCalendar';

const Dashboard = ({ onNavigate }) => {
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [appts, providerList, serviceList] = await Promise.all([
        window.electronAPI.getAppointments(),
        window.electronAPI.getProviders(),
        window.electronAPI.getServices()
      ]);
      
      // Log data for debugging
      console.log('Raw Appointments:', appts);
      console.log('Services:', serviceList);

      // Transform appointments to ensure serviceType is handled correctly
      const transformedAppts = appts.map(apt => {
        const serviceType = apt.serviceType?.id || apt.serviceType;
        // Log transformation for debugging
        console.log('Transforming appointment:', {
          original: apt.serviceType,
          transformed: serviceType,
          service: serviceList.find(s => s.id === parseInt(serviceType))
        });
        
        return {
          ...apt,
          serviceType: serviceType
        };
      });
      
      // Filter and sort providers
      const activeProviders = providerList
        .filter(p => p.status === 'active')
        .sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt) - new Date(b.createdAt);
          }
          const aId = parseInt(a.id);
          const bId = parseInt(b.id);
          if (!isNaN(aId) && !isNaN(bId)) {
            return aId - bId;
          }
          return 0;
        });
      
      console.log('Transformed Appointments:', transformedAppts);
      console.log('Active Providers:', activeProviders);
      
      setAppointments(transformedAppts);
      setProviders(activeProviders);
      setServices(serviceList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentUpdate = async (appointment) => {
    try {
      setIsLoading(true);
      onNavigate('appointments', { selectedAppointment: appointment });
    } catch (error) {
      console.error('Error handling appointment update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  return (
    <div className="grid grid-cols-3  gap-8 h-full p-6 bg-gray-100">
      {/* Quick Actions */}
      <div className="space-y-6">
        {/* <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="space-y-3">
          <button 
            onClick={() => onNavigate('patients')}
            className="flex items-center gap-3 w-full p-4 text-left text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
          >
            <UserCircle2 className="w-5 h-5 text-blue-500" />
            <span>New Patient</span>
          </button>
          <button 
            onClick={() => onNavigate('appointments')}
            className="flex items-center gap-3 w-full p-4 text-left text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
          >
            <CalendarPlus className="w-5 h-5 text-blue-500" />
            <span>New Appointment</span>
          </button>
          <button 
            onClick={() => onNavigate('invoices')}
            className="flex items-center gap-3 w-full p-4 text-left text-gray-700 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
          >
            <FileText className="w-5 h-5 text-blue-500" />
            <span>New Invoice</span>
          </button>
        </div> */}
      </div>

      {/* Daily Calendar */}
      <div className="bg-white col-span-2 rounded-lg shadow relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        <DailyCalendar 
          appointments={appointments}
          providers={providers}
          services={services}
          onUpdateAppointment={handleAppointmentUpdate}
          onRefresh={refreshData}
        />
      </div>
    </div>
  );
};

export default Dashboard;