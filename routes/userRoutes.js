const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();
const path = require('path');

// Registration page
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

// Login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Logout route
router.get('/logout', (req, res) => {
    // Optionally clear session or any other logout logic
    res.redirect('/login');
});


// Registration logic
router.post('/register', async (req, res) => {
    const { name, email, password, dob } = req.body;
    const role = 'user'; // Default role is "user"

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (name, email, password, dob, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, dob, role]
        );
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Login logic
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
//         if (rows.length === 0) {
//             return res.status(401).send('User not found');
//         }

//         const user = rows[0];
//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(401).send('Invalid password');
//         }

//         if (user.role === 'admin') {
//             res.redirect('/admin/dashboard');
//         } else {
//             res.redirect('/user/dashboard');
//         }
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

// // User dashboard
// router.get('/user/dashboard', (req, res) => {
//     res.sendFile(path.join(__dirname, '../public/user.html'));
// });


router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).send('User not found');
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send('Invalid password');
        }

        req.session.email = user.email; // Store email in session

        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/user/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
});


// User dashboard
router.get('/user/dashboard', async (req, res) => {
    try {
        const email = req.session.email;
        const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            res.render('user', { name: rows[0].name });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
