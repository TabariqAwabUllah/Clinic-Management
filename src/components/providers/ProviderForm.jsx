// ProviderForm.jsx
import React from 'react';
import { X, Check } from 'lucide-react';

const ProviderForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  isLoading = false,
  providers = []
}) => {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    specialty: '',
    email: '',
    phone: '',
    color: '#E5E7EB'
  });

  const [errors, setErrors] = React.useState({});

  // Reset form and errors when modal opens/closes or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          specialty: initialData.specialty || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          color: initialData.color || '#E5E7EB'
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          specialty: '',
          email: '',
          phone: '',
          color: '#E5E7EB'
        });
      }
      setErrors({}); // Clear errors when form opens
    }
  }, [initialData, isOpen]);

  const validateColor = (color) => {
    if (!providers || !Array.isArray(providers)) return null;
    
    const existingProvider = providers.find(
      provider => 
        provider.color?.toLowerCase() === color?.toLowerCase() && 
        (!initialData || provider.id !== initialData.id)
    );

    if (existingProvider) {
      return `This color is already used by ${existingProvider.firstName} ${existingProvider.lastName}`;
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for the changed field
    setErrors(prev => ({ ...prev, [name]: null, submit: null }));

    // Validate color immediately
    if (name === 'color') {
      const colorError = validateColor(value);
      if (colorError) {
        setErrors(prev => ({ ...prev, color: colorError }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate all fields
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.specialty?.trim()) {
      newErrors.specialty = 'Specialty is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    const colorError = validateColor(formData.color);
    if (colorError) {
      newErrors.color = colorError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose(); // Close the form after successful submission
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Failed to save provider'
      }));
    }
  };

  // Handle modal close
  const handleClose = () => {
    setErrors({}); // Clear errors when closing
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {initialData ? 'Edit Provider' : 'Add New Provider'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name*
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : ''
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name*
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : ''
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specialty*
            </label>
            <input
              type="text"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              required
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.specialty ? 'border-red-500' : ''
              }`}
            />
            {errors.specialty && (
              <p className="mt-1 text-sm text-red-600">
                {errors.specialty}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : ''
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Color*
            </label>
            <div className="mt-1 flex items-center gap-4">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                required
                className={`block w-20 h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.color ? 'border-red-500' : ''
                }`}
              />
              <span className="text-sm text-gray-500">
                {formData.color.toUpperCase()}
              </span>
            </div>
            {errors.color && (
              <p className="mt-1 text-sm text-red-600">
                {errors.color}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading} // Only disable during loading
            >
              <Check className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add'} Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderForm;