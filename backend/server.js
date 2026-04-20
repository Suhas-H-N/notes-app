const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ===== SCHEMAS =====
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

const noteSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, default: '', trim: true },
  text:     { type: String, default: '', trim: true },
  category: { type: String, enum: ['personal', 'work', 'ideas', 'important'], default: 'personal' },
  pinned:   { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Note = mongoose.model('Note', noteSchema);

// ===== JWT AUTH MIDDLEWARE =====
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// ===== AUTH ROUTES =====

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== NOTES ROUTES (all protected) =====

// GET /notes
app.get('/notes', authenticateToken, async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { userId: req.user.id };

    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { text:  { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(query).sort({ pinned: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /notes/:id
app.get('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /notes
app.post('/notes', authenticateToken, async (req, res) => {
  try {
    const { title, text, category, pinned } = req.body;

    if (!title?.trim() && !text?.trim())
      return res.status(400).json({ message: 'A note must have a title or some content' });

    const note = await Note.create({
      userId: req.user.id,
      title:    title    || '',
      text:     text     || '',
      category: category || 'personal',
      pinned:   pinned   || false,
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /notes/:id
app.put('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { title, text, category, pinned } = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, text, category, pinned },
      { new: true, runValidators: true }
    );

    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /notes/:id
app.delete('/notes/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== DELETE ALL NOTES (for a user) =====
app.delete('/notes', authenticateToken, async (req, res) => {
  try {
    await Note.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`✦ Notely server running at http://localhost:${PORT}`);
});
