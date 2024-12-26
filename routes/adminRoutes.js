const express = require('express');
const pool = require('../db');
const router = express.Router();
const path = require('path');

// Admin dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, dob, role FROM users');
        const [currentAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', [req.session.email]);
        
        res.render('admin', { 
            users: users,
            currentAdminId: currentAdmin[0].id
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/edit', async (req, res) => {
    const { id, name, email, dob, role } = req.body;
    
    try {
        // First check if the target user is an admin
        const [targetUser] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        
        if (targetUser[0].role === 'admin') {
            // If target is admin, check if the current admin is trying to edit their own data
            const currentAdminEmail = req.session.email;
            const [currentAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', [currentAdminEmail]);
            
            if (currentAdmin[0].id != id) {
                return res.status(403).send('Cannot edit another admin\'s data');
            }
        }

        // Proceed with the update
        await pool.query(
            'UPDATE users SET name = ?, email = ?, dob = ?, role = ? WHERE id = ?',
            [name, email, dob, role, id]
        );

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Edit user error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Delete user
router.post('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
