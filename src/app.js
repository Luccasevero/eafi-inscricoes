require('dotenv').config();
const path = require('path');
const express = require('express');

const modalidadeRoutes = require('./routes/modalidade.routes');
const inscricaoRoutes = require('./routes/inscricao.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/modalidades', modalidadeRoutes);
app.use('/api/inscricoes', inscricaoRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

// 404 para rotas de API nao encontradas
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota nao encontrada.' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor EAFI rodando em http://localhost:${PORT}`);
});

module.exports = app;
