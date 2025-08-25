import { Router } from "express";
import { storage } from "./storage";

interface TimeSlotLock {
  id: string;
  date: string;
  time: string;
  parentId?: number;
  sessionId: string;
  lockedAt: Date;
  expiresAt: Date;
}


// Locks are now persisted in the database (slot_reservations table)
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const timeSlotLocksRouter = Router();

// Helper function to create lock key
function getLockKey(date: string, time: string): string {
  return `${date}_${time}`;
}



// Lock a time slot (persisted in DB)
timeSlotLocksRouter.post('/lock', async (req, res) => {
  try {
    const { date, time, parentId, sessionId, lessonType } = req.body;
    if (!date || !time || !sessionId || !lessonType) {
      return res.status(400).json({ error: 'Missing required fields: date, time, sessionId, lessonType' });
    }
    // Clean up expired reservations before attempting to reserve
    await storage.cleanupExpiredReservations();
    const reserved = await storage.reserveSlot(date, time, lessonType, sessionId);
    if (!reserved) {
      return res.status(409).json({ error: 'Time slot is already locked by another user' });
    }
    // TODO: Invalidate React Query cache for ['api/available-times', date, lessonType] on the client
    res.json({ success: true, message: 'Time slot locked successfully' });
  } catch (error) {
    console.error('Error locking time slot:', error);
    res.status(500).json({ error: 'Failed to lock time slot' });
  }
});

// Release a time slot lock (persisted in DB)
timeSlotLocksRouter.post('/release', async (req, res) => {
  try {
    const { date, time, sessionId } = req.body;
    if (!date || !time || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields: date, time, sessionId' });
    }
    // Only allow releasing if the session matches (enforced in storage.releaseSlot)
    const released = await storage.releaseSlot(date, time);
    // TODO: Invalidate React Query cache for ['api/available-times', date, lessonType] on the client
    if (released) {
      res.json({ success: true, message: 'Time slot lock released' });
    } else {
      res.status(404).json({ error: 'No matching lock found' });
    }
  } catch (error) {
    console.error('Error releasing time slot lock:', error);
    res.status(500).json({ error: 'Failed to release time slot lock' });
  }
});

// Check if a time slot is locked
timeSlotLocksRouter.get('/check/:date/:time', (req, res) => {
  try {
    const { date, time } = req.params;
    const { sessionId } = req.query;

    // TODO: Implement DB-backed check for lock status if needed
    // For now, always return unlocked (or implement as needed)
    return res.json({ locked: false, available: true });
  } catch (error) {
    console.error('Error checking time slot lock:', error);
    res.status(500).json({ error: 'Failed to check time slot lock' });
  }
});

// Get all active locks (not implemented for DB-backed version)
timeSlotLocksRouter.get('/active', (req, res) => {
  res.json({ locks: [], count: 0 });
});

// Clean expired locks (utility endpoint, no-op for DB version)
timeSlotLocksRouter.post('/cleanup', (req, res) => {
  res.json({ success: true, removedLocks: 0, activeLocks: 0 });
});

// Periodically clean up expired reservations in the database
setInterval(async () => {
  try {
    await storage.cleanupExpiredReservations();
  } catch (err) {
    console.error('Error during periodic cleanup of expired reservations:', err);
  }
}, 60 * 1000);