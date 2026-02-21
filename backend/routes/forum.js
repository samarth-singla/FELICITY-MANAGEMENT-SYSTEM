const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access eventId from parent router
const {
  getForumMessages,
  createForumMessage,
  togglePinMessage,
  deleteForumMessage,
  toggleReaction
} = require('../controllers/forumController');

const { protect } = require('../middleware/auth');

// Public route (but controller checks permissions)
router.route('/')
  .get(getForumMessages)
  .post(protect, createForumMessage);

router.route('/:messageId/pin')
  .put(protect, togglePinMessage);

router.route('/:messageId')
  .delete(protect, deleteForumMessage);

router.route('/:messageId/react')
  .post(protect, toggleReaction);

module.exports = router;
