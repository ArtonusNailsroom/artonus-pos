require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'employee' }
});
const User = mongoose.model('User', userSchema);

// Booking Schema and Model
const bookingSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    service: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    status: { type: String, default: 'Pending' }
});
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware for Authentication
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('No token provided');

    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(403).send('Invalid token format');

    jwt.verify(parts[1], process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send('Invalid token');
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Routes
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Failed to register user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).send('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Incorrect password');

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Failed to log in');
    }
});

// Create Booking Route
app.post('/create-booking', authenticate, async (req, res) => {
    const { customerName, email, service, appointmentDate } = req.body;
    try {
        const newBooking = new Booking({ customerName, email, service, appointmentDate });
        await newBooking.save();
        res.status(201).send('Booking created successfully');
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).send('Failed to create booking');
    }
});

// Filter Bookings Route
app.get('/bookings', authenticate, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).send('Access denied');

    const { customerName, status, startDate, endDate } = req.query;
    const query = {};

    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (status) query.status = status;
    if (startDate || endDate) query.appointmentDate = {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate);
    if (endDate) query.appointmentDate.$lte = new Date(endDate);

    try {
        const bookings = await Booking.find(query);
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error filtering bookings:', err);
        res.status(500).send('Failed to retrieve bookings');
    }
});

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Artonus POS API!');
});

// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});