import React, { useState, useEffect } from 'react';

const AppointmentForm = ({ appointment, selectedDate, selectedTime, onSubmit, onCancel }) => {
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(
    appointment || {
      patientId: '',
      providerId: '',
      serviceType: '',
      // appointmentDate: selectedDate ? formatToDDMMYYYY(selectedDate) : '',
      appointmentDate: selectedDate || '',
      appointmentTime: selectedTime || '',
      duration: '30',
      notes: '',
      status: 'scheduled'
    }
  );
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
    loadProviders();
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedTime) {
      setFormData(prev => ({
        ...prev,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime
      }));
    }
  }, [selectedDate, selectedTime]);

  const formatToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatToYYYYMMDD = (dateString) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };
  

  const loadPatients = async () => {
    try {
      const data = await window.electronAPI.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    }
  };

  const loadProviders = async () => {
    try {
      const data = await window.electronAPI.getProviders();
      
      // Sort by ID in order to match the provider list
      const sortedProviders = data
        .filter(provider => provider.status === 'active')
        .sort((b, a) => {
          const idA = parseInt(a.id);
          const idB = parseInt(b.id);
          return idB - idA;
        });

      setProviders(sortedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
      setError('Failed to load providers');
    }
  };

  const loadServices = async () => {
    try {
      const data = await window.electronAPI.getServices();
      setServices(data.filter(service => service.status === 'active'));
    } catch (error) {
      console.error('Error loading services:', error);
      setError('Failed to load services');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.providerId) {
      setError('Please select a provider');
      return;
    }

    onSubmit(formData);
  };

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

  const getContrastColor = (hexcolor) => {
    if (!hexcolor) return '#000000';
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select Patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {`${patient.firstName} ${patient.lastName} ${patient.secondLastName || ''}`}
              </option>
            ))}
          </select>
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Type *
          </label>
          <select
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select Service</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Provider *
        </label>
        <div className="flex flex-wrap gap-2">
          {providers.map((provider, index) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setFormData({ ...formData, providerId: provider.id })}
              className={`flex-1 p-3 rounded-md text-center transition-all ${
                formData.providerId === provider.id 
                  ? 'ring-2 ring-offset-2 ring-blue-500' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: provider.color,
                color: getContrastColor(provider.color),
                order: index // Preserve the order using flexbox order
              }}
            >
              <div>{`${provider.firstName} ${provider.lastName}`}</div>
              <div className="text-sm opacity-80">{provider.specialty}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date and Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time *
          </label>
          <select
            value={formData.appointmentTime}
            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select Time</option>
            {generateTimeSlots().map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration
        </label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className="w-full p-2 border rounded-md"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-2 border rounded-md"
          rows="3"
          placeholder="Add any additional notes here..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {appointment ? 'Update Appointment' : 'Schedule Appointment'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;