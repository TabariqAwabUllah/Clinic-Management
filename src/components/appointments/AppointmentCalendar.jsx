import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AppointmentCalendar = ({ 
  currentDate = new Date(),
  appointments = [],
  services = [],
  onSlotSelect = () => {},
  onNextWeek = () => {},
  onPrevWeek = () => {},
  onTodayClick = () => {}
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour <= 24; hour++) {
      for (let minute of ['00', '30']) {
        if (hour === 24 && minute === '30') continue;
        slots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
      }
    }
    return slots;
  };

  const getWeekDates = (date = new Date()) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const formatDate = (date) => {
    try {
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const isToday = (date) => {
    try {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch (error) {
      console.error('Error checking if date is today:', error);
      return false;
    }
  };

  const isPastSlot = (date, time) => {
    try {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(hours, minutes, 0, 0);
      return slotDate < now;
    } catch (error) {
      console.error('Error checking if slot is past:', error);
      return false;
    }
  };

  const getAppointmentsForDateAndTime = (date, time) => {
    try {
      if (!date || !time) return [];
      const dateStr = date.toISOString().split('T')[0];
      return appointments.filter(apt => 
        apt?.appointmentDate === dateStr && 
        apt?.appointmentTime === time
      );
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  };

  const getServiceName = (serviceId) => {
    try {
      if (!serviceId || !Array.isArray(services) || !services.length) return 'Unknown Service';
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
      console.error('Error calculating contrast color:', error);
      return '#000000';
    }
  };

  if (!currentDate || !Array.isArray(appointments) || !Array.isArray(services)) {
    console.error('Invalid props:', { currentDate, appointments, services });
    return <div className="p-4 text-red-600">Invalid calendar data</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onPrevWeek}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onTodayClick}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
          >
            Today
          </button>
          <button
            onClick={onNextWeek}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-lg font-semibold">
        {/* {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} */}
        {`${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`}
        </h2>
      </div>

      {/* <div className="overflow-auto"> */}
      <div className="relative overflow-hidden">
        {/* <div className="min-w-[800px]"> */}
        <div className="overflow-auto max-h-[calc(80vh-150px)]">
          {/* <div className="grid grid-cols-8 border-b"> */}
          <div className="grid grid-cols-8 border-b sticky top-0 z-50 bg-white shadow">
            <div className="p-4 border-r bg-gray-50"></div>
            {getWeekDates(currentDate).map((date, i) => (
              <div
                key={i}
                className={`p-4 text-center border-r ${
                  isToday(date) ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                {formatDate(date)}
              </div>
            ))}
          </div>

          <div className="divide-y">
            {generateTimeSlots().map((time) => (
              <div key={time} className="grid grid-cols-8">
                <div className="p-4 border-r text-sm text-gray-500">
                  {time}
                </div>
                {getWeekDates(currentDate).map((date) => {
                  const dateAppointments = getAppointmentsForDateAndTime(date, time);
                  const isSlotPast = isPastSlot(date, time);
                  return (
                    <div
                      key={`${date}-${time}`}
                      onClick={() => {
                        if (dateAppointments.length > 0) {
                          setSelectedAppointment(dateAppointments[0]);
                        } else if (!isSlotPast) {
                          onSlotSelect(date, time);
                        }
                      }}
                      className={`p-2 border-r min-h-[4rem] ${
                        isSlotPast 
                          ? 'bg-gray-100 cursor-not-allowed' 
                          : dateAppointments.length > 0
                            ? 'bg-blue-50 cursor-pointer hover:bg-blue-100'
                            : 'cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      {dateAppointments.map(apt => (
                        <div 
                          key={apt?.id}
                          className="text-xs p-1 rounded"
                          style={{
                            backgroundColor: apt?.providerColor || '#E5E7EB',
                            color: getContrastColor(apt?.providerColor || '#E5E7EB')
                          }}
                        >
                          <div className="font-medium">{apt?.patientName}</div>
                          <div>{getServiceName(apt?.serviceType)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Appointment Details</h2>
              <button 
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Patient</label>
                  <p className="text-gray-900">{selectedAppointment?.patientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Provider</label>
                  <p className="text-gray-900">{selectedAppointment?.providerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-gray-900">{getServiceName(selectedAppointment?.serviceType)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date & Time</label>
                  <p className="text-gray-900">
                  {`${selectedAppointment?.appointmentDate.split('-').reverse().join('/')} a las ${selectedAppointment?.appointmentTime}`}
                  
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-gray-900">{selectedAppointment?.duration} minutes</p>
                </div>
                {selectedAppointment?.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;