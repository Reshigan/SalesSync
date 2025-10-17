# Field Agent Test Cases

## Overview
Comprehensive test cases for the SalesSync Field Agent module covering GPS tracking, board placement, product distribution, commission system, and real-time monitoring.

## Test Environment Setup
- **Test URL**: https://work-1-qbecwaydyafyeqqu.prod-runtime.all-hands.dev
- **GPS Testing**: Use GPS simulation tools or physical device testing
- **Test Locations**: Predefined test coordinates for consistent testing
- **Mobile Testing**: Primary focus on mobile devices for field operations

## 1. GPS Location Tracking Tests

### TC-FIELD-001: GPS Location Verification
**Objective**: Verify accurate GPS location capture and verification
**Priority**: Critical
**Prerequisites**: Field agent logged in, GPS permissions granted

**Test Steps**:
1. Navigate to Field Agent dashboard
2. Click "Start Location Tracking"
3. Allow GPS permissions when prompted
4. Verify current location display
5. Move to different location (10+ meters)
6. Verify location update

**Expected Results**:
- GPS coordinates captured accurately (±5 meters)
- Location displayed on map interface
- Real-time location updates every 30 seconds
- Location history maintained
- Timestamp recorded for each location

**Test Data**:
```json
{
  "test_location_1": {
    "latitude": 51.5074,
    "longitude": -0.1278,
    "address": "London, UK"
  },
  "test_location_2": {
    "latitude": 51.5085,
    "longitude": -0.1257,
    "address": "London, UK (moved)"
  }
}
```

### TC-FIELD-002: GPS Permission Denied
**Objective**: Verify handling when GPS permissions are denied
**Priority**: High

**Test Steps**:
1. Navigate to Field Agent dashboard
2. Click "Start Location Tracking"
3. Deny GPS permissions when prompted
4. Verify error handling

**Expected Results**:
- Clear error message: "GPS permission required for field operations"
- Option to retry permission request
- Alternative manual location entry option
- Cannot proceed with location-dependent tasks

### TC-FIELD-003: GPS Signal Lost
**Objective**: Verify handling when GPS signal is lost
**Priority**: High

**Test Steps**:
1. Start location tracking successfully
2. Move to area with poor GPS signal (indoor/underground)
3. Verify system behavior
4. Return to area with good GPS signal

**Expected Results**:
- Warning message when signal lost
- Last known location maintained
- Automatic reconnection when signal restored
- Gap in location history clearly marked

### TC-FIELD-004: Location Accuracy Validation
**Objective**: Verify location accuracy meets business requirements
**Priority**: High

**Test Steps**:
1. Enable location tracking at known coordinates
2. Compare system coordinates with actual GPS coordinates
3. Test at multiple locations
4. Verify accuracy within acceptable range

**Expected Results**:
- Location accuracy within ±10 meters
- Consistent accuracy across different locations
- Accuracy indicator displayed to user
- Poor accuracy warnings when applicable

## 2. Board Placement Tests

### TC-FIELD-005: Board Placement Registration
**Objective**: Verify successful board placement registration
**Priority**: Critical
**Prerequisites**: Agent at valid location, boards available

**Test Steps**:
1. Navigate to "Board Placement" section
2. Verify current GPS location
3. Select board type from inventory
4. Take photo of board placement
5. Add placement notes
6. Submit board placement

**Expected Results**:
- GPS location verified (within 10m of target)
- Board inventory updated (quantity decreased)
- Photo uploaded successfully
- Placement timestamp recorded
- Placement ID generated
- Confirmation message displayed

**Test Data**:
```json
{
  "board_placement": {
    "board_type": "Premium Billboard",
    "location": {
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "photo_required": true,
    "notes": "Placed at main street corner, high visibility"
  }
}
```

### TC-FIELD-006: Board Placement GPS Verification
**Objective**: Verify GPS proximity requirement for board placement
**Priority**: Critical

**Test Steps**:
1. Navigate to board placement
2. Attempt placement when >10m from target location
3. Move within 10m of target location
4. Attempt placement again

**Expected Results**:
- Placement blocked when >10m from target
- Error message: "You must be within 10 meters of the placement location"
- GPS distance indicator shown
- Placement allowed when within range

### TC-FIELD-007: Board Photo Requirements
**Objective**: Verify photo capture and validation for board placement
**Priority**: High

**Test Steps**:
1. Start board placement process
2. Attempt to submit without photo
3. Take photo using camera
4. Verify photo quality and upload
5. Submit placement with photo

**Expected Results**:
- Cannot submit without required photo
- Camera interface opens correctly
- Photo preview displayed
- Photo upload progress shown
- Photo stored with placement record

### TC-FIELD-008: Board Inventory Management
**Objective**: Verify board inventory tracking and updates
**Priority**: High

**Test Steps**:
1. Check initial board inventory count
2. Place multiple boards of same type
3. Verify inventory decreases correctly
4. Attempt placement when inventory is zero

**Expected Results**:
- Accurate inventory count displayed
- Inventory decreases with each placement
- Cannot place boards when inventory is zero
- Low inventory warnings displayed

### TC-FIELD-009: Board Placement Analytics
**Objective**: Verify AI-powered coverage analytics for board placements
**Priority**: Medium

**Test Steps**:
1. Complete multiple board placements
2. Navigate to placement analytics
3. Verify coverage area calculations
4. Check demographic analysis
5. Review placement effectiveness scores

**Expected Results**:
- Coverage area visualized on map
- Demographic data displayed
- Effectiveness scores calculated
- Recommendations for optimal placement
- Historical performance tracking

## 3. Product Distribution Tests

### TC-FIELD-010: Product Distribution Form
**Objective**: Verify product distribution recording functionality
**Priority**: Critical

**Test Steps**:
1. Navigate to "Product Distribution"
2. Select customer from list
3. Choose products to distribute
4. Enter quantities for each product
5. Capture customer signature
6. Submit distribution record

**Expected Results**:
- Customer list loads correctly
- Product catalog available
- Quantity validation (positive numbers only)
- Signature capture works on mobile
- Distribution record saved
- Inventory updated automatically

**Test Data**:
```json
{
  "distribution": {
    "customer_id": "CUST001",
    "products": [
      {
        "product_id": "PROD001",
        "name": "Premium Product A",
        "quantity": 10,
        "unit_price": 25.00
      },
      {
        "product_id": "PROD002",
        "name": "Standard Product B",
        "quantity": 5,
        "unit_price": 15.00
      }
    ],
    "total_value": 325.00
  }
}
```

### TC-FIELD-011: Customer Signature Capture
**Objective**: Verify digital signature capture functionality
**Priority**: High

**Test Steps**:
1. Start product distribution process
2. Navigate to signature section
3. Capture signature on mobile device
4. Clear and re-capture signature
5. Submit with signature

**Expected Results**:
- Signature pad responsive on mobile
- Clear signature option works
- Signature image saved correctly
- Cannot submit without signature
- Signature linked to distribution record

### TC-FIELD-012: Product Inventory Validation
**Objective**: Verify product inventory checks during distribution
**Priority**: High

**Test Steps**:
1. Check current product inventory
2. Attempt to distribute more than available
3. Distribute within available limits
4. Verify inventory updates

**Expected Results**:
- Cannot distribute more than available inventory
- Error message for insufficient inventory
- Real-time inventory validation
- Inventory decreases after successful distribution

### TC-FIELD-013: Offline Product Distribution
**Objective**: Verify product distribution works offline
**Priority**: Medium

**Test Steps**:
1. Start product distribution process
2. Disable internet connection
3. Complete distribution form
4. Submit distribution (should queue)
5. Re-enable internet connection
6. Verify automatic sync

**Expected Results**:
- Form works without internet
- Data saved locally when offline
- Sync indicator shows pending uploads
- Automatic sync when connection restored
- No data loss during offline operation

## 4. Commission System Tests

### TC-FIELD-014: Commission Calculation
**Objective**: Verify accurate commission calculation for field activities
**Priority**: Critical

**Test Steps**:
1. Complete board placement (commission: $50)
2. Complete product distribution (commission: 5% of value)
3. Navigate to commission dashboard
4. Verify commission calculations
5. Check commission history

**Expected Results**:
- Board placement commission: $50.00
- Product distribution commission: 5% of total value
- Total commission calculated correctly
- Commission breakdown displayed
- Historical commission tracking

**Test Data**:
```json
{
  "commission_rates": {
    "board_placement": 50.00,
    "product_distribution": 0.05,
    "customer_acquisition": 100.00,
    "target_achievement": 0.10
  }
}
```

### TC-FIELD-015: Commission Tiers
**Objective**: Verify tiered commission structure
**Priority**: High

**Test Steps**:
1. Complete activities to reach Tier 1 (0-100 points)
2. Continue to reach Tier 2 (101-200 points)
3. Verify commission rate changes
4. Check tier progression notifications

**Expected Results**:
- Tier 1: Base commission rates
- Tier 2: 1.2x commission multiplier
- Tier 3: 1.5x commission multiplier
- Tier progression notifications
- Visual tier indicators

### TC-FIELD-016: Commission Payment Tracking
**Objective**: Verify commission payment status tracking
**Priority**: Medium

**Test Steps**:
1. Accumulate commissions over time
2. Navigate to payment history
3. Verify payment status updates
4. Check payment schedule information

**Expected Results**:
- Pending commissions clearly marked
- Paid commissions with payment dates
- Payment schedule information
- Total earnings summary
- Payment method details

## 5. Real-time Monitoring Tests

### TC-FIELD-017: Live Agent Tracking
**Objective**: Verify real-time agent location monitoring
**Priority**: High
**Prerequisites**: Manager/Admin access

**Test Steps**:
1. Login as manager/admin
2. Navigate to "Live Agent Tracking"
3. Verify agent locations on map
4. Check agent status indicators
5. Verify real-time updates

**Expected Results**:
- All active agents shown on map
- Location updates every 30 seconds
- Agent status indicators (active/inactive/offline)
- Agent information popup on click
- Route history available

### TC-FIELD-018: Agent Activity Feed
**Objective**: Verify real-time activity feed for agent actions
**Priority**: Medium

**Test Steps**:
1. Perform various field activities as agent
2. Switch to manager view
3. Check activity feed for updates
4. Verify activity timestamps
5. Check activity details

**Expected Results**:
- Activities appear in real-time feed
- Accurate timestamps for all activities
- Activity details accessible
- Filter options for activity types
- Export functionality for reports

### TC-FIELD-019: Geofencing Alerts
**Objective**: Verify geofencing alerts for designated areas
**Priority**: Medium

**Test Steps**:
1. Set up geofenced area in admin panel
2. Agent enters geofenced area
3. Verify alert generation
4. Agent exits geofenced area
5. Verify exit alert

**Expected Results**:
- Entry alert generated immediately
- Exit alert generated when leaving
- Alert details include timestamp and location
- Notifications sent to relevant managers
- Alert history maintained

## 6. Mobile Optimization Tests

### TC-FIELD-020: Mobile Interface Responsiveness
**Objective**: Verify mobile interface optimization
**Priority**: High
**Device**: iOS/Android smartphones

**Test Steps**:
1. Access field agent interface on mobile
2. Test all major functions
3. Verify touch interactions
4. Check screen orientation handling
5. Test with different screen sizes

**Expected Results**:
- Interface optimized for mobile screens
- Touch targets appropriately sized
- Smooth scrolling and navigation
- Portrait/landscape orientation support
- Consistent experience across devices

### TC-FIELD-021: Mobile Camera Integration
**Objective**: Verify camera functionality on mobile devices
**Priority**: High

**Test Steps**:
1. Access board placement on mobile
2. Tap camera button
3. Take photo using device camera
4. Verify photo quality and upload
5. Test with different lighting conditions

**Expected Results**:
- Camera opens correctly
- Photo capture works reliably
- Image quality acceptable for business use
- Upload progress indicated
- Photos stored securely

### TC-FIELD-022: Mobile GPS Performance
**Objective**: Verify GPS performance on mobile devices
**Priority**: Critical

**Test Steps**:
1. Enable location tracking on mobile
2. Test GPS accuracy in various conditions
3. Verify battery usage optimization
4. Test location updates while app backgrounded

**Expected Results**:
- GPS accuracy within acceptable range
- Reasonable battery consumption
- Location updates continue in background
- Smooth transition between foreground/background

## 7. Integration Tests

### TC-FIELD-023: End-to-End Field Workflow
**Objective**: Verify complete field agent workflow
**Priority**: Critical

**Test Steps**:
1. Login as field agent
2. Start location tracking
3. Navigate to first location
4. Place board with photo and notes
5. Navigate to customer location
6. Distribute products with signature
7. Check commission updates
8. Complete daily summary

**Expected Results**:
- Complete workflow executes smoothly
- All data captured and synchronized
- Commission calculated correctly
- Daily summary generated
- Manager notifications sent

### TC-FIELD-024: Multi-Agent Coordination
**Objective**: Verify coordination between multiple field agents
**Priority**: Medium

**Test Steps**:
1. Deploy multiple agents to same area
2. Verify territory management
3. Check for location conflicts
4. Test resource allocation
5. Verify communication features

**Expected Results**:
- Territory boundaries respected
- No double-booking of locations
- Resource conflicts prevented
- Inter-agent communication available
- Coordination alerts when needed

## Performance and Load Tests

### TC-FIELD-025: GPS Update Performance
**Objective**: Verify GPS update performance under load
**Priority**: Medium

**Test Steps**:
1. Simulate 100 concurrent agents
2. Enable location tracking for all
3. Monitor system performance
4. Verify update frequency maintained
5. Check for any dropped updates

**Expected Results**:
- All location updates processed
- Update frequency maintained (30 seconds)
- System performance remains stable
- No data loss or corruption
- Database performance acceptable

### TC-FIELD-026: Photo Upload Performance
**Objective**: Verify photo upload performance
**Priority**: Medium

**Test Steps**:
1. Upload multiple high-resolution photos
2. Test concurrent photo uploads
3. Monitor upload progress
4. Verify image compression
5. Check storage utilization

**Expected Results**:
- Photos upload within 30 seconds
- Concurrent uploads handled properly
- Appropriate image compression applied
- Storage usage optimized
- Upload progress accurately displayed

## Test Data Management

### Test Locations
```json
{
  "london_central": {
    "latitude": 51.5074,
    "longitude": -0.1278,
    "address": "London, UK"
  },
  "manchester_center": {
    "latitude": 53.4808,
    "longitude": -2.2426,
    "address": "Manchester, UK"
  },
  "birmingham_center": {
    "latitude": 52.4862,
    "longitude": -1.8904,
    "address": "Birmingham, UK"
  }
}
```

### Test Products
```json
{
  "products": [
    {
      "id": "PROD001",
      "name": "Premium Product A",
      "price": 25.00,
      "commission_rate": 0.05
    },
    {
      "id": "PROD002",
      "name": "Standard Product B",
      "price": 15.00,
      "commission_rate": 0.03
    }
  ]
}
```

### Test Customers
```json
{
  "customers": [
    {
      "id": "CUST001",
      "name": "ABC Retail Ltd",
      "location": {
        "latitude": 51.5074,
        "longitude": -0.1278
      }
    },
    {
      "id": "CUST002",
      "name": "XYZ Store Chain",
      "location": {
        "latitude": 51.5085,
        "longitude": -0.1257
      }
    }
  ]
}
```

## Automation Notes
- Use Playwright for mobile testing
- Implement GPS mocking for consistent testing
- Create reusable field agent workflows
- Set up test data reset procedures
- Integrate with CI/CD pipeline for automated testing
- Use device farms for comprehensive mobile testing