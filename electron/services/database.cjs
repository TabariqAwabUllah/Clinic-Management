const sqlite3 = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseService {
    constructor() {
        this.db = new sqlite3(path.join(app.getPath('userData'), 'clinic.db'));
        this.initDatabase();
    }
    updateAppointmentStatus(id, status) {
        try {
            const stmt = this.db.prepare('UPDATE appointments SET status = ? WHERE id = ?');
            const result = stmt.run(status, id);
            
            if (result.changes === 0) {
                throw new Error('Appointment not found');
            }
            
            return true;
        } catch (error) {
            console.error('Error updating appointment status:', error);
            throw error;
        }
    }
    initDatabase() {
        try {
            // Disable foreign keys temporarily for initialization
            this.db.exec('PRAGMA foreign_keys = OFF;');

            // Wrap all table creation in a transaction
            this.db.transaction(() => {
                // Drop existing tables in reverse order of dependencies
                this.db.exec(`
                    DROP TABLE IF EXISTS invoice_items;
                    DROP TABLE IF EXISTS invoices;
                    DROP TABLE IF EXISTS appointments;
                    DROP TABLE IF EXISTS services;
                    DROP TABLE IF EXISTS providers;
                    DROP TABLE IF EXISTS patients;
                `);
                

                // Create patients table
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS patients (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        firstName TEXT NOT NULL,
                        lastName TEXT NOT NULL,
                        secondLastName TEXT,
                        dni TEXT UNIQUE NOT NULL,
                        dob DATE NOT NULL,
                        cellPhone TEXT NOT NULL,
                        email TEXT,
                        address TEXT,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // Create providers table with updated schema
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS providers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        firstName TEXT NOT NULL,
                        lastName TEXT NOT NULL,
                        specialty TEXT,
                        email TEXT,
                        phone TEXT,
                        color TEXT NOT NULL,
                        status TEXT DEFAULT 'active',
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);

                // Create appointments table
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS appointments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        patientId INTEGER,
                        providerId INTEGER,
                        serviceType TEXT,
                        appointmentDate DATE NOT NULL,
                        appointmentTime TIME NOT NULL,
                        duration INTEGER DEFAULT 30,
                        notes TEXT,
                        status TEXT DEFAULT 'scheduled',
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
                        FOREIGN KEY (providerId) REFERENCES providers(id) ON DELETE SET NULL
                    );
                `);

                // Create invoices table
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS invoices (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        number TEXT UNIQUE NOT NULL,
                        patientId INTEGER,
                        date DATE NOT NULL,
                        status TEXT DEFAULT 'pending',
                        taxableAmount DECIMAL(10,2) NOT NULL,
                        vatAmount DECIMAL(10,2),
                        discountAmount DECIMAL(10,2),
                        totalAmount DECIMAL(10,2) NOT NULL,
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
                    );

                    CREATE TABLE IF NOT EXISTS invoice_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        invoiceId INTEGER NOT NULL,
                        serviceId INTEGER,
                        description TEXT,
                        unitPrice DECIMAL(10,2) NOT NULL,
                        units INTEGER NOT NULL,
                        vatRate DECIMAL(5,2) NOT NULL,
                        discountRate DECIMAL(5,2) DEFAULT 0,
                        FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
                        FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE SET NULL
                    );
                `);

                // Create services table
                this.db.exec(`
                        CREATE TABLE IF NOT EXISTS services (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        status TEXT DEFAULT 'active',
                        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                `);

          
            })();

            // Re-enable foreign keys
            this.db.exec('PRAGMA foreign_keys = ON;');

        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    // Patient Methods
    getAllPatients() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    p.*,
                    COUNT(DISTINCT a.id) as appointmentCount,
                    COUNT(DISTINCT i.id) as invoiceCount,
                    COALESCE(SUM(i.totalAmount), 0) as totalBilled
                FROM patients p
                LEFT JOIN appointments a ON p.id = a.patientId
                LEFT JOIN invoices i ON p.id = i.patientId
                GROUP BY p.id
                ORDER BY p.createdAt DESC
            `);
            return stmt.all();
        } catch (error) {
            console.error('Error getting patients:', error);
            throw error;
        }
    }

    addPatient(patient) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO patients (
                    firstName, lastName, secondLastName, dni, 
                    dob, cellPhone, email, address
                ) VALUES (
                    @firstName, @lastName, @secondLastName, @dni,
                    @dob, @cellPhone, @email, @address
                )
            `);
            const result = stmt.run(patient);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding patient:', error);
            throw error;
        }
    }

    updatePatient(id, patient) {
        try {
            const stmt = this.db.prepare(`
                UPDATE patients 
                SET firstName = @firstName,
                    lastName = @lastName,
                    secondLastName = @secondLastName,
                    dni = @dni,
                    dob = @dob,
                    cellPhone = @cellPhone,
                    email = @email,
                    address = @address
                WHERE id = @id
            `);
            return stmt.run({ ...patient, id });
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    }

    deletePatient(id) {
        try {
            return this.db.transaction(() => {
                const stmt = this.db.prepare('DELETE FROM patients WHERE id = ?');
                return stmt.run(id);
            })();
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    }

    getPatientByDNI(dni) {
        try {
            const stmt = this.db.prepare('SELECT * FROM patients WHERE dni = ?');
            return stmt.get(dni);
        } catch (error) {
            console.error('Error getting patient by DNI:', error);
            throw error;
        }
    }

    // Provider Methods
    getAllProviders() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    p.*,
                    COUNT(a.id) as appointmentCount
                FROM providers p
                LEFT JOIN appointments a ON p.id = a.providerId
                WHERE p.status = 'active'
                GROUP BY p.id
                ORDER BY p.firstName, p.lastName
            `);
            return stmt.all();
        } catch (error) {
            console.error('Error getting providers:', error);
            throw error;
        }
    }

    checkTableStructure() {
        try {
            const schema = this.db.prepare("PRAGMA table_info(providers)").all();
            console.log('Providers table schema (complete):', JSON.stringify(schema, null, 2));
            return schema;
        } catch (error) {
            console.error('Error checking table structure:', error);
            throw error;
        }
    }

    addProvider(provider) {
        this.checkTableStructure
        try {
            const stmt = this.db.prepare(`
                INSERT INTO providers (
                    firstName, lastName, specialty, email, phone, color, status
                ) VALUES (
                    @firstName, @lastName, @specialty, @email, @phone, @color, @status
                )
            `);
            const result = stmt.run({
                ...provider,
                status: 'active'
            });
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding provider:', error);
            throw error;
        }
    }

    updateProvider(id, updates) {
        try {
            // Build the update query dynamically based on provided fields
            const updateFields = [];
            const params = { id };

            // Only include fields that are provided in the updates
            if (updates.firstName !== undefined) {
                updateFields.push('firstName = @firstName');
                params.firstName = updates.firstName;
            }
            if (updates.lastName !== undefined) {
                updateFields.push('lastName = @lastName');
                params.lastName = updates.lastName;
            }
            if (updates.specialty !== undefined) {
                updateFields.push('specialty = @specialty');
                params.specialty = updates.specialty;
            }
            if (updates.email !== undefined) {
                updateFields.push('email = @email');
                params.email = updates.email;
            }
            if (updates.phone !== undefined) {
                updateFields.push('phone = @phone');
                params.phone = updates.phone;
            }
            if (updates.color !== undefined) {
                updateFields.push('color = @color');
                params.color = updates.color;
            }
            if (updates.status !== undefined) {
                updateFields.push('status = @status');
                params.status = updates.status;
            }

            // If no fields to update, return early
            if (updateFields.length === 0) {
                return { changes: 0 };
            }

            const query = `
                UPDATE providers 
                SET ${updateFields.join(', ')}
                WHERE id = @id
            `;

            const stmt = this.db.prepare(query);
            return stmt.run(params);
        } catch (error) {
            console.error('Error updating provider:', error);
            throw error;
        }
    }

    deleteProvider(id) {
        try {
            // Update status to 'inactive' for soft delete
            const stmt = this.db.prepare(`
                UPDATE providers 
                SET status = 'inactive'
                WHERE id = @id
            `);
            return stmt.run({ id });
        } catch (error) {
            console.error('Error deleting provider:', error);
            throw error;
        }
    }

    // Appointment Methods
    getAllAppointments() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    a.*,
                    p.firstName || ' ' || p.lastName || ' ' || COALESCE(p.secondLastName, '') as patientName,
                    p.dni as patientDNI,
                    p.cellPhone as patientCellPhone,
                    prov.firstName || ' ' || prov.lastName as providerName,
                    prov.color as providerColor,
                    prov.specialty as providerSpecialty
                FROM appointments a
                LEFT JOIN patients p ON a.patientId = p.id
                LEFT JOIN providers prov ON a.providerId = prov.id
                /* WHERE a.status != 'cancelled' */
                ORDER BY a.appointmentDate, a.appointmentTime
            `);
            return stmt.all();
        } catch (error) {
            console.error('Error getting appointments:', error);
            throw error;
        }
    }

    addAppointment(appointment) {
        try {
            // First, get the provider details
            const providerStmt = this.db.prepare(`
                SELECT firstName, lastName, color
                FROM providers
                WHERE id = ?
            `);
            const provider = providerStmt.get(appointment.providerId);
            
            if (!provider) {
                throw new Error('Provider not found');
            }

            const stmt = this.db.prepare(`
                INSERT INTO appointments (
                    patientId, providerId, serviceType,
                    appointmentDate, appointmentTime, duration, notes, status
                ) VALUES (
                    @patientId, @providerId, @serviceType,
                    @appointmentDate, @appointmentTime, @duration, @notes, @status
                )
            `);

            const result = stmt.run({
                ...appointment,
                status: appointment.status || 'scheduled'
            });

            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding appointment:', error);
            throw error;
        }
    }

    updateAppointment(id, appointment) {
        try {
            // First, get the provider details
            const providerStmt = this.db.prepare(`
                SELECT firstName, lastName, color
                FROM providers
                WHERE id = ?
            `);
            const provider = providerStmt.get(appointment.providerId);
            
            if (!provider) {
                throw new Error('Provider not found');
            }

            const stmt = this.db.prepare(`
                UPDATE appointments 
                SET patientId = @patientId,
                    providerId = @providerId,
                    serviceType = @serviceType,
                    appointmentDate = @appointmentDate,
                    appointmentTime = @appointmentTime,
                    duration = @duration,
                    notes = @notes,
                    status = @status
                WHERE id = @id
            `);
            return stmt.run({ ...appointment, id });
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    

    // Add this method to check for appointment conflicts
    checkAppointmentConflict(date, time, duration, providerId, excludeAppointmentId = null) {
        try {
            let query = `
                SELECT COUNT(*) as count 
                FROM appointments
                WHERE appointmentDate = @date
                AND providerId = @providerId
                AND status != 'cancelled'
                AND (
                    (@time BETWEEN appointmentTime AND time(appointmentTime, '+' || duration || ' minutes'))
                    OR
                    (time(@time, '+' || @duration || ' minutes') BETWEEN appointmentTime AND time(appointmentTime, '+' || duration || ' minutes'))
                )
            `;

            if (excludeAppointmentId) {
                query += ' AND id != @excludeAppointmentId';
            }

            const stmt = this.db.prepare(query);
            const result = stmt.get({
                date,
                time,
                duration,
                providerId,
                excludeAppointmentId
            });

            return result.count > 0;
        } catch (error) {
            console.error('Error checking appointment conflict:', error);
            throw error;
        }
    }

    deleteAppointment(id) {
        try {
            const stmt = this.db.prepare('DELETE FROM appointments WHERE id = ?');
            return stmt.run(id);
        } catch (error) {
            console.error('Error deleting appointment:', error);
            throw error;
        }
    }

    // Invoice Methods
// Add this to your DatabaseService class

addInvoice(invoiceData) {
    try {
        return this.db.transaction(() => {

            // if got invoice number from import           
            let invoiceNumber = invoiceData.number ? invoiceData.number : null

            // console.log("invoice Data param:",invoiceData,
            //     " Invoice number in addinvoice", invoiceNumber);
            
            

            // If not importing infact generating invoice entry
            if (!invoiceNumber) {
                // Generate invoice number based on year
                const year = new Date(invoiceData.date).getFullYear().toString().slice(-2);
                const lastInvoiceStmt = this.db.prepare(`
                    SELECT MAX(CAST(SUBSTR(number, 3) AS INTEGER)) as lastNumber
                    FROM invoices
                    WHERE number LIKE ?
                `);
                const result = lastInvoiceStmt.get(`${year}%`);
                const nextNumber = (result?.lastNumber || 0) + 1;
                invoiceNumber = `${year}${nextNumber.toString().padStart(4, '0')}`;
            }
           

            // Insert main invoice record
            const invoiceStmt = this.db.prepare(`
                INSERT INTO invoices (
                    number,
                    patientId,
                    date,
                    status,
                    taxableAmount,
                    vatAmount,
                    discountAmount,
                    totalAmount
                ) VALUES (
                    @number,
                    @patientId,
                    @date,
                    @status,
                    @taxableAmount,
                    @vatAmount,
                    @discountAmount,
                    @totalAmount
                )
            `);

            const { lastInsertRowid: invoiceId } = invoiceStmt.run({
                number: invoiceNumber,
                patientId: invoiceData.patientId,
                date: invoiceData.date,
                status: invoiceData.status || 'pending',
                taxableAmount: invoiceData.taxableAmount,
                vatAmount: invoiceData.vatAmount,
                discountAmount: invoiceData.discountAmount,
                totalAmount: invoiceData.totalAmount

            });

            // Insert invoice items
            const itemStmt = this.db.prepare(`
                INSERT INTO invoice_items (
                    invoiceId,
                    serviceId,
                    description,
                    unitPrice,
                    units,
                    vatRate
                    , discountRate
                ) VALUES (
                    @invoiceId,
                    @serviceId,
                    @description,
                    @unitPrice,
                    @units,
                    @vatRate
                    , @discountRate
                )
            `);

            for (const item of invoiceData.items) {
                itemStmt.run({
                    invoiceId,
                    serviceId: item.service,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    units: item.units,
                    vatRate: item.vat,
                    discountRate: item.discount || 0
                });
            }

            return invoiceId;
        })();
    } catch (error) {
        console.error('Error adding invoice:', error);
        throw error;
    }
}

getAllInvoices() {
    try {
        // Get all invoices with patient details
        const invoiceStmt = this.db.prepare(`
            SELECT 
                i.id,
                i.number,
                i.patientId,
                i.date,
                i.status,
                i.taxableAmount,
                i.vatAmount,
                i.discountAmount,
                i.totalAmount,
                i.createdAt,
                p.firstName || ' ' || p.secondLastName || ' ' || p.lastName as patientName,
                p.dni as patientDNI
            FROM invoices i
            LEFT JOIN patients p ON i.patientId = p.id
            ORDER BY i.date DESC, i.number DESC
        `);
        const invoices = invoiceStmt.all();

        // Get items for each invoice with service details
        const itemStmt = this.db.prepare(`
            SELECT 
                ii.*,
                s.name as serviceName,
                s.id as serviceId
            FROM invoice_items ii
            LEFT JOIN services s ON ii.serviceId = s.id
            WHERE ii.invoiceId = ?
        `);

        // Attach items to their respective invoices
        return invoices.map(invoice => {
            const items = itemStmt.all(invoice.id).map(item => ({
                service: item.serviceId,       // Using serviceId for the service field
                serviceName: item.serviceName, // Keep service name for display
                unitPrice: item.unitPrice,
                units: item.units,
                vat: item.vatRate,
                discount: item.discountRate ,
                description: item.description
            }));

            const services = items.map(item => item.serviceName).filter(Boolean);
            return {
                ...invoice,
                items,
                services: services.join(', ')
            };
        });
    } catch (error) {
        console.error('Error getting invoices:', error);
        throw error;
    }
}
updateInvoiceStatus(id, status) {
    try {
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        const stmt = this.db.prepare(`
            UPDATE invoices 
            SET status = ?
            WHERE id = ?
        `);
        
        const result = stmt.run(status, id);
        
        if (result.changes === 0) {
            throw new Error('Invoice not found');
        }
        
        return true;
    } catch (error) {
        console.error('Error updating invoice status:', error);
        throw error;
    }
}
updateInvoice(id, invoice) {
    try {
        return this.db.transaction((invoice) => {
            // Update main invoice record
            const invoiceStmt = this.db.prepare(`
                UPDATE invoices 
                SET patientId = @patientId,
                    date = @date,
                    status = @status,
                    taxableAmount = @taxableAmount,
                    vatAmount = @vatAmount,
                    discountAmount = @discountAmount,
                    totalAmount = @totalAmount
                WHERE id = @id
            `);

            invoiceStmt.run({
                id,
                patientId: invoice.patientId,
                date: invoice.date,
                status: invoice.status,
                taxableAmount: invoice.taxableAmount,
                vatAmount: invoice.vatAmount,
                discountAmount: invoice.discountAmount,
                totalAmount: invoice.totalAmount
            });

            // Delete existing items
            this.db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id);

            // Insert new invoice items
            const itemStmt = this.db.prepare(`
                INSERT INTO invoice_items (
                    invoiceId,
                    serviceId,
                    description,
                    unitPrice,
                    units,
                    vatRate
                    , discountRate
                ) VALUES (
                    @invoiceId,
                    @serviceId,
                    @description,
                    @unitPrice,
                    @units,
                    @vatRate 
                    , @discountRate 
                )
            `);

            for (const item of invoice.items) {
                itemStmt.run({
                    invoiceId: id,
                    serviceId: item.service,
                    description: item.description,
                    unitPrice: item.unitPrice,
                    units: item.units,
                    vatRate: item.vat,
                    discountRate: item.discount || 0
                });
            }

            return id;
        })(invoice);
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw error;
    }
}

deleteInvoice(id) {
    try {
        return this.db.transaction(() => {
            // First check if invoice exists
            const checkStmt = this.db.prepare('SELECT id FROM invoices WHERE id = ?');
            const invoice = checkStmt.get(id);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Delete invoice items first
            const deleteItemsStmt = this.db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?');
            deleteItemsStmt.run(id);

            // Then delete the invoice
            const deleteInvoiceStmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
            const result = deleteInvoiceStmt.run(id);

            if (result.changes === 0) {
                throw new Error('Failed to delete invoice');
            }

            return { success: true };
        })();
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
}

    // Service Methods
    getAllServices() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM services
                WHERE status = 'active'
                ORDER BY name
            `);
            return stmt.all();
        } catch (error) {
            console.error('Error getting services:', error);
            throw error;
        }
    }

    addService(service) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO services (name, status)
                VALUES (@name, 'active')
            `);
            const result = stmt.run(service);
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error adding service:', error);
            throw error;
        }
    }

    updateService(id, service) {
        try {
            const stmt = this.db.prepare(`
                UPDATE services 
                SET name = @name
                WHERE id = @id
            `);
            return stmt.run({ ...service, id });
        } catch (error) {
            console.error('Error updating service:', error);
            throw error;
        }
    }

    deleteService(id) {
        try {
            const stmt = this.db.prepare(`
                UPDATE services 
                SET status = 'inactive'
                WHERE id = ?
            `);
            return stmt.run(id);
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    }

    // Utility Methods
    checkDNI(dni) {
        try {
            const stmt = this.db.prepare('SELECT COUNT(*) as count FROM patients WHERE dni = ?');
            const result = stmt.get(dni);
            return result.count > 0;
        } catch (error) {
            console.error('Error checking DNI:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();