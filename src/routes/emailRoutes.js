/**
 * emailRoutes.js
 * Rotas relacionadas a envio de emails
 */

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

/**
 * @route POST /api/email/verification/send
 * @desc Envia um email de verificação com código
 * @access Público
 */
router.post('/verification/send', emailController.sendVerificationEmail);

/**
 * @route POST /api/email/verification/verify
 * @desc Verifica o código enviado por email
 * @access Público
 */
router.post('/verification/verify', emailController.verifyEmailCode);

module.exports = router; 