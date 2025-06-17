const express = require('express');
const { loginUser, getUserInfo } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginUser);
router.get('/userinfo', verifyToken, getUserInfo);

module.exports = router;
