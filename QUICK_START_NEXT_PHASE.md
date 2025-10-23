# 🚀 Quick Start Guide - Next Development Phase

**Last Updated:** October 23, 2025  
**Current Status:** 6/52 tasks complete (12%)  
**Next Phase:** Quick Wins (6 tasks, 15-20 hours)

---

## 📋 PRIORITY QUEUE - START HERE

### 🔥 IMMEDIATE (Next 2-3 hours)
Pick any of these quick wins to start building momentum:

#### Option 1: Visit Management TODOs (2h) ⭐ EASIEST
**File:** `frontend-vite/src/pages/field-marketing/VisitList.tsx`
```typescript
// Find this TODO around line 150:
// TODO: Replace with actual API call for surveys/tasks

// Replace with:
const surveys = await apiClient.get(`/visits/${visitId}/surveys`);
const tasks = await apiClient.get(`/visits/${visitId}/tasks`);
```
**Impact:** Enables complete visit workflow  
**Dependencies:** None  
**Testing:** Check visit list loads survey data

---

#### Option 2: Board Placement Photo Upload (3h) ⭐ HIGH VALUE
**File:** `frontend-vite/src/pages/field-marketing/BoardPlacement.tsx`
```typescript
// Around line 200, find the submit handler
// Add photo upload logic:

const formData = new FormData();
formData.append('customer_id', customerId);
formData.append('brand_id', selectedBrand);
formData.append('board_type', boardType);
formData.append('placement_location', location);
if (photo) {
  formData.append('photo', photo);
}

await apiClient.post('/board-installations', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```
**Impact:** Completes board placement workflow  
**Dependencies:** Backend already has endpoint  
**Testing:** Test photo upload and preview

---

#### Option 3: Van Sales Dashboard (3h) ⭐ VISIBLE IMPACT
**File:** `frontend-vite/src/pages/van-sales/VanSalesPage.tsx`
```typescript
// Replace mock data around line 50:
const [stats, setStats] = useState({
  totalSales: 0,  // ← These are hardcoded
  ordersCompleted: 0,
  activeRoutes: 0,
  efficiency: 0
});

// Replace with:
useEffect(() => {
  const fetchStats = async () => {
    const sales = await apiClient.get('/van-sales/stats');
    setStats(sales.data);
  };
  fetchStats();
}, []);
```
**Impact:** Real-time van sales metrics  
**Dependencies:** Backend endpoint exists  
**Testing:** Verify stats load from API

---

### 🎯 SHORT TERM (Next 3-5 hours)

#### Route Management CRUD (3h)
**File:** `frontend-vite/src/pages/van-sales/RouteManagementPage.tsx`
**Tasks:**
1. Connect to `/api/routes` for list
2. Add create route modal
3. Implement edit functionality
4. Add delete confirmation
5. Connect to backend APIs

**Code Template:**
```typescript
// Add these handlers:
const handleCreateRoute = async (routeData) => {
  await apiClient.post('/routes', routeData);
  fetchRoutes(); // refresh list
};

const handleUpdateRoute = async (id, routeData) => {
  await apiClient.put(`/routes/${id}`, routeData);
  fetchRoutes();
};

const handleDeleteRoute = async (id) => {
  if (confirm('Delete this route?')) {
    await apiClient.delete(`/routes/${id}`);
    fetchRoutes();
  }
};
```

---

#### Inventory Tracking (2h)
**File:** `frontend-vite/src/pages/van-sales/InventoryTrackingPage.tsx`
**Tasks:**
1. Fetch inventory from `/api/inventory`
2. Add stock level updates
3. Implement low stock alerts
4. Add restock functionality

---

#### Campaigns CRUD (3h)
**File:** `frontend-vite/src/pages/campaigns/CampaignsPage.tsx`
**Tasks:**
1. Connect to `/api/campaigns`
2. Add campaign creation
3. Implement campaign editing
4. Add campaign status tracking
5. Add campaign analytics

---

## 🛠️ DEVELOPMENT WORKFLOW

### Step-by-Step Process

#### 1. Pick a Task
Choose from the priority queue above

#### 2. Create Branch (Optional)
```bash
git checkout -b feature/visit-management-api
```

#### 3. Make Changes
Edit the file(s) listed in the task

#### 4. Test Locally
```bash
# Start backend (if not running)
cd backend-api
PORT=12001 node src/server.js

# Start frontend dev server
cd frontend-vite
npm run dev
```

#### 5. Build & Verify
```bash
cd frontend-vite
npm run build
```

#### 6. Commit Changes
```bash
git add -A
git commit -m "feat: [task name] - connect to API"
```

#### 7. Run Tests
```bash
./automated-test.sh
```

#### 8. Push to Repository
```bash
git push origin main
```

---

## 📦 CODE PATTERNS TO FOLLOW

### Pattern 1: Fetching Data with Loading State
```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/endpoint');
      setData(response.data.data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

### Pattern 2: Submitting Forms
```typescript
const handleSubmit = async (formData) => {
  try {
    setSubmitting(true);
    setError(null);
    
    await apiClient.post('/endpoint', formData);
    
    // Success feedback
    alert('Success!'); // TODO: Replace with toast
    navigate('/success-page');
  } catch (err) {
    console.error('Error:', err);
    setError('Failed to submit');
  } finally {
    setSubmitting(false);
  }
};
```

### Pattern 3: Deleting with Confirmation
```typescript
const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return;
  
  try {
    await apiClient.delete(`/endpoint/${id}`);
    // Refresh list
    fetchData();
  } catch (err) {
    console.error('Error:', err);
    alert('Failed to delete');
  }
};
```

---

## 🎨 UI IMPROVEMENTS TO ADD

### Replace Alerts with Toasts
```typescript
// Install react-hot-toast if not already:
// npm install react-hot-toast

import toast from 'react-hot-toast';

// Replace:
alert('Success!');

// With:
toast.success('Success!');

// Replace:
alert('Error!');

// With:
toast.error('Error!');
```

### Add Loading States
```typescript
// Use the existing LoadingSpinner component:
import LoadingSpinner from '../../components/ui/LoadingSpinner';

if (loading) {
  return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>
  );
}
```

### Add Form Validations
```typescript
const validateForm = (data) => {
  const errors = {};
  
  if (!data.name) errors.name = 'Name is required';
  if (!data.email) errors.email = 'Email is required';
  if (data.email && !data.email.includes('@')) {
    errors.email = 'Invalid email';
  }
  
  return errors;
};

const handleSubmit = async (data) => {
  const errors = validateForm(data);
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  
  // Proceed with submission
};
```

---

## 🧪 TESTING CHECKLIST

### Before Committing
- [ ] Code compiles without errors
- [ ] Page loads without console errors
- [ ] API calls work correctly
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] Success flow completes
- [ ] No hardcoded data remains

### Manual Testing Steps
1. Start backend: `cd backend-api && PORT=12001 node src/server.js`
2. Start frontend: `cd frontend-vite && npm run dev`
3. Open browser: `http://localhost:12000`
4. Test the feature you modified
5. Check browser console for errors
6. Check network tab for API calls
7. Test error scenarios (disconnect network, invalid data)

### Automated Testing
```bash
# Run the test suite
./automated-test.sh

# Should see:
# ✓ PASS: [endpoint name]
# Pass Rate: 100%
```

---

## 📊 TRACKING PROGRESS

### Update Task Tracker
After completing each task, update the task tracker:

```bash
# View current tasks
task_tracker view

# Mark task as done
# (AI assistant will do this automatically)
```

### Git Commit Messages
Follow this format:
```bash
git commit -m "feat: [component] - [what you did]

- Connected to /api/[endpoint]
- Removed mock data
- Added loading state
- Added error handling

Status: Task [X] complete, [Y] remaining"
```

---

## 🚀 NEXT MAJOR MODULES

After completing Quick Wins (6 tasks), prioritize in this order:

### Phase 3: Field Operations (140-185h)
**Why:** Critical for field agents, highest business value
**Start with:** Route Planning (25-30h)

### Phase 4: Trade Marketing (118-155h)
**Why:** Differentiator feature, high customer demand
**Start with:** In-Store Analytics (15-20h)

### Phase 5: Brand Management (55-75h)
**Why:** Unique selling point
**Start with:** Brand Dashboard (15-20h)

### Phase 6: Financial (80-105h)
**Why:** Required for transactions
**Start with:** Payment Integration (20-25h)

---

## 💡 PRO TIPS

### Tip 1: Start Small
Don't try to build everything at once. Pick one task, complete it fully, commit, then move to the next.

### Tip 2: Follow Existing Patterns
Look at the 6 components we already fixed:
- `FieldMarketingDashboard.tsx` - Good example of API fetching
- `CustomerSelection.tsx` - Good example of list display
- `ProductDistribution.tsx` - Good example of form submission

### Tip 3: Use TypeScript Types
Define interfaces for API responses:
```typescript
interface Route {
  id: string;
  name: string;
  stops: number;
  distance: number;
  status: 'active' | 'inactive';
}
```

### Tip 4: Handle Errors Gracefully
Always wrap API calls in try-catch:
```typescript
try {
  await apiClient.post('/endpoint', data);
} catch (err) {
  console.error('Error:', err);
  // Show user-friendly message
}
```

### Tip 5: Keep It Simple
Don't over-engineer. Get it working first, optimize later.

---

## 📞 NEED HELP?

### Common Issues

#### API Returns 404
- Check endpoint exists in `backend-api/src/server.js`
- Check route is registered
- Verify URL path matches exactly

#### API Returns 401
- Authentication token expired
- Login again to get fresh token
- Check token is being sent in headers

#### Data Not Displaying
- Check API response format: `response.data.data`
- Verify state is being updated
- Check for console errors
- Use React DevTools to inspect state

#### Build Fails
- Check for TypeScript errors
- Verify all imports exist
- Run `npm install` if packages missing

---

## ✅ SUCCESS CRITERIA

### Quick Wins Phase Complete When:
- [ ] All 6 tasks completed
- [ ] All components using real APIs
- [ ] No TODO comments remain in modified files
- [ ] Build succeeds without errors
- [ ] Manual testing passes
- [ ] Changes committed to git
- [ ] Tests pass (automated-test.sh)

### Ready for Phase 3 When:
- [ ] Quick Wins complete
- [ ] UI polish added (toasts, validations)
- [ ] All basic CRUD operations working
- [ ] System stable for field testing

---

## 🎯 TODAY'S GOAL

**Pick ONE task from the Quick Wins section and complete it fully.**

Recommended starting point:
1. **Visit Management** (easiest, 2h)
2. **Van Sales Dashboard** (visible impact, 3h)
3. **Board Placement** (high value, 3h)

**Let's build! 🚀**

---

**Last Updated:** October 23, 2025  
**Next Review:** After each task completion  
**Questions?** Check the code patterns above or reference the fixed components
