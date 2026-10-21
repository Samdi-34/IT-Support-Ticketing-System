const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { full_name, email, role } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name and email are required'
      });
    }

    const userRole = role || 'requester';

    const [result] = await db.query(
      `INSERT INTO users (full_name, email, role)
       VALUES (?, ?, ?)`,
      [full_name, email, userRole]
    );

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      user_id: result.insertId
    });

  } catch (error) {
    console.error('Create user error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, role, created_at
       FROM users
       ORDER BY user_id DESC`
    );

    res.json({
      status: 'success',
      data: rows
    });

  } catch (error) {
    console.error('Get users error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve users'
    });
  }
});


 // Get one user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT user_id, full_name, email, role, created_at
       FROM users
       WHERE user_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: rows[0]
    });

  } catch (error) {
    console.error('Get user error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user'
    });
  }
});


 // Update a user's details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    if (
      full_name === undefined &&
      email === undefined &&
      role === undefined
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Provide at least one field to update'
      });
    }

    const [users] = await db.query(
      'SELECT user_id FROM users WHERE user_id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const fields = [];
    const values = [];

    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Full name cannot be empty'
        });
      }

      fields.push('full_name = ?');
      values.push(full_name.trim());
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Email cannot be empty'
        });
      }

      fields.push('email = ?');
      values.push(email.trim());
    }

    if (role !== undefined) {
      const validRoles = ['requester', 'support', 'admin'];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid role'
        });
      }

      fields.push('role = ?');
      values.push(role);
    }

    values.push(id);

    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    );

    const [updatedUsers] = await db.query(
      `SELECT user_id, full_name, email, role, created_at
       FROM users
       WHERE user_id = ?`,
      [id]
    );

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUsers[0]
    });

  } catch (error) {
    console.error('Update user error:', error.message);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        status: 'error',
        message: 'That email address is already in use'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

module.exports = router;