const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const router = express.Router();

const SECRET_KEY = 'super_secret_key_for_bi_helpdesk';

// Register User (For initial setup/testing)
router.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);
    const userRole = role === 'admin' ? 'admin' : 'user';

    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, userRole], function(err) {
        if (err) {
            return res.status(500).json({ error: 'User already exists or database error.' });
        }
        res.status(201).json({ message: 'User registered successfully!', id: this.lastID });
    });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found!' });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password!' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, role: user.role, username: user.username, id: user.id });
    });
});

// Middleware to protect routes
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided.' });

    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate token.' });
        req.user = decoded;
        next();
    });
};

// Middleware for Admin only
const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Requires Admin Role!' });
    }
    next();
};

module.exports = { route: router, verifyToken, verifyAdmin };
