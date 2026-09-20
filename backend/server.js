const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Models
const User = require('./models/User');
const Equipment = require('./models/Equipment');
const Bug = require('./models/Bug');

const app = express();
app.use(cors());
app.use(express.json());

// Vercel සඳහා /tmp/uploads සහ Local සඳහා uploads/ ෆෝල්ඩරය ස්වයංක්‍රීයව සැකසීම
const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// Disable strictPopulate globally to prevent server crashes on populate
mongoose.set('strictPopulate', false);

// MongoDB Serverless Connection Helper
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  let MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/baggage_db';
  if (!process.env.MONGO_URI) {
    console.warn('WARNING: MONGO_URI environment variable is not set in Vercel!');
  }
  await mongoose.connect(MONGO_URI, {
    dbName: process.env.DB_NAME || 'test'
  });
  isConnected = true;
  console.log('Connected to MongoDB successfully');
};

// Middleware to ensure DB connection on every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database Connection Middleware Error:', err);
    return res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// Multer Storage Configuration (Vercel සහ Local සඳහා එකම විදිහට ක්‍රියාත්මක වේ)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// --- Root Endpoint ---
app.get('/', (req, res) => {
    res.status(200).json({ message: "Backend is running successfully!" });
});

// --- Photo View Endpoint (Converts TIF/TIFF to PNG with safety checks) ---
app.get('/api/view-photo', async (req, res) => {
  try {
    const rawPath = req.query.path;
    if (!rawPath) return res.status(400).send('No path specified');
    
    const fileName = path.basename(rawPath);
    const fullPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Image expired or not found on server storage.' });
    }

    const ext = path.extname(fullPath).toLowerCase();
    
    if (ext === '.tif' || ext === '.tiff') {
      const pngBuffer = await sharp(fullPath).toFormat('png').toBuffer();
      res.set('Content-Type', 'image/png');
      return res.send(pngBuffer);
    }

    res.sendFile(fullPath);
  } catch (err) {
    console.error('Error serving photo:', err);
    res.status(500).send('Error loading image: ' + err.message);
  }
});

// --- AUTH: Register Route ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    const nameToSave = name || username;

    if (!nameToSave || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    const newUser = new User({ name: nameToSave, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Server error during registration' });
  }
});

// --- AUTH: Login Route ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error during login' });
  }
});

// --- EQUIPMENT: Get All Equipment (Manual CSV uploaded data) ---
app.get('/api/equipment', async (req, res) => {
  try {
    let equipments = await Equipment.find();

    // Fallback: If Equipment.find() returns empty, check MongoDB Atlas active collections
    if (!equipments || equipments.length === 0) {
      const db = mongoose.connection.db;
      if (db) {
        const collections = await db.listCollections().toArray();
        const names = collections.map(c => c.name);
        const targetCol = names.find(n => ['equipment', 'equipments', 'Equipment', 'Equipments'].includes(n));
        if (targetCol) {
          equipments = await db.collection(targetCol).find({}).toArray();
        }
      }
    }

    // Normalize document fields for frontend display
    const normalized = (equipments || []).map(eq => {
      const doc = eq.toObject ? eq.toObject() : eq;
      return {
        ...doc,
        _id: doc._id,
        name: doc.name || doc.Name || doc['Equipment Name'] || doc['Equipment ID'] || doc.equipment_id || 'Equipment Item',
        type: doc.type || doc.Type || doc['Equipment Type'] || '',
        location: doc.location || doc.Location || '',
        category: doc.category || doc.Category || doc.Catogory || ''
      };
    });

    res.status(200).json(normalized);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Failed to fetch equipment data' });
  }
});

// --- BUGS: Create Bug (with image upload) ---
app.post('/api/bugs', upload.single('error_photo'), async (req, res) => {
  try {
    const {
      operation_type,
      equipment_name,
      equipment_type,
      location,
      category,
      issue_type,
      severity,
      error_description
    } = req.body;

    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    const newBug = new Bug({
      operation_type: operation_type || 'Arrival',
      equipment_name: equipment_name || 'Unknown Equipment',
      equipment_type: equipment_type || '',
      location: location || '',
      category: category || '',
      issue_type: issue_type || 'None',
      severity: severity || 'None',
      error_description: error_description || '',
      photo_path
    });

    await newBug.save();
    res.status(201).json({ message: 'Bug reported successfully', bug: newBug, ticketId: newBug._id });
  } catch (err) {
    console.error('Error creating bug:', err);
    res.status(500).json({ error: 'Failed to create bug report' });
  }
});

// --- BUGS: Get All Bugs ---
app.get('/api/bugs', async (req, res) => {
  try {
    const bugs = await Bug.find().sort({ created_at: -1 });
    res.status(200).json(bugs);
  } catch (err) {
    console.error('Error fetching bugs:', err);
    res.status(500).json({ error: 'Failed to fetch bugs' });
  }
});

// --- BUGS: Update Bug ---
app.put('/api/bugs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBug = await Bug.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    res.status(200).json({ message: 'Bug updated successfully', bug: updatedBug });
  } catch (err) {
    console.error('Error updating bug:', err);
    res.status(500).json({ error: 'Failed to update bug' });
  }
});

// --- BUGS: Delete Bug ---
app.delete('/api/bugs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBug = await Bug.findByIdAndDelete(id);
    if (!deletedBug) {
      return res.status(404).json({ error: 'Bug not found' });
    }
    res.status(200).json({ message: 'Bug deleted successfully' });
  } catch (err) {
    console.error('Error deleting bug:', err);
    res.status(500).json({ error: 'Failed to delete bug' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Legacy server listening on port ${PORT}`);
});

module.exports = app;