const express = require('express');
const router = express.Router();
const inscricaoController = require('../controllers/inscricao.controller');

router.post('/', inscricaoController.criar);
router.get('/consulta', inscricaoController.consultar);

module.exports = router;
