# Authentication Test Cases

## Overview
Comprehensive test cases for the SalesSync authentication system covering login, logout, registration, password management, and security features.

## Test Environment Setup
- **Test URL**: https://work-1-qbecwaydyafyeqqu.prod-runtime.all-hands.dev
- **Test Data**: Use dedicated test accounts
- **Browser Support**: Chrome, Firefox, Safari, Edge
- **Mobile Testing**: iOS Safari, Android Chrome

## 1. User Login Tests

### TC-AUTH-001: Valid Login
**Objective**: Verify successful login with valid credentials
**Priority**: High
**Prerequisites**: Valid user account exists

**Test Steps**:
1. Navigate to login page
2. Enter valid email: `test@salessync.com`
3. Enter valid password: `TestPass123!`
4. Click "Sign In" button
5. Verify redirect to dashboard

**Expected Results**:
- User successfully logged in
- Redirected to `/dashboard`
- User session established
- Navigation menu shows user profile

**Test Data**:
```json
{
  "email": "test@salessync.com",
  "password": "TestPass123!",
  "role": "field_agent"
}
```

### TC-AUTH-002: Invalid Email Format
**Objective**: Verify error handling for invalid email format
**Priority**: Medium

**Test Steps**:
1. Navigate to login page
2. Enter invalid email: `invalid-email`
3. Enter valid password: `TestPass123!`
4. Click "Sign In" button

**Expected Results**:
- Error message: "Please enter a valid email address"
- Login form remains visible
- No redirect occurs

### TC-AUTH-003: Wrong Password
**Objective**: Verify error handling for incorrect password
**Priority**: High

**Test Steps**:
1. Navigate to login page
2. Enter valid email: `test@salessync.com`
3. Enter wrong password: `WrongPassword123`
4. Click "Sign In" button

**Expected Results**:
- Error message: "Invalid email or password"
- Login form remains visible
- Account not locked after single attempt

### TC-AUTH-004: Empty Fields Validation
**Objective**: Verify validation for empty required fields
**Priority**: Medium

**Test Steps**:
1. Navigate to login page
2. Leave email field empty
3. Leave password field empty
4. Click "Sign In" button

**Expected Results**:
- Email field shows: "Email is required"
- Password field shows: "Password is required"
- Form submission prevented

### TC-AUTH-005: Password Visibility Toggle
**Objective**: Verify password show/hide functionality
**Priority**: Low

**Test Steps**:
1. Navigate to login page
2. Enter password in password field
3. Click eye icon to show password
4. Click eye icon again to hide password

**Expected Results**:
- Password initially hidden (dots/asterisks)
- Password visible as plain text when eye icon clicked
- Password hidden again when eye icon clicked second time

## 2. User Logout Tests

### TC-AUTH-006: Standard Logout
**Objective**: Verify successful logout functionality
**Priority**: High
**Prerequisites**: User is logged in

**Test Steps**:
1. Navigate to any authenticated page
2. Click user profile menu
3. Click "Logout" option
4. Confirm logout if prompted

**Expected Results**:
- User session terminated
- Redirected to login page
- All authentication tokens cleared
- Cannot access protected routes

### TC-AUTH-007: Session Timeout
**Objective**: Verify automatic logout after session timeout
**Priority**: High

**Test Steps**:
1. Login successfully
2. Wait for session timeout (30 minutes)
3. Attempt to perform any action

**Expected Results**:
- Session automatically expired
- Redirected to login page
- Message: "Your session has expired. Please login again."

## 3. Password Management Tests

### TC-AUTH-008: Forgot Password Request
**Objective**: Verify password reset request functionality
**Priority**: High

**Test Steps**:
1. Navigate to login page
2. Click "Forgot Password?" link
3. Enter valid email: `test@salessync.com`
4. Click "Send Reset Link" button

**Expected Results**:
- Success message: "Password reset link sent to your email"
- Email received with reset link
- Reset link expires after 1 hour

### TC-AUTH-009: Password Reset with Valid Token
**Objective**: Verify password reset with valid token
**Priority**: High
**Prerequisites**: Valid reset token received

**Test Steps**:
1. Click reset link from email
2. Enter new password: `NewPass123!`
3. Confirm new password: `NewPass123!`
4. Click "Reset Password" button

**Expected Results**:
- Password successfully updated
- Success message displayed
- Redirected to login page
- Can login with new password

### TC-AUTH-010: Password Reset with Expired Token
**Objective**: Verify error handling for expired reset token
**Priority**: Medium

**Test Steps**:
1. Use expired reset link (>1 hour old)
2. Enter new password
3. Click "Reset Password" button

**Expected Results**:
- Error message: "Reset link has expired"
- Redirected to forgot password page
- Password not changed

## 4. Role-Based Access Tests

### TC-AUTH-011: Admin Role Access
**Objective**: Verify admin user can access admin features
**Priority**: High
**Prerequisites**: Admin user account

**Test Steps**:
1. Login with admin credentials
2. Navigate to admin panel
3. Verify access to user management
4. Verify access to system settings

**Expected Results**:
- Admin panel accessible
- All admin features visible
- User management functions available
- System settings accessible

**Test Data**:
```json
{
  "email": "admin@salessync.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

### TC-AUTH-012: Field Agent Role Restrictions
**Objective**: Verify field agent cannot access admin features
**Priority**: High
**Prerequisites**: Field agent user account

**Test Steps**:
1. Login with field agent credentials
2. Attempt to navigate to admin panel
3. Verify restricted access

**Expected Results**:
- Admin panel not accessible
- 403 Forbidden error or redirect
- Only field agent features visible

### TC-AUTH-013: Manager Role Access
**Objective**: Verify manager user has appropriate access
**Priority**: High
**Prerequisites**: Manager user account

**Test Steps**:
1. Login with manager credentials
2. Verify access to team management
3. Verify access to reports
4. Verify restricted admin access

**Expected Results**:
- Team management accessible
- Reports and analytics available
- Limited admin features
- Cannot access system settings

## 5. Security Tests

### TC-AUTH-014: SQL Injection Prevention
**Objective**: Verify protection against SQL injection attacks
**Priority**: High

**Test Steps**:
1. Navigate to login page
2. Enter SQL injection payload in email: `'; DROP TABLE users; --`
3. Enter any password
4. Click "Sign In" button

**Expected Results**:
- Login fails safely
- No database errors
- Application remains stable
- Security event logged

### TC-AUTH-015: XSS Prevention
**Objective**: Verify protection against XSS attacks
**Priority**: High

**Test Steps**:
1. Navigate to login page
2. Enter XSS payload in email: `<script>alert('XSS')</script>`
3. Enter any password
4. Click "Sign In" button

**Expected Results**:
- Script not executed
- Input properly sanitized
- No alert popup appears
- Login fails gracefully

### TC-AUTH-016: Brute Force Protection
**Objective**: Verify account lockout after multiple failed attempts
**Priority**: High

**Test Steps**:
1. Navigate to login page
2. Enter valid email: `test@salessync.com`
3. Enter wrong password 5 times consecutively
4. Attempt 6th login with correct password

**Expected Results**:
- Account locked after 5 failed attempts
- Error message: "Account temporarily locked due to multiple failed attempts"
- Cannot login even with correct password
- Account unlocked after 15 minutes

### TC-AUTH-017: CSRF Protection
**Objective**: Verify protection against CSRF attacks
**Priority**: Medium

**Test Steps**:
1. Login successfully
2. Open browser developer tools
3. Attempt to make API calls without CSRF token
4. Verify request rejection

**Expected Results**:
- Requests without valid CSRF token rejected
- 403 Forbidden response
- Session remains secure

## 6. Multi-Factor Authentication Tests

### TC-AUTH-018: MFA Setup
**Objective**: Verify MFA setup process
**Priority**: Medium
**Prerequisites**: MFA enabled for account

**Test Steps**:
1. Login with valid credentials
2. Navigate to security settings
3. Enable MFA
4. Scan QR code with authenticator app
5. Enter verification code

**Expected Results**:
- QR code displayed correctly
- Authenticator app successfully configured
- Verification code accepted
- MFA enabled for account

### TC-AUTH-019: MFA Login
**Objective**: Verify login with MFA enabled
**Priority**: Medium
**Prerequisites**: MFA enabled for account

**Test Steps**:
1. Navigate to login page
2. Enter valid email and password
3. Enter MFA code from authenticator app
4. Click "Verify" button

**Expected Results**:
- MFA prompt displayed after password verification
- Valid MFA code accepted
- Successfully logged in
- Invalid MFA code rejected

## 7. Mobile Authentication Tests

### TC-AUTH-020: Mobile Login
**Objective**: Verify login functionality on mobile devices
**Priority**: High
**Device**: iOS/Android

**Test Steps**:
1. Open browser on mobile device
2. Navigate to login page
3. Enter credentials using mobile keyboard
4. Verify responsive design
5. Complete login process

**Expected Results**:
- Login form properly displayed on mobile
- Keyboard input works correctly
- Touch interactions responsive
- Successful login and navigation

### TC-AUTH-021: Mobile Password Reset
**Objective**: Verify password reset on mobile devices
**Priority**: Medium

**Test Steps**:
1. Navigate to forgot password on mobile
2. Enter email address
3. Check email on mobile device
4. Click reset link from mobile email
5. Complete password reset

**Expected Results**:
- Mobile-optimized forgot password form
- Email link opens correctly in mobile browser
- Password reset form responsive
- Process completes successfully

## 8. Performance Tests

### TC-AUTH-022: Login Performance
**Objective**: Verify login response time meets requirements
**Priority**: Medium

**Test Steps**:
1. Navigate to login page
2. Measure page load time
3. Enter credentials and submit
4. Measure authentication response time
5. Measure dashboard load time

**Expected Results**:
- Login page loads within 2 seconds
- Authentication completes within 1 second
- Dashboard loads within 3 seconds
- Total login process under 6 seconds

### TC-AUTH-023: Concurrent Login Load
**Objective**: Verify system handles multiple concurrent logins
**Priority**: Medium

**Test Steps**:
1. Simulate 100 concurrent login attempts
2. Monitor system performance
3. Verify all successful logins
4. Check for any errors or timeouts

**Expected Results**:
- All valid logins successful
- Response times remain acceptable
- No system errors or crashes
- Database connections properly managed

## Test Data Management

### Test Accounts
```json
{
  "admin": {
    "email": "admin@salessync.com",
    "password": "AdminPass123!",
    "role": "admin"
  },
  "manager": {
    "email": "manager@salessync.com",
    "password": "ManagerPass123!",
    "role": "manager"
  },
  "field_agent": {
    "email": "agent@salessync.com",
    "password": "AgentPass123!",
    "role": "field_agent"
  },
  "locked_account": {
    "email": "locked@salessync.com",
    "password": "LockedPass123!",
    "status": "locked"
  }
}
```

### Test Environment Reset
- Reset test data before each test run
- Clear browser cache and cookies
- Ensure clean session state
- Verify test account status

## Automation Notes
- All test cases suitable for automation
- Use Playwright for E2E testing
- Implement data-testid attributes
- Create reusable authentication helpers
- Set up CI/CD integration for automated testing