const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Patient methods
    getPatients: () => ipcRenderer.invoke('patients:getAll'),
    addPatient: (patient) => ipcRenderer.invoke('patients:add', patient),
    updatePatient: (patient) => ipcRenderer.invoke('patients:update', patient),
    deletePatient: (id) => ipcRenderer.invoke('patients:delete', id),
    checkDNI: (dni) => ipcRenderer.invoke('patients:checkDNI', dni),
    
    // Provider methods
    getProviders: () => ipcRenderer.invoke('providers:getAll'),
    addProvider: (provider) => ipcRenderer.invoke('providers:add', provider),
    updateProvider: ({ id, ...provider }) => ipcRenderer.invoke('providers:update', { id, ...provider }),
    deleteProvider: (id) => ipcRenderer.invoke('providers:delete', id),
    
    // Service methods
    getServices: () => ipcRenderer.invoke('services:getAll'),
    addService: (service) => ipcRenderer.invoke('services:add', service),
    updateService: ({ id, ...service }) => ipcRenderer.invoke('services:update', { id, ...service }),
    deleteService: (id) => ipcRenderer.invoke('services:delete', id),

    // Appointment methods
    getAppointments: () => ipcRenderer.invoke('appointments:getAll'),
    addAppointment: (appointment) => ipcRenderer.invoke('appointments:add', appointment),
    updateAppointment: (appointment) => ipcRenderer.invoke('appointments:update', appointment),
    deleteAppointment: (id) => ipcRenderer.invoke('appointments:delete', id),
    updateAppointmentStatus: (data) => ipcRenderer.invoke('appointments:updateStatus', data),

    // Invoice methods
    getInvoices: () => ipcRenderer.invoke('invoices:getAll'),
    addInvoice: (invoice) => ipcRenderer.invoke('invoices:add', invoice),
    updateInvoice: ({ id, ...invoice }) => ipcRenderer.invoke('invoices:update', { id, ...invoice }),
    deleteInvoice: (id) => ipcRenderer.invoke('invoices:delete', id),
    updateInvoiceStatus: (id, status) => ipcRenderer.invoke('invoices:updateStatus', { id, status }),

    // Response handlers
    handleError: (error) => {
        console.error('API Error:', error);
        return {
            success: false,
            message: error.message || 'An unexpected error occurred',
            error: error
        };
    },

    handleSuccess: (data) => {
        return {
            success: true,
            data: data
        };
    }
});