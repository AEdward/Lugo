const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

const router = express.Router();

router.get('/admin/login', (req, res) => {
  if (req.session.adminUserId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null, layout: 'layouts/admin' });
});

router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: (email || '').trim().toLowerCase() } });
    const valid = user && (await bcrypt.compare(password || '', user.passwordHash));

    if (!valid) {
      return res.status(401).render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid email or password.',
        layout: 'layouts/admin',
      });
    }

    req.session.adminUserId = user.id;
    req.session.adminUser = { id: user.id, name: user.name, email: user.email, role: user.role };

    const returnTo = req.session.returnTo || '/admin';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    next(err);
  }
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

module.exports = router;
