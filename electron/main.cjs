const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const DatabaseService = require('./services/database.cjs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    mainWindow.loadURL(
        isDev
            ? 'http://localhost:5173'
            : `file://${path.resolve(__dirname, '../dist/index.html')}`
    );

    // if (isDev) {
    //     mainWindow.webContents.openDevTools();
    // }
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log('Failed to load:', {errorCode, errorDescription});
    console.log('Current directory:', __dirname);
    console.log('Attempted path:', path.resolve(__dirname, '../dist/index.html'));
});
}

// Patient Handlers
ipcMain.handle('patients:getAll', async () => {
    try {
        return await DatabaseService.getAllPatients();
    } catch (error) {
        console.error('Error getting patients:', error);
        throw { message: 'Failed to fetch patients', error };
    }
});

ipcMain.handle('patients:add', async (event, patient) => {
    try {
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'dni', 'dob', 'cellPhone'];
        for (const field of requiredFields) {
            if (!patient[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Check if DNI already exists
        const dniExists = await DatabaseService.checkDNI(patient.dni);
        if (dniExists) {
            throw new Error('A patient with this DNI already exists');
        }

        const newPatientId = await DatabaseService.addPatient(patient);
        return newPatientId;
    } catch (error) {
        console.error('Error adding patient:', error);
        throw { message: error.message || 'Failed to add patient', error };
    }
});

ipcMain.handle('patients:update', async (event, { id, ...patient }) => {
    try {
        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'dni', 'dob', 'cellPhone'];
        for (const field of requiredFields) {
            if (!patient[field]) {
                throw new Error(`${field} is required`);
            }
        }

        // Get current patient to compare DNI
        const currentPatient = await DatabaseService.getAllPatients().find(p => p.id === id);
        
        // Only check DNI uniqueness if it has changed
        if (currentPatient && currentPatient.dni !== patient.dni) {
            const dniExists = await DatabaseService.checkDNI(patient.dni);
            if (dniExists) {
                throw new Error('A patient with this DNI already exists');
            }
        }

        return await DatabaseService.updatePatient(id, patient);
    } catch (error) {
        console.error('Error updating patient:', error);
        throw { message: error.message || 'Failed to update patient', error };
    }
});

ipcMain.handle('patients:delete', async (event, id) => {
    try {
        return await DatabaseService.deletePatient(id);
    } catch (error) {
        console.error('Error deleting patient:', error);
        throw { message: 'Failed to delete patient', error };
    }
});

// Provider Handlers
ipcMain.handle('providers:getAll', async () => {
    try {
        return await DatabaseService.getAllProviders();
    } catch (error) {
        console.error('Error getting providers:', error);
        throw { message: 'Failed to fetch providers', error };
    }
});

ipcMain.handle('providers:add', async (event, provider) => {
    try {
        // Validate required fields
        const { firstName, lastName, specialty, color } = provider;
        if (!firstName || !lastName || !specialty || !color) {
            throw new Error('First name, last name, specialty, and color are required');
        }

        const newProviderId = await DatabaseService.addProvider({
            firstName,
            lastName,
            specialty,
            email: provider.email || null,
            phone: provider.phone || null,
            color
        });

        return newProviderId;
    } catch (error) {
        console.error('Error adding provider:', error);
        throw { message: error.message || 'Failed to add provider', error };
    }
});

ipcMain.handle('providers:update', async (event, { id, ...updates }) => {
    try {
        // For update, we'll only validate fields that are actually being updated
        const providedFields = Object.keys(updates);
        const requiredFields = ['firstName', 'lastName', 'specialty', 'color'];
        const missingRequired = requiredFields.filter(field => 
            providedFields.includes(field) && !updates[field]
        );

        if (missingRequired.length > 0) {
            throw new Error(`Missing required fields: ${missingRequired.join(', ')}`);
        }

        return await DatabaseService.updateProvider(id, updates);
    } catch (error) {
        console.error('Error updating provider:', error);
        throw { message: error.message || 'Failed to update provider', error };
    }
});

ipcMain.handle('providers:delete', async (event, id) => {
    try {
        return await DatabaseService.deleteProvider(id);
    } catch (error) {
        console.error('Error deleting provider:', error);
        throw { message: 'Failed to delete provider', error };
    }
});
// Appointment Handlers
ipcMain.handle('appointments:updateStatus', async (event, { id, status }) => {
    try {
        // Validate status
        const validStatuses = ['scheduled', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
        
        return await DatabaseService.updateAppointmentStatus(id, status);
    } catch (error) {
        console.error('Error updating appointment status:', error);
        throw { message: error.message || 'Failed to update appointment status', error };
    }
});
// Appointment Handlers
ipcMain.handle('appointments:getAll', async () => {
    try {
        return await DatabaseService.getAllAppointments();
    } catch (error) {
        console.error('Error getting appointments:', error);
        throw { message: 'Failed to fetch appointments', error };
    }
});

ipcMain.handle('appointments:add', async (event, appointment) => {
    try {
        // Validate required fields
        if (!appointment.patientId || !appointment.providerId || 
            !appointment.appointmentDate || !appointment.appointmentTime) {
            throw new Error('Patient, provider, date, and time are required');
        }

        // Check for conflicts
        const hasConflict = await DatabaseService.checkAppointmentConflict(
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.duration || 30,
            appointment.providerId
        );

        if (hasConflict) {
            throw new Error('This time slot is already booked for the selected provider');
        }

        return await DatabaseService.addAppointment(appointment);
    } catch (error) {
        console.error('Error adding appointment:', error);
        throw { message: error.message || 'Failed to add appointment', error };
    }
});

ipcMain.handle('appointments:update', async (event, { id, ...appointment }) => {
    try {
        // Validate required fields
        if (!appointment.patientId || !appointment.providerId || 
            !appointment.appointmentDate || !appointment.appointmentTime) {
            throw new Error('Patient, provider, date, and time are required');
        }

        // Check for conflicts, excluding the current appointment
        const hasConflict = await DatabaseService.checkAppointmentConflict(
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.duration || 30,
            appointment.providerId,
            id
        );

        if (hasConflict) {
            throw new Error('This time slot is already booked for the selected provider');
        }

        return await DatabaseService.updateAppointment(id, appointment);
    } catch (error) {
        console.error('Error updating appointment:', error);
        throw { message: error.message || 'Failed to update appointment', error };
    }
});

ipcMain.handle('appointments:delete', async (event, id) => {
    try {
        return await DatabaseService.deleteAppointment(id);
    } catch (error) {
        console.error('Error deleting appointment:', error);
        throw { message: 'Failed to delete appointment', error };
    }
});

// Invoice Handlers
ipcMain.handle('invoices:delete', async (event, id) => {
    try {
        await DatabaseService.deleteInvoice(id);
        return { success: true };
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw { message: 'Failed to delete invoice', error };
    }
});

// Invoice status update handler
ipcMain.handle('invoices:updateStatus', async (event, { id, status }) => {
    try {
        await DatabaseService.updateInvoiceStatus(id, status);
        return { success: true };
    } catch (error) {
        console.error('Error updating invoice status:', error);
        throw { message: error.message || 'Failed to update invoice status', error };
    }
});
// Invoice Handlers
ipcMain.handle('invoices:getAll', async () => {
    try {
        return await DatabaseService.getAllInvoices();
    } catch (error) {
        console.error('Error getting invoices:', error);
        throw { message: 'Failed to fetch invoices', error };
    }
});

ipcMain.handle('invoices:add', async (event, invoice) => {
    try {
        // Validate required fields
        if (!invoice.patientId || !invoice.date || !invoice.items || invoice.items.length === 0) {
            throw new Error('Patient, date, and at least one item are required (add)' );
        }

        // Validate each item
        for (const item of invoice.items) {
            if (!item.service || !item.unitPrice || !item.units) {
                throw new Error('Each item must have a service, unit price, units, and VAT rate');
            }
        }


        // Calculate total discount amount across all items
        const discountAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            const itemDiscountAmount = itemSubtotal * ((item.discount || 0) / 100);
            return sum + itemDiscountAmount;
        }, 0);
        // Calculate taxableAmount
        
        const taxableAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            // const discountAmount = itemSubtotal * ((item.discount || 0) / 100);
            return sum + itemSubtotal;
            console.log("items of invoice: ", item)
            
            // return sum + (itemSubtotal - discountAmount);
            
        }, 0);

        // commenting because don't want to calculate discount
        const vatAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            // const discountAmount = itemSubtotal * ((item.discount || 0) / 100);
            const taxableAmount = itemSubtotal - discountAmount;
            // const taxableAmount = itemSubtotal;
            return sum + (taxableAmount * (item.vat / 100));
        }, 0);

        const totalAmount = taxableAmount + vatAmount - discountAmount;

        // Add calculated totals to invoice
        const invoiceWithTotals = {
            ...invoice,
            taxableAmount,
            vatAmount,
            discountAmount,
            totalAmount,
            
        };

        return await DatabaseService.addInvoice(invoiceWithTotals);
    } catch (error) {
        console.error('Error adding invoice:', error);
        throw { message: error.message || 'Failed to add invoice', error };
    }
});

ipcMain.handle('invoices:update', async (event, { id, ...invoice }) => {
    try {
        // Validate required fields
        if (!invoice.patientId || !invoice.date || !invoice.items || invoice.items.length === 0) {
            throw new Error('Patient, date, and at least one item are required (update)');
        }

        // Validate each item
        for (const item of invoice.items) {
            if (!item.service || !item.unitPrice || !item.units ) {
            // if (!item.service || !item.unitPrice || !item.units || !item.vat) {
                throw new Error('Each item must have a service, unit price, units, and VAT rate');
            }
        }

        // Calculate total discount amount across all items
        const discountAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            const itemDiscountAmount = itemSubtotal * ((item.discount || 0) / 100);
            return sum + itemDiscountAmount;
        }, 0);
        
        // Calculate taxableAmount
        // commenting because don't want to calculate discount
        const taxableAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            // const discountAmount = itemSubtotal * ((item.discount || 0) / 100);
            return sum + itemSubtotal;
            // return sum + (itemSubtotal - discountAmount);
        }, 0);

        // commenting because don't want to calculate discount
        const vatAmount = invoice.items.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.units;
            // const discountAmount = itemSubtotal * ((item.discount || 0) / 100);
            // const taxableAmount = itemSubtotal;
            const taxableAmount = itemSubtotal - discountAmount;
            return sum + (taxableAmount * (item.vat / 100));
        }, 0);

        const totalAmount = taxableAmount + vatAmount - discountAmount;

        // Add calculated totals to invoice
        const invoiceWithTotals = {
            ...invoice,
            taxableAmount,
            vatAmount,
            discountAmount,
            totalAmount
        };

        return await DatabaseService.updateInvoice(id, invoiceWithTotals);
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw { message: error.message || 'Failed to update invoice', error };
    }
});

// Service Handlers
ipcMain.handle('services:getAll', async () => {
    try {
        return await DatabaseService.getAllServices();
    } catch (error) {
        console.error('Error getting services:', error);
        throw { message: 'Failed to fetch services', error };
    }
});

ipcMain.handle('services:add', async (event, service) => {
    try {
        if (!service.name) {
            throw new Error('Service name is required');
        }
        return await DatabaseService.addService(service);
    } catch (error) {
        console.error('Error adding service:', error);
        throw { message: error.message || 'Failed to add service', error };
    }
});

ipcMain.handle('services:update', async (event, { id, ...service }) => {
    try {
        if (!service.name) {
            throw new Error('Service name is required');
        }
        return await DatabaseService.updateService(id, service);
    } catch (error) {
        console.error('Error updating service:', error);
        throw { message: error.message || 'Failed to update service', error };
    }
});

ipcMain.handle('services:delete', async (event, id) => {
    try {
        return await DatabaseService.deleteService(id);
    } catch (error) {
        console.error('Error deleting service:', error);
        throw { message: 'Failed to delete service', error };
    }
});

// Utility Handlers
ipcMain.handle('patients:checkDNI', async (event, dni) => {
    try {
        return await DatabaseService.checkDNI(dni);
    } catch (error) {
        console.error('Error checking DNI:', error);
        throw { message: 'Failed to check DNI', error };
    }
});

// App lifecycle events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});