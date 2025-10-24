const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
  const db = req.app.locals.db;
  const { username, email, password, full_name, phone, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Check if user already exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ error: 'Error hashing password' });
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Insert user
      const insertQuery = `
        INSERT INTO users (
          username, email, password, full_name, phone, role, 
          email_verification_token, email_verification_expires, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      db.run(
        insertQuery,
        [username, email, hashedPassword, full_name, phone, role || 'user', 
         emailVerificationToken, verificationExpires.toISOString()],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error creating user' });
          }

          const userId = this.lastID;

          // Log the registration
          db.run(
            'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
            [userId, 'user_registered', 'user', userId, JSON.stringify({ username, email })]
          );

          res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            user: {
              id: userId,
              username,
              email,
              full_name,
              role: role || 'user'
            },
            emailVerificationToken // In production, send via email instead
          });
        }
      );
    });
  });
});

// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
  const db = req.app.locals.db;
  const { username, password, remember_me } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is not active' });
      }

      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          // Log failed login attempt
          db.run(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
            [user.id, 'login_failed', 'auth', JSON.stringify({ username, ip: req.ip })]
          );

          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Update last login
        db.run(
          'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?',
          [user.id]
        );

        // Store refresh token in database
        db.run(
          'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, datetime(\'now\', \'+30 days\'))',
          [user.id, refreshToken]
        );

        // Log successful login
        db.run(
          'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
          [user.id, 'login_success', 'auth', JSON.stringify({ username, ip: req.ip })]
        );

        res.json({
          success: true,
          message: 'Login successful',
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            avatar: user.avatar
          }
        });
      });
    }
  );
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', (req, res) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  // Verify refresh token
  jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
    if (err || decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists in database
    db.get(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime(\'now\')',
      [refreshToken, decoded.id],
      (err, tokenRow) => {
        if (err || !tokenRow) {
          return res.status(403).json({ error: 'Invalid or expired refresh token' });
        }

        // Get user details
        db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
          if (err || !user || user.status !== 'active') {
            return res.status(403).json({ error: 'User not found or inactive' });
          }

          // Generate new access token
          const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
          );

          res.json({
            success: true,
            accessToken
          });
        });
      }
    );
  });
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { refreshToken } = req.body;

  // Delete refresh token
  if (refreshToken) {
    db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
  }

  // Log logout
  db.run(
    'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
    [req.user.id, 'logout', 'auth', JSON.stringify({ ip: req.ip })]
  );

  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', (req, res) => {
  const db = req.app.locals.db;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.get('SELECT id, email, username FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    db.run(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetTokenHash, resetExpires.toISOString(), user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error generating reset token' });
        }

        // Log password reset request
        db.run(
          'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
          [user.id, 'password_reset_requested', 'auth', JSON.stringify({ email, ip: req.ip })]
        );

        // In production, send email with reset link
        // For now, return the token
        res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
          resetToken // Remove this in production
        });
      }
    );
  });
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', (req, res) => {
  const db = req.app.locals.db;
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Hash the token to compare with database
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  db.get(
    'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > datetime(\'now\')',
    [resetTokenHash],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Error hashing password' });
        }

        // Update password and clear reset token
        db.run(
          'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, password_changed_at = datetime(\'now\') WHERE id = ?',
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating password' });
            }

            // Invalidate all refresh tokens
            db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);

            // Log password reset
            db.run(
              'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
              [user.id, 'password_reset_completed', 'auth', JSON.stringify({ ip: req.ip })]
            );

            res.json({
              success: true,
              message: 'Password reset successfully. Please login with your new password.'
            });
          }
        );
      });
    }
  );
});

// POST /api/auth/change-password - Change password (when logged in)
router.post('/change-password', authenticateToken, (req, res) => {
  const db = req.app.locals.db;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Error hashing password' });
        }

        // Update password
        db.run(
          'UPDATE users SET password = ?, password_changed_at = datetime(\'now\') WHERE id = ?',
          [hashedPassword, req.user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating password' });
            }

            // Log password change
            db.run(
              'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
              [req.user.id, 'password_changed', 'auth', JSON.stringify({ ip: req.ip })]
            );

            res.json({
              success: true,
              message: 'Password changed successfully'
            });
          }
        );
      });
    });
  });
});

// GET /api/auth/verify-email/:token - Verify email address
router.get('/verify-email/:token', (req, res) => {
  const db = req.app.locals.db;
  const { token } = req.params;

  db.get(
    'SELECT * FROM users WHERE email_verification_token = ? AND email_verification_expires > datetime(\'now\')',
    [token],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Mark email as verified
      db.run(
        'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
        [user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error verifying email' });
          }

          // Log email verification
          db.run(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES (?, ?, ?, ?)',
            [user.id, 'email_verified', 'auth', JSON.stringify({ email: user.email })]
          );

          res.json({
            success: true,
            message: 'Email verified successfully. You can now login.'
          });
        }
      );
    }
  );
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const db = req.app.locals.db;

  db.get(
    'SELECT id, username, email, full_name, phone, role, avatar, email_verified, last_login, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user
      });
    }
  );
});

// POST /api/auth/validate-token - Validate if token is still valid
router.post('/validate-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: req.user
  });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
