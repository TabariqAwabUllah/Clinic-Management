// DailyCalendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DailyCalendar = ({ 
  appointments = [], 
  providers = [],
  services = [],
  onUpdateAppointment
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const defaultTimeRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const datePickerRef = useRef(null);
  const datePickerContainerRef = useRef(null);
  
  const reversedProviders = [...providers];
  
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  useEffect(() => {
    if (defaultTimeRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = defaultTimeRef.current.offsetTop;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerContainerRef.current && !datePickerContainerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const handleDatePickerClick = () => {
    setIsDatePickerOpen(true);
    setTimeout(() => {
      if (datePickerRef.current) {
        datePickerRef.current.showPicker();
      }
    }, 0);
  };

  const getProviderFullName = (provider) => {
    if (!provider) return 'No Provider';
    return `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
  };

  const getServiceName = (serviceType) => {
    // Log for debugging
    console.log('Service Type:', serviceType);
    console.log('Available Services:', services);

    // Handle case where serviceType is already a name
    if (typeof serviceType === 'string' && !serviceType.match(/^[0-9]+$/)) {
      return serviceType;
    }
    
    // Find service by ID
    const service = services.find(s => {
      // Compare as numbers to handle string/number type mismatches
      const serviceId = parseInt(s.id);
      const typeId = parseInt(serviceType);
      return serviceId === typeId;
    });

    // Log found service
    console.log('Found Service:', service);

    return service?.name || service?.serviceName || 'Unknown Service';


  };

  return (
    <div className="flex flex-col h-[650px] rounded-lg bg-white overflow-hidden">
      {/* Calendar Header */}
      <div className="flex justify-between items-center py-3 px-6 border-b bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateDay(-1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </h2>
          
          <button 
            onClick={() => navigateDay(1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="relative inline-block" ref={datePickerContainerRef}>
          <button 
            onClick={handleDatePickerClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 select-none transition-colors border"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium whitespace-nowrap">Pick Date</span>
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              setSelectedDate(newDate);
              setIsDatePickerOpen(false);
            }}
            className={`absolute right-0 top-full mt-2 p-2 border rounded-md bg-white shadow-lg ${
              isDatePickerOpen ? 'block' : 'hidden'
            }`}
            style={{ zIndex: 1000 }}
          />
        </div>
      </div>

      {/* Calendar Grid with Horizontal Scroll */}
      {/* <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}> */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        {/* <div className="overflow-x-auto"> */}
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col className="w-20" /> 
              {reversedProviders.map((_, index) => (
                <col key={index} className="w-48" />
              ))}
            </colgroup>
            {/* <thead className="bg-white sticky top-0 z-50"> */}
            <thead className="bg-white sticky top-0 z-50">
              <tr>
                {/* Time Column Header */}
                {/* <th className="sticky left-0 top-0 z-40 bg-white border-b py-2 px-3"> */}
                <th className="sticky left-0 top-0 z-40 bg-white border-b py-2 px-3 shadow">
                  <div className="font-medium text-gray-500 text-sm">Time</div>
                </th>

                {reversedProviders.map((provider, index) => (
                  <th 
                    key={provider.id || index}
                    // className="sticky top-0 z-40 border-b p-2 min-w-[12rem]"
                    className="sticky top-0 z-40 border-b p-2 min-w-[12rem] shadow"
                    style={{
                      backgroundColor: provider?.color || '#F3F4F6',
                      color: getContrastColor(provider?.color || '#F3F4F6')
                    }}
                  >
                    <div className="text-sm font-medium text-center">
                      {getProviderFullName(provider)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIndex) => (
                <tr key={time}>
                  <td 
                    ref={time === '08:00' ? defaultTimeRef : null}
                    className={`sticky left-0 z-20 bg-white border-b py-1.5 px-3 text-gray-500 text-sm ${
                      timeIndex % 2 === 1 ? 'text-gray-400' : ''
                    }`}
                  >
                    {time}
                  </td>
                  {reversedProviders.map((provider, providerIndex) => (
                    <td 
                      key={`${time}-${provider.id || providerIndex}`}
                      className="border-b border-l p-1 align-top"
                    >
                      {appointments
                        .filter(apt => 
                          apt.appointmentTime === time && 
                          apt.providerName === getProviderFullName(provider) &&
                          apt.appointmentDate === selectedDate.toISOString().split('T')[0]
                        )
                        .map(apt => (
                          <div 
                            key={apt.id}
                            className={`p-1.5 mb-0.5 text-sm rounded cursor-pointer transition-colors
                              ${apt.status === 'completed' ? 'bg-green-50 text-green-800' :
                                apt.status === 'cancelled' ? 'bg-red-50 text-red-800' :
                                'bg-blue-50 text-blue-800'}`}
                            onClick={() => onUpdateAppointment && onUpdateAppointment(apt)}
                          >
                            <div className="font-medium truncate text-xs">
                              {apt.patientName}
                            </div>
                            <div className="text-xs truncate">
                              {getServiceName(apt.serviceType)}
                            </div>
                          </div>
                        ))
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        {/* </div> */}
      </div>
    </div>
  );
};

const getContrastColor = (hexcolor) => {
  if (!hexcolor) return '#000000';
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default DailyCalendar;