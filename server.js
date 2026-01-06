/* =====================================================
   server.js
   HUCE HOTEL – MongoDB Atlas + JWT + Admin + Booking
===================================================== */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

/* =====================================================
   MIDDLEWARE
===================================================== */
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/* =====================================================
   CONNECT MONGODB
===================================================== */
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'hotel_abc'
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB error:', err.message);
  process.exit(1);
});

/* =====================================================
   MODELS
===================================================== */
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const BookingSchema = new mongoose.Schema({
  userName: String,
  userEmail: String,
  phone: String,
  roomId: Number,
  roomType: String,
  checkin: Date,
  checkout: Date,
  days: Number,
  totalPrice: Number,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const NewsSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const News = mongoose.model('News', NewsSchema);

/* =====================================================
   JWT MIDDLEWARE
===================================================== */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    req.user = decoded;
    next();
  });
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền admin'
    });
  }
  next();
}

/* =====================================================
   STATIC ROOMS DATA
===================================================== */
const rooms = [
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 101 + i,
    type: 'Phòng Đơn',
    price: 800000
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 201 + i,
    type: 'Phòng Đôi',
    price: 1200000
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 301 + i,
    type: 'Phòng VIP Suite',
    price: 2800000
  }))
];

/* =====================================================
   AUTH
===================================================== */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed
    });

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không đúng' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không đúng' });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   BOOKINGS – USER
===================================================== */
app.post('/api/bookings', verifyToken, async (req, res) => {
  try {
    const roomId = parseInt(req.body.roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }

    const checkin = new Date(req.body.checkin);
    const checkout = new Date(req.body.checkout);
    if (isNaN(checkin) || isNaN(checkout) || checkin >= checkout) {
      return res.status(400).json({ success: false, message: 'Ngày check-in/check-out không hợp lệ' });
    }

    const days = Math.max(
      1,
      Math.ceil((checkout - checkin) / 86400000)
    );

    // Kiểm tra availability: không có booking approved overlapping
    const overlapping = await Booking.find({
      roomId,
      status: 'approved',
      $or: [
        { checkin: { $lt: checkout }, checkout: { $gt: checkin } }
      ]
    }).countDocuments();

    if (overlapping > 0) {
      return res.status(400).json({ success: false, message: 'Phòng đã được đặt trong khoảng thời gian này' });
    }

    const booking = await Booking.create({
      userName: req.body.userName,
      userEmail: req.user.email, // Override để bảo mật
      phone: req.body.phone,
      roomId,
      roomType: room.type,
      checkin,
      checkout,
      days,
      totalPrice: days * room.price
    });

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/bookings/my', verifyToken, async (req, res) => {
  try {
    const data = await Booking.find({
      userEmail: req.user.email
    }).sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   BOOKINGS – ADMIN
===================================================== */
app.get('/api/admin/bookings', verifyToken, isAdmin, async (req, res) => {
  try {
    const data = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/bookings/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking không tồn tại' });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   NEWS (PUBLIC & ADMIN)
===================================================== */
app.get('/api/news', async (req, res) => {
  try {
    const data = await News.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/news', verifyToken, isAdmin, async (req, res) => {
  try {
    const data = await News.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/news', verifyToken, isAdmin, async (req, res) => {
  try {
    const news = await News.create(req.body);
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Lỗi server' });
});

/* =====================================================
   START SERVER
===================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});