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
        SELECT t.*, u.username as creator,
               t.started_at, t.responded_at
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

    // SLA: set started_at only if transitioning to em_analise for the first time
    const startedAtSql = (status === 'em_analise')
        ? `, started_at = COALESCE(started_at, CURRENT_TIMESTAMP)`
        : '';

    // SLA: set responded_at only if transitioning to respondido/concluido for the first time
    const respondedAtSql = (status === 'respondido' || status === 'concluido')
        ? `, responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)`
        : '';

    const sql = `UPDATE tickets 
                 SET status = COALESCE(?, status), 
                     queue = COALESCE(?, queue), 
                     resolution_notes = COALESCE(?, resolution_notes), 
                     updated_at = CURRENT_TIMESTAMP
                     ${startedAtSql}
                     ${respondedAtSql}
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
