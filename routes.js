const express = require('express');
const db = require('./database');
const { verifyToken, verifyAdmin } = require('./auth');
const router = express.Router();

// --- USER ROUTES ---

// Create a Ticket
router.post('/tickets', verifyToken, (req, res) => {
    const { title, description } = req.body;
    db.run('INSERT INTO tickets (title, description, user_id) VALUES (?, ?, ?)', 
        [title, description, req.user.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Ticket created', ticketId: this.lastID });
    });
});

// Get My Tickets
router.get('/tickets/my', verifyToken, (req, res) => {
    db.all('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


// --- ADMIN ROUTES ---

// Get All Tickets
router.get('/tickets', verifyToken, verifyAdmin, (req, res) => {
    const sql = `
        SELECT t.*, u.username as creator 
        FROM tickets t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update Ticket (Change Status, Queue or Add Notes)
router.put('/tickets/:id', verifyToken, verifyAdmin, (req, res) => {
    const { status, queue, resolution_notes } = req.body;
    const ticketId = req.params.id;

    const sql = `UPDATE tickets SET status = COALESCE(?, status), queue = COALESCE(?, queue), 
                 resolution_notes = COALESCE(?, resolution_notes), updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;

    db.run(sql, [status, queue, resolution_notes, ticketId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Ticket updated successfully' });
    });
});


// --- REPORTING ROUTE (BI) ---
router.get('/reports/tickets', verifyToken, verifyAdmin, (req, res) => {
    const sql = `
        SELECT t.id, t.title, t.status, t.queue, t.created_at, t.updated_at, u.username as creator 
        FROM tickets t 
        JOIN users u ON t.user_id = u.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); // Returning JSON, can be easily converted to CSV in frontend or directly consumed by BI tools
    });
});

module.exports = router;
