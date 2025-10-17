# SalesSync Security Policy

## Document Information

**Document Title:** SalesSync Security Policy  
**Version:** 2.0  
**Date:** January 2024  
**Author:** Security Team  
**Approved By:** Chief Information Security Officer  

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Governance](#security-governance)
3. [Information Security Framework](#information-security-framework)
4. [Access Control Policy](#access-control-policy)
5. [Data Protection Policy](#data-protection-policy)
6. [Application Security](#application-security)
7. [Infrastructure Security](#infrastructure-security)
8. [Network Security](#network-security)
9. [Incident Response](#incident-response)
10. [Security Monitoring](#security-monitoring)
11. [Compliance Requirements](#compliance-requirements)
12. [Security Training](#security-training)

## Executive Summary

This Security Policy establishes the security framework, standards, and procedures for the SalesSync AI-powered field force management system. The policy ensures the confidentiality, integrity, and availability of all system components, data, and user interactions while maintaining compliance with relevant regulations and industry standards.

### Security Objectives

1. **Confidentiality**: Protect sensitive data from unauthorized access
2. **Integrity**: Ensure data accuracy and prevent unauthorized modifications
3. **Availability**: Maintain system availability and business continuity
4. **Compliance**: Meet regulatory and industry security requirements
5. **Risk Management**: Identify, assess, and mitigate security risks

## Security Governance

### Security Organization

#### Security Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| **CISO** | Overall security strategy and governance |
| **Security Architect** | Security design and architecture review |
| **Security Engineer** | Implementation and maintenance of security controls |
| **Security Analyst** | Monitoring, incident response, and threat analysis |
| **Data Protection Officer** | Privacy compliance and data protection |
| **Development Team** | Secure coding practices and security testing |
| **Operations Team** | Infrastructure security and monitoring |

#### Security Committee

- **Chair**: Chief Information Security Officer
- **Members**: Security Architect, Development Lead, Operations Manager, Legal Counsel
- **Meeting Frequency**: Monthly
- **Responsibilities**: Security policy review, risk assessment, incident review

### Security Policies and Standards

#### Policy Hierarchy

1. **Security Policy** (This document)
2. **Security Standards** (Technical implementation requirements)
3. **Security Procedures** (Step-by-step implementation guides)
4. **Security Guidelines** (Best practice recommendations)

#### Policy Review and Updates

- **Review Frequency**: Annually or after significant changes
- **Approval Process**: Security Committee review and CISO approval
- **Communication**: All stakeholders notified of policy changes
- **Training**: Updated training provided for policy changes

## Information Security Framework

### Security Framework Adoption

The SalesSync system adopts the **NIST Cybersecurity Framework** as the primary security framework, supplemented by:

- **ISO 27001** for information security management
- **OWASP** for application security
- **CIS Controls** for infrastructure security
- **GDPR** for data protection

### Security Controls Framework

#### Identify (ID)

```yaml
Asset Management:
  - Hardware inventory management
  - Software inventory management
  - Data classification and handling
  - Business environment understanding

Risk Assessment:
  - Risk identification and analysis
  - Threat intelligence integration
  - Vulnerability assessment
  - Risk register maintenance

Governance:
  - Security policies and procedures
  - Risk management strategy
  - Legal and regulatory requirements
  - Supply chain risk management
```

#### Protect (PR)

```yaml
Access Control:
  - Identity and access management
  - Multi-factor authentication
  - Privileged access management
  - Account lifecycle management

Awareness and Training:
  - Security awareness program
  - Role-based training
  - Phishing simulation
  - Security culture development

Data Security:
  - Data encryption at rest and in transit
  - Data loss prevention
  - Data backup and recovery
  - Secure data disposal

Information Protection:
  - Configuration management
  - Secure development lifecycle
  - Maintenance and patching
  - Remote access security

Protective Technology:
  - Endpoint protection
  - Network security
  - Application security
  - Infrastructure hardening
```

#### Detect (DE)

```yaml
Anomalies and Events:
  - Security monitoring
  - Event correlation and analysis
  - Behavioral analytics
  - Threat hunting

Security Continuous Monitoring:
  - Network monitoring
  - System monitoring
  - Application monitoring
  - User activity monitoring

Detection Processes:
  - Incident detection procedures
  - Alert triage and escalation
  - Threat intelligence integration
  - Detection tool management
```

#### Respond (RS)

```yaml
Response Planning:
  - Incident response plan
  - Response team roles
  - Communication procedures
  - Recovery procedures

Communications:
  - Internal communication
  - External communication
  - Stakeholder notification
  - Media relations

Analysis:
  - Incident analysis
  - Forensic investigation
  - Impact assessment
  - Lessons learned

Mitigation:
  - Containment procedures
  - Eradication procedures
  - System recovery
  - Vulnerability remediation

Improvements:
  - Response plan updates
  - Training improvements
  - Process optimization
  - Technology enhancements
```

#### Recover (RC)

```yaml
Recovery Planning:
  - Business continuity plan
  - Disaster recovery plan
  - System recovery procedures
  - Data recovery procedures

Improvements:
  - Recovery plan testing
  - Plan updates and improvements
  - Lessons learned integration
  - Recovery capability enhancement

Communications:
  - Recovery status communication
  - Stakeholder updates
  - Public relations
  - Regulatory reporting
```

## Access Control Policy

### Identity and Access Management (IAM)

#### User Account Management

```typescript
// User account lifecycle
interface UserAccount {
  id: string
  username: string
  email: string
  status: 'active' | 'inactive' | 'suspended' | 'locked'
  roles: Role[]
  permissions: Permission[]
  lastLogin: Date
  passwordLastChanged: Date
  mfaEnabled: boolean
  accountCreated: Date
  accountExpiry?: Date
}

// Account provisioning process
class AccountProvisioningService {
  async createAccount(request: AccountRequest): Promise<UserAccount> {
    // Validate request
    await this.validateAccountRequest(request)
    
    // Create account with minimal privileges
    const account = await this.userService.createUser({
      username: request.username,
      email: request.email,
      status: 'inactive', // Requires activation
      roles: [], // No roles initially
      mfaEnabled: false
    })
    
    // Send activation email
    await this.notificationService.sendActivationEmail(account)
    
    // Log account creation
    await this.auditService.logEvent({
      action: 'account_created',
      userId: account.id,
      details: { requestedBy: request.requestedBy }
    })
    
    return account
  }
  
  async activateAccount(userId: string, activationToken: string): Promise<void> {
    // Validate activation token
    const isValid = await this.tokenService.validateActivationToken(userId, activationToken)
    if (!isValid) {
      throw new Error('Invalid activation token')
    }
    
    // Activate account
    await this.userService.updateUser(userId, { status: 'active' })
    
    // Require password setup
    await this.passwordService.requirePasswordSetup(userId)
    
    // Log activation
    await this.auditService.logEvent({
      action: 'account_activated',
      userId
    })
  }
}
```

#### Role-Based Access Control (RBAC)

```typescript
// Role definition
interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystemRole: boolean
  createdAt: Date
  updatedAt: Date
}

// Permission definition
interface Permission {
  id: string
  module: string
  resource: string
  action: string
  conditions?: AccessCondition[]
}

// Access condition
interface AccessCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

// Predefined roles
const SYSTEM_ROLES: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access',
    permissions: [{ module: '*', resource: '*', action: '*' }],
    isSystemRole: true
  },
  {
    id: 'field_agent',
    name: 'Field Agent',
    description: 'Field operations access',
    permissions: [
      { module: 'visits', resource: 'own', action: 'read' },
      { module: 'visits', resource: 'own', action: 'create' },
      { module: 'visits', resource: 'own', action: 'update' },
      { module: 'customers', resource: 'assigned', action: 'read' },
      { module: 'products', resource: '*', action: 'read' }
    ],
    isSystemRole: true
  },
  {
    id: 'sales_manager',
    name: 'Sales Manager',
    description: 'Sales team management',
    permissions: [
      { module: 'agents', resource: 'team', action: 'read' },
      { module: 'visits', resource: 'team', action: 'read' },
      { module: 'reports', resource: 'team', action: 'read' },
      { module: 'customers', resource: 'territory', action: 'read' }
    ],
    isSystemRole: true
  }
]
```

#### Multi-Factor Authentication (MFA)

```typescript
// MFA implementation
class MFAService {
  async enableMFA(userId: string, method: MFAMethod): Promise<MFASetup> {
    const user = await this.userService.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    let setup: MFASetup
    
    switch (method) {
      case 'totp':
        setup = await this.setupTOTP(userId)
        break
      case 'sms':
        setup = await this.setupSMS(userId, user.phone)
        break
      case 'email':
        setup = await this.setupEmail(userId, user.email)
        break
      default:
        throw new Error('Unsupported MFA method')
    }
    
    // Store MFA configuration
    await this.mfaRepository.saveMFAConfig(userId, {
      method,
      secret: setup.secret,
      backupCodes: setup.backupCodes,
      enabled: false // Requires verification
    })
    
    return setup
  }
  
  async verifyMFA(userId: string, code: string): Promise<boolean> {
    const mfaConfig = await this.mfaRepository.getMFAConfig(userId)
    if (!mfaConfig) {
      return false
    }
    
    let isValid = false
    
    switch (mfaConfig.method) {
      case 'totp':
        isValid = this.verifyTOTP(mfaConfig.secret, code)
        break
      case 'sms':
      case 'email':
        isValid = await this.verifyOTP(userId, code)
        break
    }
    
    if (isValid) {
      // Update last used timestamp
      await this.mfaRepository.updateLastUsed(userId)
      
      // Log successful MFA
      await this.auditService.logEvent({
        action: 'mfa_verified',
        userId,
        details: { method: mfaConfig.method }
      })
    } else {
      // Log failed MFA attempt
      await this.auditService.logEvent({
        action: 'mfa_failed',
        userId,
        details: { method: mfaConfig.method }
      })
    }
    
    return isValid
  }
}
```

### Privileged Access Management (PAM)

#### Administrative Access Controls

```typescript
// Privileged session management
class PrivilegedSessionService {
  async requestPrivilegedAccess(
    userId: string,
    targetSystem: string,
    justification: string,
    duration: number
  ): Promise<PrivilegedSession> {
    // Validate user eligibility
    const user = await this.userService.getUser(userId)
    if (!this.isEligibleForPrivilegedAccess(user)) {
      throw new Error('User not eligible for privileged access')
    }
    
    // Create access request
    const request = await this.accessRequestService.createRequest({
      userId,
      targetSystem,
      justification,
      requestedDuration: duration,
      status: 'pending'
    })
    
    // Auto-approve for emergency access or require approval
    if (this.isEmergencyAccess(justification)) {
      await this.approveRequest(request.id, 'system', 'Emergency access')
    } else {
      await this.notificationService.notifyApprovers(request)
    }
    
    return request
  }
  
  async establishPrivilegedSession(requestId: string): Promise<SessionCredentials> {
    const request = await this.accessRequestService.getRequest(requestId)
    if (request.status !== 'approved') {
      throw new Error('Access request not approved')
    }
    
    // Generate temporary credentials
    const credentials = await this.credentialService.generateTemporaryCredentials({
      targetSystem: request.targetSystem,
      duration: request.approvedDuration,
      permissions: request.approvedPermissions
    })
    
    // Start session monitoring
    await this.sessionMonitoringService.startMonitoring({
      sessionId: credentials.sessionId,
      userId: request.userId,
      targetSystem: request.targetSystem
    })
    
    // Log session establishment
    await this.auditService.logEvent({
      action: 'privileged_session_started',
      userId: request.userId,
      details: {
        targetSystem: request.targetSystem,
        sessionId: credentials.sessionId
      }
    })
    
    return credentials
  }
}
```

## Data Protection Policy

### Data Classification

#### Classification Levels

| Level | Description | Examples | Protection Requirements |
|-------|-------------|----------|------------------------|
| **Public** | Information intended for public disclosure | Marketing materials, public documentation | Standard protection |
| **Internal** | Information for internal use only | Internal procedures, employee directory | Access control, encryption in transit |
| **Confidential** | Sensitive business information | Customer data, financial records | Strong access control, encryption at rest and in transit |
| **Restricted** | Highly sensitive information | Payment data, personal health information | Strict access control, strong encryption, audit logging |

#### Data Handling Requirements

```typescript
// Data classification service
class DataClassificationService {
  classifyData(data: any, context: DataContext): DataClassification {
    const classification: DataClassification = {
      level: 'internal',
      categories: [],
      retentionPeriod: '7 years',
      handlingRequirements: []
    }
    
    // Check for PII
    if (this.containsPII(data)) {
      classification.categories.push('PII')
      classification.level = 'confidential'
      classification.handlingRequirements.push('encryption_required')
      classification.handlingRequirements.push('access_logging_required')
    }
    
    // Check for payment data
    if (this.containsPaymentData(data)) {
      classification.categories.push('payment_data')
      classification.level = 'restricted'
      classification.handlingRequirements.push('pci_compliance_required')
      classification.handlingRequirements.push('tokenization_required')
    }
    
    // Check for financial data
    if (this.containsFinancialData(data)) {
      classification.categories.push('financial_data')
      classification.level = 'confidential'
      classification.retentionPeriod = '10 years'
    }
    
    return classification
  }
  
  private containsPII(data: any): boolean {
    const piiFields = ['email', 'phone', 'ssn', 'address', 'date_of_birth']
    return piiFields.some(field => data.hasOwnProperty(field))
  }
  
  private containsPaymentData(data: any): boolean {
    const paymentFields = ['credit_card', 'bank_account', 'payment_method']
    return paymentFields.some(field => data.hasOwnProperty(field))
  }
}
```

### Data Encryption

#### Encryption Standards

```typescript
// Encryption service
class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm'
  private readonly KEY_LENGTH = 32
  private readonly IV_LENGTH = 16
  private readonly TAG_LENGTH = 16
  
  async encryptData(data: string, keyId: string): Promise<EncryptedData> {
    const key = await this.keyManagementService.getKey(keyId)
    const iv = crypto.randomBytes(this.IV_LENGTH)
    
    const cipher = crypto.createCipher(this.ALGORITHM, key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyId,
      algorithm: this.ALGORITHM
    }
  }
  
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    const key = await this.keyManagementService.getKey(encryptedData.keyId)
    const iv = Buffer.from(encryptedData.iv, 'hex')
    const authTag = Buffer.from(encryptedData.authTag, 'hex')
    
    const decipher = crypto.createDecipher(this.ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Key management service
class KeyManagementService {
  async generateKey(keyId: string, purpose: KeyPurpose): Promise<CryptoKey> {
    const key = crypto.randomBytes(32)
    
    const keyMetadata: KeyMetadata = {
      id: keyId,
      purpose,
      algorithm: 'AES-256',
      createdAt: new Date(),
      status: 'active',
      rotationSchedule: this.getRotationSchedule(purpose)
    }
    
    // Store key in HSM or secure key store
    await this.keyStore.storeKey(keyId, key, keyMetadata)
    
    // Schedule key rotation
    await this.scheduleKeyRotation(keyId, keyMetadata.rotationSchedule)
    
    return key
  }
  
  async rotateKey(keyId: string): Promise<void> {
    const currentKey = await this.keyStore.getKey(keyId)
    const newKey = crypto.randomBytes(32)
    
    // Create new key version
    await this.keyStore.createKeyVersion(keyId, newKey)
    
    // Update key metadata
    await this.keyStore.updateKeyMetadata(keyId, {
      rotatedAt: new Date(),
      previousVersion: currentKey.version
    })
    
    // Schedule old key deprecation
    await this.scheduleKeyDeprecation(keyId, currentKey.version)
  }
}
```

### Data Loss Prevention (DLP)

```typescript
// DLP service
class DLPService {
  private rules: DLPRule[] = [
    {
      id: 'credit_card_detection',
      name: 'Credit Card Number Detection',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      action: 'block',
      severity: 'high'
    },
    {
      id: 'email_detection',
      name: 'Email Address Detection',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      action: 'alert',
      severity: 'medium'
    },
    {
      id: 'phone_detection',
      name: 'Phone Number Detection',
      pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      action: 'alert',
      severity: 'medium'
    }
  ]
  
  async scanContent(content: string, context: ScanContext): Promise<DLPResult> {
    const violations: DLPViolation[] = []
    
    for (const rule of this.rules) {
      const matches = content.match(rule.pattern)
      if (matches) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          matches: matches.length,
          severity: rule.severity,
          action: rule.action,
          matchedContent: matches
        })
      }
    }
    
    const result: DLPResult = {
      scanId: generateUUID(),
      timestamp: new Date(),
      context,
      violations,
      action: this.determineAction(violations),
      riskScore: this.calculateRiskScore(violations)
    }
    
    // Log DLP scan
    await this.auditService.logEvent({
      action: 'dlp_scan',
      details: {
        scanId: result.scanId,
        violationCount: violations.length,
        riskScore: result.riskScore
      }
    })
    
    // Take action based on violations
    if (result.action === 'block') {
      throw new DLPViolationError('Content blocked due to DLP policy violation', result)
    }
    
    return result
  }
}
```

## Application Security

### Secure Development Lifecycle (SDLC)

#### Security Requirements Phase

```typescript
// Security requirements definition
interface SecurityRequirement {
  id: string
  category: 'authentication' | 'authorization' | 'data_protection' | 'input_validation' | 'logging'
  requirement: string
  priority: 'high' | 'medium' | 'low'
  testCriteria: string[]
  implementation: string
}

const SECURITY_REQUIREMENTS: SecurityRequirement[] = [
  {
    id: 'AUTH-001',
    category: 'authentication',
    requirement: 'System must implement multi-factor authentication for all user accounts',
    priority: 'high',
    testCriteria: [
      'MFA is required for all user logins',
      'Multiple MFA methods are supported (TOTP, SMS, Email)',
      'MFA bypass is not possible without proper authorization'
    ],
    implementation: 'MFAService with TOTP, SMS, and Email support'
  },
  {
    id: 'AUTHZ-001',
    category: 'authorization',
    requirement: 'System must implement role-based access control with principle of least privilege',
    priority: 'high',
    testCriteria: [
      'Users are assigned minimum required permissions',
      'Role inheritance is properly implemented',
      'Permission checks are enforced at all access points'
    ],
    implementation: 'RBAC system with granular permissions'
  }
]
```

#### Secure Coding Standards

```typescript
// Input validation
class InputValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }
  
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
  }
  
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim()
      .substring(0, 1000) // Limit length
  }
  
  static validateSQLInput(input: string): boolean {
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'EXEC']
    const upperInput = input.toUpperCase()
    return !sqlKeywords.some(keyword => upperInput.includes(keyword))
  }
}

// SQL injection prevention
class SecureRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    // Use parameterized queries
    const query = 'SELECT * FROM users WHERE email = $1 AND status = $2'
    const params = [email, 'active']
    
    const result = await this.database.query(query, params)
    return result.rows[0] || null
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    // Validate and sanitize input
    if (!InputValidator.validateSQLInput(searchTerm)) {
      throw new Error('Invalid search term')
    }
    
    const sanitizedTerm = InputValidator.sanitizeInput(searchTerm)
    
    // Use parameterized query with LIKE
    const query = `
      SELECT * FROM users 
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
      AND status = $2
      LIMIT 100
    `
    const params = [`%${sanitizedTerm}%`, 'active']
    
    const result = await this.database.query(query, params)
    return result.rows
  }
}
```

#### Security Testing

```typescript
// Security test suite
describe('Security Tests', () => {
  describe('Authentication', () => {
    test('should reject weak passwords', async () => {
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc123']
      
      for (const password of weakPasswords) {
        await expect(
          authService.createUser({ email: 'test@example.com', password })
        ).rejects.toThrow('Password does not meet complexity requirements')
      }
    })
    
    test('should enforce account lockout after failed attempts', async () => {
      const email = 'test@example.com'
      const wrongPassword = 'wrongpassword'
      
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await expect(
          authService.login(email, wrongPassword)
        ).rejects.toThrow('Invalid credentials')
      }
      
      // 6th attempt should result in account lockout
      await expect(
        authService.login(email, wrongPassword)
      ).rejects.toThrow('Account locked due to too many failed attempts')
    })
  })
  
  describe('Authorization', () => {
    test('should prevent privilege escalation', async () => {
      const regularUser = await createTestUser('regular_user')
      const adminEndpoint = '/api/admin/users'
      
      const response = await request(app)
        .get(adminEndpoint)
        .set('Authorization', `Bearer ${regularUser.token}`)
        .expect(403)
      
      expect(response.body.error).toBe('Insufficient privileges')
    })
    
    test('should enforce resource-level permissions', async () => {
      const user1 = await createTestUser('user1')
      const user2 = await createTestUser('user2')
      
      // User1 creates a resource
      const resource = await createTestResource(user1.id)
      
      // User2 should not be able to access user1's resource
      const response = await request(app)
        .get(`/api/resources/${resource.id}`)
        .set('Authorization', `Bearer ${user2.token}`)
        .expect(403)
    })
  })
  
  describe('Input Validation', () => {
    test('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --"
      
      await expect(
        userService.searchUsers(maliciousInput)
      ).rejects.toThrow('Invalid search term')
    })
    
    test('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      const response = await request(app)
        .post('/api/users')
        .send({ name: xssPayload, email: 'test@example.com' })
        .expect(400)
      
      expect(response.body.error).toContain('Invalid input')
    })
  })
})
```

### API Security

#### API Authentication and Authorization

```typescript
// JWT middleware
class JWTMiddleware {
  static authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Missing or invalid authorization header' })
        }
        
        const token = authHeader.substring(7)
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
        
        // Check token expiration
        if (payload.exp < Math.floor(Date.now() / 1000)) {
          return res.status(401).json({ error: 'Token expired' })
        }
        
        // Check if token is blacklisted
        const isBlacklisted = await tokenBlacklistService.isBlacklisted(payload.jti)
        if (isBlacklisted) {
          return res.status(401).json({ error: 'Token revoked' })
        }
        
        // Attach user to request
        req.user = await userService.getUser(payload.sub)
        req.token = payload
        
        next()
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }
  }
  
  static authorize(requiredPermissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }
      
      const userPermissions = await authorizationService.getUserPermissions(req.user.id)
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      )
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient privileges' })
      }
      
      next()
    }
  }
}

// Rate limiting
class RateLimitMiddleware {
  static createRateLimit(options: RateLimitOptions) {
    const store = new Map<string, RateLimitEntry>()
    
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req, options.keyGenerator)
      const now = Date.now()
      
      let entry = store.get(key)
      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + options.windowMs
        }
        store.set(key, entry)
      }
      
      // Reset counter if window has passed
      if (now > entry.resetTime) {
        entry.count = 0
        entry.resetTime = now + options.windowMs
      }
      
      entry.count++
      
      if (entry.count > options.max) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        })
      }
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', options.max)
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - entry.count))
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000))
      
      next()
    }
  }
}
```

#### API Input Validation

```typescript
// Request validation middleware
class ValidationMiddleware {
  static validateRequest(schema: ValidationSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      })
      
      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        })
      }
      
      req.body = value
      next()
    }
  }
}

// Validation schemas
const userCreateSchema = Joi.object({
  email: Joi.string().email().required().max(254),
  password: Joi.string().min(8).max(128).pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  ).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  roles: Joi.array().items(Joi.string().valid(...VALID_ROLES)).optional()
})

const transactionCreateSchema = Joi.object({
  type: Joi.string().valid('forward', 'reverse').required(),
  module: Joi.string().valid('field_agents', 'customers', 'orders', 'products').required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().length(3).uppercase().required(),
  description: Joi.string().min(1).max(500).required(),
  metadata: Joi.object().optional()
})
```

## Infrastructure Security

### Server Hardening

#### Operating System Security

```bash
#!/bin/bash
# Server hardening script

# Update system packages
apt update && apt upgrade -y

# Install security updates automatically
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups
systemctl disable avahi-daemon

# Configure SSH security
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config

# Restart SSH service
systemctl restart sshd

# Install and configure fail2ban
apt install -y fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure log rotation
cat > /etc/logrotate.d/salessync << EOF
/var/log/salessync/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 salessync salessync
    postrotate
        systemctl reload salessync
    endscript
}
EOF

# Set up intrusion detection
apt install -y aide
aideinit
mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Create daily AIDE check
cat > /etc/cron.daily/aide << EOF
#!/bin/bash
/usr/bin/aide --check | /usr/bin/mail -s "AIDE Report" admin@company.com
EOF
chmod +x /etc/cron.daily/aide

echo "Server hardening completed"
```

#### Container Security

```dockerfile
# Secure Dockerfile
FROM node:18-alpine AS builder

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S salessync -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=salessync:nodejs . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S salessync -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=salessync:nodejs /app/dist ./dist
COPY --from=builder --chown=salessync:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=salessync:nodejs /app/package.json ./package.json

# Remove unnecessary packages
RUN apk del --purge

# Switch to non-root user
USER salessync

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
```

### Network Security

#### Network Segmentation

```yaml
# Kubernetes Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: salessync-network-policy
  namespace: salessync
spec:
  podSelector:
    matchLabels:
      app: salessync-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: salessync
    - podSelector:
        matchLabels:
          app: salessync-frontend
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: cache
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 443
    - protocol: TCP
      port: 80
```

#### TLS Configuration

```nginx
# Nginx TLS configuration
server {
    listen 443 ssl http2;
    server_name salessync.company.com;
    
    # SSL certificates
    ssl_certificate /etc/ssl/certs/salessync.crt;
    ssl_certificate_key /etc/ssl/private/salessync.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://salessync-backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name salessync.company.com;
    return 301 https://$server_name$request_uri;
}
```

## Incident Response

### Incident Response Plan

#### Incident Classification

| Severity | Description | Response Time | Escalation |
|----------|-------------|---------------|------------|
| **Critical** | System compromise, data breach, complete service outage | 15 minutes | CISO, CEO |
| **High** | Partial service outage, security vulnerability exploitation | 1 hour | Security Manager |
| **Medium** | Performance degradation, minor security issues | 4 hours | Security Analyst |
| **Low** | Minor issues, informational alerts | 24 hours | Operations Team |

#### Incident Response Process

```typescript
// Incident response workflow
class IncidentResponseService {
  async reportIncident(incident: IncidentReport): Promise<Incident> {
    // Create incident record
    const incidentRecord = await this.incidentRepository.create({
      id: generateUUID(),
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: incident.category,
      reportedBy: incident.reportedBy,
      status: 'reported',
      createdAt: new Date()
    })
    
    // Classify and prioritize
    const classification = await this.classifyIncident(incidentRecord)
    await this.incidentRepository.update(incidentRecord.id, {
      classification,
      priority: this.calculatePriority(classification, incident.severity)
    })
    
    // Notify response team
    await this.notifyResponseTeam(incidentRecord)
    
    // Auto-assign based on category
    const assignee = await this.getAssignee(incident.category, incident.severity)
    if (assignee) {
      await this.assignIncident(incidentRecord.id, assignee.id)
    }
    
    // Start response timer
    await this.startResponseTimer(incidentRecord.id, incident.severity)
    
    return incidentRecord
  }
  
  async escalateIncident(incidentId: string, reason: string): Promise<void> {
    const incident = await this.incidentRepository.findById(incidentId)
    if (!incident) {
      throw new Error('Incident not found')
    }
    
    // Determine escalation level
    const escalationLevel = this.getNextEscalationLevel(incident.severity)
    const escalationContacts = await this.getEscalationContacts(escalationLevel)
    
    // Update incident
    await this.incidentRepository.update(incidentId, {
      escalationLevel,
      escalatedAt: new Date(),
      escalationReason: reason
    })
    
    // Notify escalation contacts
    for (const contact of escalationContacts) {
      await this.notificationService.sendEscalationNotification(contact, incident)
    }
    
    // Log escalation
    await this.auditService.logEvent({
      action: 'incident_escalated',
      incidentId,
      details: { reason, escalationLevel }
    })
  }
}
```

### Security Monitoring

#### Security Information and Event Management (SIEM)

```typescript
// SIEM integration
class SIEMService {
  async sendSecurityEvent(event: SecurityEvent): Promise<void> {
    const siemEvent = {
      timestamp: new Date().toISOString(),
      source: 'salessync',
      eventType: event.type,
      severity: event.severity,
      userId: event.userId,
      sourceIP: event.sourceIP,
      userAgent: event.userAgent,
      details: event.details,
      tags: event.tags
    }
    
    // Send to SIEM system
    await this.siemClient.sendEvent(siemEvent)
    
    // Store locally for backup
    await this.securityEventRepository.create(siemEvent)
    
    // Check for correlation rules
    await this.checkCorrelationRules(siemEvent)
  }
  
  private async checkCorrelationRules(event: SecurityEvent): Promise<void> {
    const rules = await this.correlationRuleRepository.getActiveRules()
    
    for (const rule of rules) {
      if (await this.evaluateRule(rule, event)) {
        await this.triggerAlert({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerEvent: event,
          severity: rule.alertSeverity
        })
      }
    }
  }
}

// Security event types
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  ACCOUNT_LOCKED: 'account_locked',
  PASSWORD_CHANGED: 'password_changed',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  DATA_ACCESS: 'data_access',
  DATA_EXPORT: 'data_export',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  MALWARE_DETECTED: 'malware_detected',
  VULNERABILITY_EXPLOITED: 'vulnerability_exploited'
}
```

#### Threat Detection

```typescript
// Anomaly detection service
class AnomalyDetectionService {
  async analyzeUserBehavior(userId: string): Promise<AnomalyResult> {
    const user = await this.userService.getUser(userId)
    const recentActivity = await this.activityService.getRecentActivity(userId, 30) // Last 30 days
    
    const anomalies: Anomaly[] = []
    
    // Check login patterns
    const loginAnomaly = await this.detectLoginAnomalies(userId, recentActivity)
    if (loginAnomaly) {
      anomalies.push(loginAnomaly)
    }
    
    // Check access patterns
    const accessAnomaly = await this.detectAccessAnomalies(userId, recentActivity)
    if (accessAnomaly) {
      anomalies.push(accessAnomaly)
    }
    
    // Check data access patterns
    const dataAnomaly = await this.detectDataAccessAnomalies(userId, recentActivity)
    if (dataAnomaly) {
      anomalies.push(dataAnomaly)
    }
    
    const riskScore = this.calculateRiskScore(anomalies)
    
    return {
      userId,
      timestamp: new Date(),
      anomalies,
      riskScore,
      recommendation: this.getRecommendation(riskScore)
    }
  }
  
  private async detectLoginAnomalies(userId: string, activity: UserActivity[]): Promise<Anomaly | null> {
    const loginEvents = activity.filter(a => a.type === 'login')
    
    // Check for unusual login times
    const usualHours = this.getUserUsualLoginHours(loginEvents)
    const recentLogins = loginEvents.filter(l => 
      new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    
    for (const login of recentLogins) {
      const loginHour = new Date(login.timestamp).getHours()
      if (!usualHours.includes(loginHour)) {
        return {
          type: 'unusual_login_time',
          severity: 'medium',
          description: `Login at unusual time: ${loginHour}:00`,
          evidence: { loginTime: login.timestamp, usualHours }
        }
      }
    }
    
    // Check for unusual locations
    const usualLocations = this.getUserUsualLocations(loginEvents)
    for (const login of recentLogins) {
      if (login.location && !this.isLocationFamiliar(login.location, usualLocations)) {
        return {
          type: 'unusual_login_location',
          severity: 'high',
          description: `Login from unusual location: ${login.location.city}`,
          evidence: { loginLocation: login.location, usualLocations }
        }
      }
    }
    
    return null
  }
}
```

## Compliance Requirements

### Regulatory Compliance

#### GDPR Compliance

```typescript
// GDPR compliance service
class GDPRComplianceService {
  async processDataSubjectRequest(request: DataSubjectRequest): Promise<DataSubjectResponse> {
    const { type, subjectId, requesterId } = request
    
    // Verify requester identity
    await this.verifyRequesterIdentity(requesterId, subjectId)
    
    switch (type) {
      case 'access':
        return await this.handleAccessRequest(subjectId)
      case 'rectification':
        return await this.handleRectificationRequest(request)
      case 'erasure':
        return await this.handleErasureRequest(subjectId)
      case 'portability':
        return await this.handlePortabilityRequest(subjectId)
      case 'restriction':
        return await this.handleRestrictionRequest(request)
      default:
        throw new Error('Unsupported request type')
    }
  }
  
  private async handleAccessRequest(subjectId: string): Promise<DataSubjectResponse> {
    // Collect all personal data
    const personalData = await this.collectPersonalData(subjectId)
    
    // Generate data export
    const exportData = {
      subject: personalData.subject,
      data: personalData.data,
      processing: personalData.processing,
      retention: personalData.retention,
      exportDate: new Date().toISOString()
    }
    
    // Log the request
    await this.auditService.logEvent({
      action: 'gdpr_access_request',
      subjectId,
      details: { dataCategories: Object.keys(personalData.data) }
    })
    
    return {
      requestId: generateUUID(),
      type: 'access',
      status: 'completed',
      data: exportData,
      completedAt: new Date()
    }
  }
  
  private async handleErasureRequest(subjectId: string): Promise<DataSubjectResponse> {
    // Check for legal basis to retain data
    const retentionRequirements = await this.checkRetentionRequirements(subjectId)
    
    if (retentionRequirements.length > 0) {
      return {
        requestId: generateUUID(),
        type: 'erasure',
        status: 'rejected',
        reason: 'Legal obligation to retain data',
        details: retentionRequirements,
        completedAt: new Date()
      }
    }
    
    // Perform erasure
    await this.erasePersonalData(subjectId)
    
    // Log the erasure
    await this.auditService.logEvent({
      action: 'gdpr_erasure_completed',
      subjectId,
      details: { erasureDate: new Date().toISOString() }
    })
    
    return {
      requestId: generateUUID(),
      type: 'erasure',
      status: 'completed',
      completedAt: new Date()
    }
  }
}

// Consent management
class ConsentManagementService {
  async recordConsent(consent: ConsentRecord): Promise<void> {
    const consentRecord = {
      id: generateUUID(),
      subjectId: consent.subjectId,
      purpose: consent.purpose,
      lawfulBasis: consent.lawfulBasis,
      consentGiven: consent.consentGiven,
      consentDate: new Date(),
      consentMethod: consent.consentMethod,
      consentText: consent.consentText,
      withdrawalMethod: consent.withdrawalMethod
    }
    
    await this.consentRepository.create(consentRecord)
    
    // Update processing activities
    await this.updateProcessingActivities(consent.subjectId, consent.purpose, consent.consentGiven)
    
    // Log consent
    await this.auditService.logEvent({
      action: 'consent_recorded',
      subjectId: consent.subjectId,
      details: { purpose: consent.purpose, consentGiven: consent.consentGiven }
    })
  }
  
  async withdrawConsent(subjectId: string, purpose: string): Promise<void> {
    // Update consent record
    await this.consentRepository.updateConsent(subjectId, purpose, {
      consentGiven: false,
      withdrawalDate: new Date()
    })
    
    // Stop processing for this purpose
    await this.stopProcessing(subjectId, purpose)
    
    // Log withdrawal
    await this.auditService.logEvent({
      action: 'consent_withdrawn',
      subjectId,
      details: { purpose }
    })
  }
}
```

#### PCI DSS Compliance

```typescript
// PCI DSS compliance service
class PCIComplianceService {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    // Validate PCI compliance requirements
    await this.validatePCIRequirements()
    
    // Tokenize sensitive data
    const tokenizedData = await this.tokenizePaymentData(paymentData)
    
    // Process payment with tokenized data
    const result = await this.paymentProcessor.processPayment(tokenizedData)
    
    // Log transaction (without sensitive data)
    await this.auditService.logEvent({
      action: 'payment_processed',
      transactionId: result.transactionId,
      details: {
        amount: paymentData.amount,
        currency: paymentData.currency,
        maskedCardNumber: this.maskCardNumber(paymentData.cardNumber)
      }
    })
    
    return result
  }
  
  private async tokenizePaymentData(paymentData: PaymentData): Promise<TokenizedPaymentData> {
    // Generate token for card number
    const cardToken = await this.tokenService.generateToken(paymentData.cardNumber)
    
    // Store mapping securely (in PCI compliant environment)
    await this.tokenMappingService.storeMapping(cardToken, paymentData.cardNumber)
    
    return {
      cardToken,
      expiryMonth: paymentData.expiryMonth,
      expiryYear: paymentData.expiryYear,
      amount: paymentData.amount,
      currency: paymentData.currency
    }
  }
  
  private maskCardNumber(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*')
  }
  
  async validatePCIRequirements(): Promise<void> {
    const requirements = [
      'firewall_configured',
      'default_passwords_changed',
      'cardholder_data_protected',
      'encrypted_transmission',
      'antivirus_updated',
      'secure_systems_maintained',
      'access_restricted',
      'unique_ids_assigned',
      'physical_access_restricted',
      'network_monitored',
      'security_tested',
      'security_policy_maintained'
    ]
    
    for (const requirement of requirements) {
      const isCompliant = await this.checkRequirement(requirement)
      if (!isCompliant) {
        throw new PCIComplianceError(`PCI requirement not met: ${requirement}`)
      }
    }
  }
}
```

## Security Training

### Security Awareness Program

#### Training Modules

```typescript
// Security training service
class SecurityTrainingService {
  private trainingModules: TrainingModule[] = [
    {
      id: 'password_security',
      title: 'Password Security Best Practices',
      description: 'Learn how to create and manage secure passwords',
      duration: 30, // minutes
      mandatory: true,
      frequency: 'annually',
      content: [
        'Password complexity requirements',
        'Password manager usage',
        'Multi-factor authentication',
        'Common password attacks'
      ]
    },
    {
      id: 'phishing_awareness',
      title: 'Phishing Attack Recognition',
      description: 'Identify and respond to phishing attempts',
      duration: 45,
      mandatory: true,
      frequency: 'quarterly',
      content: [
        'Types of phishing attacks',
        'Email security indicators',
        'Reporting procedures',
        'Incident response'
      ]
    },
    {
      id: 'data_protection',
      title: 'Data Protection and Privacy',
      description: 'Understand data protection requirements and best practices',
      duration: 60,
      mandatory: true,
      frequency: 'annually',
      content: [
        'Data classification',
        'GDPR requirements',
        'Data handling procedures',
        'Privacy by design'
      ]
    },
    {
      id: 'secure_coding',
      title: 'Secure Coding Practices',
      description: 'Development security best practices',
      duration: 120,
      mandatory: false,
      frequency: 'annually',
      targetRoles: ['developer', 'tech_lead'],
      content: [
        'OWASP Top 10',
        'Input validation',
        'Authentication and authorization',
        'Secure API design'
      ]
    }
  ]
  
  async assignTraining(userId: string): Promise<TrainingAssignment[]> {
    const user = await this.userService.getUser(userId)
    const assignments: TrainingAssignment[] = []
    
    for (const module of this.trainingModules) {
      // Check if training is applicable to user
      if (this.isTrainingApplicable(module, user)) {
        // Check if training is due
        const lastCompletion = await this.getLastCompletion(userId, module.id)
        if (this.isTrainingDue(module, lastCompletion)) {
          assignments.push({
            id: generateUUID(),
            userId,
            moduleId: module.id,
            assignedAt: new Date(),
            dueDate: this.calculateDueDate(module),
            status: 'assigned'
          })
        }
      }
    }
    
    // Save assignments
    for (const assignment of assignments) {
      await this.trainingRepository.createAssignment(assignment)
    }
    
    return assignments
  }
  
  async completeTraining(assignmentId: string, score: number): Promise<void> {
    const assignment = await this.trainingRepository.getAssignment(assignmentId)
    if (!assignment) {
      throw new Error('Assignment not found')
    }
    
    const module = this.trainingModules.find(m => m.id === assignment.moduleId)
    if (!module) {
      throw new Error('Training module not found')
    }
    
    // Check passing score
    const passingScore = module.passingScore || 80
    const passed = score >= passingScore
    
    // Update assignment
    await this.trainingRepository.updateAssignment(assignmentId, {
      status: passed ? 'completed' : 'failed',
      completedAt: new Date(),
      score,
      passed
    })
    
    // Create completion record
    await this.trainingRepository.createCompletion({
      userId: assignment.userId,
      moduleId: assignment.moduleId,
      completedAt: new Date(),
      score,
      passed,
      certificateId: passed ? generateUUID() : null
    })
    
    // Log completion
    await this.auditService.logEvent({
      action: 'training_completed',
      userId: assignment.userId,
      details: {
        moduleId: assignment.moduleId,
        score,
        passed
      }
    })
    
    // Send notification
    if (passed) {
      await this.notificationService.sendTrainingCompletionNotification(assignment.userId, module)
    } else {
      await this.notificationService.sendTrainingFailureNotification(assignment.userId, module)
    }
  }
}
```

#### Phishing Simulation

```typescript
// Phishing simulation service
class PhishingSimulationService {
  async createSimulation(campaign: PhishingCampaign): Promise<SimulationResult> {
    const simulation = {
      id: generateUUID(),
      name: campaign.name,
      template: campaign.template,
      targetUsers: campaign.targetUsers,
      scheduledDate: campaign.scheduledDate,
      status: 'scheduled'
    }
    
    await this.simulationRepository.create(simulation)
    
    // Schedule simulation
    await this.scheduleSimulation(simulation)
    
    return simulation
  }
  
  async executeSimulation(simulationId: string): Promise<void> {
    const simulation = await this.simulationRepository.findById(simulationId)
    if (!simulation) {
      throw new Error('Simulation not found')
    }
    
    // Update status
    await this.simulationRepository.update(simulationId, {
      status: 'running',
      startedAt: new Date()
    })
    
    // Send phishing emails
    for (const userId of simulation.targetUsers) {
      await this.sendPhishingEmail(userId, simulation)
    }
    
    // Log simulation start
    await this.auditService.logEvent({
      action: 'phishing_simulation_started',
      simulationId,
      details: {
        targetCount: simulation.targetUsers.length,
        template: simulation.template
      }
    })
  }
  
  async recordUserAction(simulationId: string, userId: string, action: PhishingAction): Promise<void> {
    const result = {
      simulationId,
      userId,
      action: action.type,
      timestamp: new Date(),
      details: action.details
    }
    
    await this.simulationResultRepository.create(result)
    
    // Provide immediate feedback for failed actions
    if (['clicked_link', 'entered_credentials', 'downloaded_attachment'].includes(action.type)) {
      await this.provideFeedback(userId, action.type)
      
      // Assign remedial training
      await this.assignRemedialTraining(userId)
    }
    
    // Log user action
    await this.auditService.logEvent({
      action: 'phishing_simulation_action',
      userId,
      details: {
        simulationId,
        actionType: action.type
      }
    })
  }
  
  private async provideFeedback(userId: string, actionType: string): Promise<void> {
    const feedbackMessage = this.getFeedbackMessage(actionType)
    
    await this.notificationService.sendPhishingFeedback(userId, {
      title: 'Security Awareness Alert',
      message: feedbackMessage,
      resources: [
        'Phishing Recognition Guide',
        'Security Best Practices',
        'Incident Reporting Procedures'
      ]
    })
  }
}
```

---

**Document Control**
- **Version**: 2.0
- **Created**: January 2024
- **Last Updated**: January 2024
- **Next Review**: February 2024
- **Owner**: Security Team
- **Approved By**: Chief Information Security Officer