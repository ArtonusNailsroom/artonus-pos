const express = require('express');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

// Log environment variables for debugging
console.log("Client ID:", process.env.CLIENT_ID);
console.log("Client Secret:", process.env.CLIENT_SECRET);
console.log("Redirect URI:", process.env.REDIRECT_URI);
console.log("Refresh Token:", process.env.REFRESH_TOKEN);

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Google OAuth2 Client setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// Booking endpoint
app.post('/booking', async (req, res) => {
  const { name, service, date, email } = req.body;

  if (!name || !service || !date || !email) {
    return res.status(400).json({ error: 'Please provide all booking details, including email' });
  }

  console.log(`${name} booked ${service} on ${date}`);

  const emailContent = `
    Hello ${name},
    Thank you for booking a ${service} on ${date}!
    We look forward to seeing you.

    - Artonus Nailsroom
  `;

  try {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const rawEmail = Buffer.from(
      `To: ${email}\nSubject: Booking Confirmation\n\n${emailContent}`
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawEmail },
    });

    res.status(200).json({ message: 'Booking received and confirmation email sent!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send confirmation email' });
  }
});

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to Artonus POS System');
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

