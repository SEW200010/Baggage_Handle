const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas සම්බන්ධ කිරීම
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ඔබේ API routes මෙහි ලියන්න
app.get('/api/equipment', async (req, res) => {
  res.json({ message: "Success" });
});

// Vercel සඳහා export කිරීම (app.listen පාවිච්චි නොකරන්න)
module.exports = app;