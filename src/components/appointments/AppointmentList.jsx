import React, { useEffect, useRef, useState } from 'react';
import { Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';

const AppointmentList = ({ 
  appointments = [], 
  services = [], 
  onEdit = () => {}, 
  onDelete = () => {},
  onStatusChange = () => {} ,
  onFilteredAppointmentsChange = () => {} 
}) => {
  const previousAppointmentsRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    dateRange: { start: '', end: '' }
  });

  const getServiceName = (serviceId) => {
    try {
      if (!serviceId || !Array.isArray(services)) return 'Unknown Service';
      const service = services.find(s => 
        s?.id === serviceId || 
        s?.id === parseInt(serviceId) || 
        s?.name === serviceId
      );
      return service?.name || 'Unknown Service';
    } catch (error) {
      console.error('Error getting service name:', error);
      return 'Unknown Service';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (!appointment) return false;

    const serviceName = getServiceName(appointment.serviceType);
    const matchesSearch = 
      appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filter.status === 'all' || appointment.status === filter.status;
    
    const appointmentDate = new Date(appointment.appointmentDate);
    const matchesDateRange = (
      !filter.dateRange.start || appointmentDate >= new Date(filter.dateRange.start)
    ) && (
      !filter.dateRange.end || appointmentDate <= new Date(filter.dateRange.end)
    );

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    try {
      const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
      const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
      return dateA - dateB;
    } catch (error) {
      return 0;
    }
  });

  const formatDateTime = (date, time) => {
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${formattedDate} ${time}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getContrastColor = (hexcolor) => {
    try {
      if (!hexcolor) return '#000000';
      const hex = hexcolor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (error) {
      return '#000000';
    }
  };

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      scheduled: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  useEffect(() => {
    // When filtered appointments change, notify parent component
    if (typeof onFilteredAppointmentsChange === 'function') {
      // Use JSON.stringify to do a deep comparison
      const appointmentsString = JSON.stringify(sortedAppointments.map(a => a.id));
      
      // Only update if the actual list of appointment IDs has changed
      if (appointmentsString !== previousAppointmentsRef.current) {
        previousAppointmentsRef.current = appointmentsString;
        onFilteredAppointmentsChange(sortedAppointments);
      }
    }
  }, [sortedAppointments, onFilteredAppointmentsChange]);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by patient, provider, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-40 p-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filter.dateRange.start}
                onChange={(e) => setFilter({
                  ...filter,
                  dateRange: { ...filter.dateRange, start: e.target.value }
                })}
                className="w-40 p-2 border rounded-md"
                // Add the pattern and placeholder attributes
                pattern="\d{2}/\d{2}/\d{4}"
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
    type="date"
    value={filter.dateRange.end}
    onChange={(e) => setFilter({
      ...filter,
      dateRange: { ...filter.dateRange, end: e.target.value }
    })}
    className="w-40 p-2 border rounded-md"
    pattern="\d{2}/\d{2}/\d{4}"
    placeholder="dd/mm/yyyy"
  />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
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
              {sortedAppointments.map((appointment) => (
                <tr key={appointment?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateTime(appointment?.appointmentDate, appointment?.appointmentTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment?.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="px-2 py-1 text-sm rounded-full"
                      style={{
                        backgroundColor: appointment?.providerColor || '#E5E7EB',
                        color: getContrastColor(appointment?.providerColor)
                      }}
                    >
                      {appointment?.providerName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getServiceName(appointment?.serviceType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment?.duration || '30'} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={appointment?.status} />
                  </td>
                   
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {appointment?.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => onStatusChange(appointment.id, 'completed')
                              
                              
                            }
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onStatusChange(appointment.id, 'cancelled')
                              
                            }
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Mark as Cancelled"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onEdit(appointment)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="Edit Appointment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(appointment.id)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedAppointments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No appointments found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentList;