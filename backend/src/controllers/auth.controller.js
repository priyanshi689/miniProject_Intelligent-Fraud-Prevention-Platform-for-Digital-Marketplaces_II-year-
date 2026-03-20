const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User.model');

const generateToken = (user) => jwt.sign(
  { id: user._id, userId: user.userId, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE }
);

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({
      userId: uuidv4(), name, email, password,
      role: role || 'analyst',
      metadata: { registrationIp: req.ip, userAgent: req.headers['user-agent'] }
    });
    const token = generateToken(user);
    res.status(201).json({ success: true, token, user: { id: user.userId, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended' });
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user.userId, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe };
