const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminAuth = require('../middleware/adminAuth');

router.use(adminAuth);

router.get('/inscricoes', adminController.listar);
router.get('/inscricoes/export', adminController.exportarCsv);
router.patch('/inscricoes/:id/status', adminController.atualizarStatus);
router.post('/resultado/publicar', adminController.publicarResultado);
router.post('/resultado/despublicar', adminController.despublicarResultado);

module.exports = router;
