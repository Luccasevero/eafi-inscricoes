const express = require('express');
const router = express.Router();
const modalidadeController = require('../controllers/modalidade.controller');

router.get('/', modalidadeController.listar);

module.exports = router;
