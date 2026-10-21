const express = require('express');
const db = require('../config/db');

const router = express.Router();

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    const {
      requester_id,
      assigned_to,
      title,
      description,
      category,
      priority
    } = req.body;

    if (!requester_id || !title || !description || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Requester ID, title, description and category are required'
      });
    }

    const ticketPriority = priority || 'medium';

    const [result] = await db.query(
      `INSERT INTO tickets
       (requester_id, assigned_to, title, description, category, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        requester_id,
        assigned_to || null,
        title,
        description,
        category,
        ticketPriority
      ]
    );

    res.status(201).json({
      status: 'success',
      message: 'Ticket created successfully',
      ticket_id: result.insertId
    });

  } catch (error) {
    console.error('Create ticket error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to create ticket'
    });
  }
});


// Get all tickets
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        t.ticket_id,
        t.requester_id,
        t.assigned_to,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        requester.full_name AS requester_name,
        requester.email AS requester_email,
        support.full_name AS assigned_to_name
       FROM tickets t
       INNER JOIN users requester
         ON t.requester_id = requester.user_id
       LEFT JOIN users support
         ON t.assigned_to = support.user_id
       ORDER BY t.ticket_id DESC`
    );

    res.json({
      status: 'success',
      data: rows
    });

  } catch (error) {
    console.error('Get tickets error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve tickets'
    });
  }
});


// Get a single ticket by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT
        t.ticket_id,
        t.requester_id,
        t.assigned_to,
        t.title,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        requester.full_name AS requester_name,
        requester.email AS requester_email,
        support.full_name AS assigned_to_name
       FROM tickets t
       INNER JOIN users requester
         ON t.requester_id = requester.user_id
       LEFT JOIN users support
         ON t.assigned_to = support.user_id
       WHERE t.ticket_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    res.json({
      status: 'success',
      data: rows[0]
    });

  } catch (error) {
    console.error('Get ticket error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve ticket'
    });
  }
});


// Update a ticket
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      assigned_to,
      title,
      description,
      category,
      priority,
      status
    } = req.body;

    const [existing] = await db.query(
      'SELECT * FROM tickets WHERE ticket_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    const currentTicket = existing[0];

    const updatedAssignedTo =
      assigned_to !== undefined ? assigned_to : currentTicket.assigned_to;

    const updatedTitle =
      title !== undefined ? title : currentTicket.title;

    const updatedDescription =
      description !== undefined ? description : currentTicket.description;

    const updatedCategory =
      category !== undefined ? category : currentTicket.category;

    const updatedPriority =
      priority !== undefined ? priority : currentTicket.priority;

    const updatedStatus =
      status !== undefined ? status : currentTicket.status;

    await db.query(
      `UPDATE tickets
       SET assigned_to = ?,
           title = ?,
           description = ?,
           category = ?,
           priority = ?,
           status = ?
       WHERE ticket_id = ?`,
      [
        updatedAssignedTo,
        updatedTitle,
        updatedDescription,
        updatedCategory,
        updatedPriority,
        updatedStatus,
        id
      ]
    );

    res.json({
      status: 'success',
      message: 'Ticket updated successfully'
    });

  } catch (error) {
    console.error('Update ticket error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to update ticket'
    });
  }
});


// Delete a ticket
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM tickets WHERE ticket_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Delete ticket error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to delete ticket'
    });
  }
});

module.exports = router;