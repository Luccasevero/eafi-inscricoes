/**
 * Autenticacao basica (HTTP Basic Auth) simples para proteger a area administrativa.
 * Usuario e senha vem das variaveis de ambiente ADMIN_USER e ADMIN_PASS.
 */
function adminAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Area administrativa EAFI"');
    return res.status(401).json({ erro: 'Autenticacao necessaria.' });
  }

  const base64Credentials = header.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [user, pass] = credentials.split(':');

  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin';

  if (user === adminUser && pass === adminPass) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Area administrativa EAFI"');
  return res.status(401).json({ erro: 'Usuario ou senha invalidos.' });
}

module.exports = adminAuth;
