const router = require('express').Router();
const { logUser, regUser, logout, resetPassword } = require('./login.controller');
const { authN } = require('../../middlewares/authN');

router.post('/signup', regUser);
router.post('/login', logUser);
router.post('/logout', authN, logout);
router.put('/reset-password', authN, resetPassword);

module.exports = router;
