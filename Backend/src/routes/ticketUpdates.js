
const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET all updates for a specific ticket
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const [tickets] = await db.query(
      'SELECT ticket_id FROM tickets WHERE ticket_id = ?',
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }

    const [rows] = await db.query(
      `SELECT
         tu.update_id,
         tu.ticket_id,
         tu.updated_by,
         tu.old_status,
         tu.new_status,
         tu.comment,
         tu.created_at,
         u.full_name AS updated_by_name
       FROM ticket_updates tu
       INNER JOIN users u ON tu.updated_by = u.user_id
       WHERE tu.ticket_id = ?
       ORDER BY tu.created_at DESC, tu.update_id DESC`,
      [ticketId]
    );

    res.json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error('Get ticket updates error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve ticket updates'
    });
  }
});

// ADD a comment or record a status change
router.post('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { updated_by, new_status, comment } = req.body;

    if (!updated_by) {
      return res.status(400).json({
        status: 'error',
        message: 'The user making the update is required'
      });
    }

    if (!new_status && !comment) {
      return res.status(400).json({
        status: 'error',
        message: 'Provide a new status, a comment, or both'
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [tickets] = await connection.query(
        'SELECT status FROM tickets WHERE ticket_id = ? FOR UPDATE',
        [ticketId]
      );

      if (tickets.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          status: 'error',
          message: 'Ticket not found'
        });
      }

      const [users] = await connection.query(
        'SELECT user_id FROM users WHERE user_id = ?',
        [updated_by]
      );

      if (users.length === 0) {
        await connection.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'The user making the update does not exist'
        });
      }

      const oldStatus = tickets[0].status;
      const finalStatus = new_status || oldStatus;

      const validStatuses = [
        'open',
        'in_progress',
        'resolved',
        'closed'
      ];

      if (!validStatuses.includes(finalStatus)) {
        await connection.rollback();

        return res.status(400).json({
          status: 'error',
          message: 'Invalid ticket status'
        });
      }

      const [result] = await connection.query(
        `INSERT INTO ticket_updates
         (ticket_id, updated_by, old_status, new_status, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [
          ticketId,
          updated_by,
          new_status ? oldStatus : null,
          new_status || null,
          comment || null
        ]
      );

      if (new_status) {
        await connection.query(
          'UPDATE tickets SET status = ? WHERE ticket_id = ?',
          [new_status, ticketId]
        );
      }

      await connection.commit();

      res.status(201).json({
        status: 'success',
        message: 'Ticket update recorded successfully',
        update_id: result.insertId,
        old_status: new_status ? oldStatus : null,
        new_status: new_status || null
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create ticket update error:', error.message);

    res.status(500).json({
      status: 'error',
      message: 'Failed to record ticket update'
    });
  }
});

module.exports = router;
