const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'baggage_db'
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to MySQL Database!");
});

db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.log("Users table error:", err);
});

// 1. Register API
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const query = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    
    db.query(query, [name, email, password], (err, result) => {
        if (err) {
            return res.status(400).json({ error: "Email already exists or database error" });
        }
        res.json({ message: "Registration successful!" });
    });
});

// 2. Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0) {
            res.json({ message: "Login successful!", user: results[0] });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

// Multer Storage for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// 3. Submit Bug Report
app.post('/api/bugs', upload.single('error_photo'), (req, res) => {
    const { operation_type, belt_number, box_destination, equipment_name, error_description } = req.body;
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `INSERT INTO bug_reports (operation_type, belt_number, box_destination, equipment_name, error_description, photo_path) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [operation_type, belt_number, box_destination, equipment_name, error_description, photo_path], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Bug reported successfully!" });
    });
});

// 4. Get All Bug Reports
app.get('/api/bugs', (req, res) => {
    db.query("SELECT * FROM bug_reports ORDER BY reported_at DESC", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// 5. Update Bug Status
app.put('/api/bugs/:id', (req, res) => {
    const { status } = req.body;
    db.query("UPDATE bug_reports SET status = ? WHERE id = ?", [status, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Status updated!" });
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));