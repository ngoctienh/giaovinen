const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/teacher/login', authController.login);

module.exports = router;