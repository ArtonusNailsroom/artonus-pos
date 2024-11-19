const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    service: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    status: { type: String, default: 'Pending' },  // Pending, Confirmed, Completed, etc.
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;

