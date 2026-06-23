const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = (req, res, next) => {
  const received = req.headers['x-passkey'];
  const expected = process.env.DASHBOARD_PASSKEY;
  console.log(`[Passkey] received="${received}" | expected="${expected}" | match=${received === expected}`);
  if (received !== expected) {
    return res.status(401).json({ error: 'Accès refusé. Clé invalide.' });
  }
  next();
};
