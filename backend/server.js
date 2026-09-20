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


const uploadDir = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/baggage_db';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully at:', MONGO_URI);
    
    // Seed default equipment list if collection is empty
    const count = await Equipment.countDocuments();
    if (count === 0) {
      await Equipment.insertMany([
        { name: 'Baggage Belt 01', type: 'Conveyor', location: 'Arrival Sector A', category: 'Mechanical' },
        { name: 'Baggage Belt 02', type: 'Conveyor', location: 'Arrival Sector B', category: 'Mechanical' },
        { name: 'X-Ray Scanner 01', type: 'Scanner', location: 'Security Check 1', category: 'Electrical' },
        { name: 'Luggage Loader 03', type: 'Loader', location: 'Departure Gate 4', category: 'Hydraulic' }
      ]);
      console.log('Seeded default equipment list into MongoDB.');
    }
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.status(200).json({ message: "Backend is running successfully!" });
});
app.get('/api/view-photo', async (req, res) => {
  try {
    const rawPath = req.query.path;
    if (!rawPath) return res.status(400).send('No path specified');
    
    // Vercel එකේ නම් /tmp/uploads, ලෝකල් නම් __dirname/uploads පාවිච්චි කරයි
    const fileName = path.basename(rawPath);
    const fullPath = path.join(uploadDir, fileName);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
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
    res.status(500).send('Error loading image');
  }
});
// --- AUTH ENDPOINTS ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EQUIPMENT LIST ENDPOINT (Normalized for Mongo Compass CSV Import) ---
app.get('/api/equipment', async (req, res) => {
  try {
    let items = await Equipment.find().lean();

    // If Equipment.find() returns 0, check other potential collection names (e.g. 'equipments' or 'Equipment')
    if (items.length === 0 && mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const colNames = collections.map(c => c.name);
      
      let targetCol = colNames.find(n => n.toLowerCase().includes('equipment'));
      if (targetCol) {
        items = await mongoose.connection.db.collection(targetCol).find().toArray();
      }
    }

    // Normalize field names from CSV imports (Name, Type, Location, Catogory, Status)
    const normalized = items.map(item => ({
      _id: item._id,
      name: (item.name || item.Name || item['Equipment Name'] || item['Name '] || '').toString().trim(),
      type: (item.type || item.Type || item['Type '] || '').toString().trim(),
      location: (item.location || item.Location || item['Location '] || '').toString().trim(),
      category: (item.category || item.Catogory || item.Category || item['Catogory '] || '').toString().trim(),
      status: (item.status || item.Status || 'Active').toString().trim(),
      equipment_id: (item['Equipment ID'] || item.equipment_id || item.id || '').toString().trim()
    })).filter(item => item.name);

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching equipment list:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- BUG REPORTING ENDPOINTS ---

// 1. Submit a new bug report
app.post('/api/bugs', upload.single('error_photo'), async (req, res) => {
  try {
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;
    const bug = new Bug({
      operation_type: req.body.operation_type,
      equipment_name: req.body.equipment_name,
      equipment_type: req.body.equipment_type || '',
      location: req.body.location || '',
      category: req.body.category || '',
      issue_type: req.body.issue_type || 'None',
      severity: req.body.severity || 'None',
      error_description: req.body.error_description,
      photo_path
    });

    const savedBug = await bug.save();
    const shortId = savedBug._id.toString().slice(-4).toUpperCase();
    res.status(201).json({ message: 'Bug reported successfully', ticketId: `#GBS-${shortId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get all bug reports
app.get('/api/bugs', async (req, res) => {
  try {
    const bugs = await Bug.find().sort({ created_at: -1 });
    res.json(bugs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update bug report (PUT)
app.put('/api/bugs/:id', async (req, res) => {
  try {
    const allowedColumns = [
      'operation_type', 
      'equipment_name', 
      'equipment_type', 
      'location', 
      'category', 
      'issue_type', 
      'severity', 
      'error_description', 
      'photo_path', 
      'status'
    ];

    const updates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedColumns.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const updatedBug = await Bug.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedBug) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Bug report updated successfully', bug: updatedBug });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a bug report
app.delete('/api/bugs/:id', async (req, res) => {
  try {
    const deletedBug = await Bug.findByIdAndDelete(req.params.id);
    if (!deletedBug) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000 (MongoDB Compass Ready)');
});