import React, { useState } from 'react';

const PatientForm = ({ patient, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    patient || {
      firstName: '',
      lastName: '',
      secondLastName: '',
      dni: '',
      dob: '',
      cellPhone: '',
      email: '',
      address: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
          <input
            id="firstName"
            className="w-full p-2 border rounded-md"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
          <input
            id="lastName"
            className="w-full p-2 border rounded-md"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="secondLastName" className="block text-sm font-medium text-gray-700">Second Last Name</label>
          <input
            id="secondLastName"
            className="w-full p-2 border rounded-md"
            value={formData.secondLastName}
            onChange={(e) => setFormData({ ...formData, secondLastName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
          <input
            id="dni"
            className="w-full p-2 border rounded-md"
            value={formData.dni}
            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            id="dob"
            type="date"
            className="w-full p-2 border rounded-md"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="cellPhone" className="block text-sm font-medium text-gray-700">Cell Phone</label>
          <input
            id="cellPhone"
            className="w-full p-2 border rounded-md"
            value={formData.cellPhone}
            onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            className="w-full p-2 border rounded-md"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
        <input
          id="address"
          className="w-full p-2 border rounded-md"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {patient ? 'Update Patient' : 'Add Patient'}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;