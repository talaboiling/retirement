const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
const GUESTS_FILE = path.join(__dirname, 'guests.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve standard files

// Utility to read guests
function getGuests() {
  try {
    if (!fs.existsSync(GUESTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(GUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading guests file:', err);
    return [];
  }
}

// Utility to write guests
function saveGuests(guests) {
  try {
    fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing guests file:', err);
  }
}

// Get all guests
app.get('/api/guests', (req, res) => {
  const guests = getGuests();
  res.json(guests);
});

// Save a guest
app.post('/api/rsvp', (req, res) => {
  const { name, attending } = req.body;
  if (!name || !attending) {
    return res.status(400).json({ error: 'Name and attending status are required' });
  }

  const guests = getGuests();
  // Prevent duplicate names by updating existing or adding new
  const existingIndex = guests.findIndex(g => g.name.toLowerCase() === name.trim().toLowerCase());
  const entry = {
    name: name.trim(),
    attending: attending,
    date: new Date().toISOString()
  };

  if (existingIndex > -1) {
    guests[existingIndex] = entry;
  } else {
    guests.push(entry);
  }

  saveGuests(guests);
  res.json({ success: true, guests });
});

// Download CSV
app.get('/api/guests/download', (req, res) => {
  const guests = getGuests();
  if (guests.length === 0) {
    return res.status(404).send('No guests found');
  }

  let csv = 'Name,Attending,RSVP Date\n';
  guests.forEach(g => {
    const name = g.name.replace(/"/g, '""');
    const status = g.attending === 'yes' ? 'Yes' : 'No';
    const date = new Date(g.date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    csv += `"${name}","${status}","${date}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=birthday_guest_list.csv');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
