# Bachelor's Basa Expense Tracker — Frontend Requirements

## 1. Overview

The Bachelor's Basa Expense Tracker frontend is a multi-tenant SaaS web application for managing shared household meals, bazaar/grocery expenses, deposits, shared expenses, and monthly settlements.

### Recommended Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- Recharts
- Lucide React
- date-fns

### Core Principles

- Responsive and mobile-first
- Accessible UI
- Strong loading/error/empty states
- Server-side authorization assumptions must never be bypassed
- Backend is the source of truth for financial calculations
- Never trust client-side totals for settlement decisions
- Basa data must be isolated by active Basa/workspace

---

# 2. User Roles

| Role | Frontend Capabilities |
|---|---|
| Owner | Full Basa and subscription management |
| Manager | Members, expenses, deposits, settlements |
| Member | Own meals, view expenses/reports/settlement |
| Viewer | Read-only access |

The UI must hide unavailable actions based on role, but backend authorization remains mandatory.

---

# 3. Application Structure

Recommended route structure:

```text
/
├── (marketing)/
│   ├── page.tsx
│   ├── pricing/
│   ├── features/
│   └── contact/
│
├── auth/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
│
├── onboarding/
│   ├── page.tsx
│   ├── create-basa/
│   └── join-basa/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── basa/
│   ├── meals/
│   ├── bazaar/
│   ├── expenses/
│   ├── deposits/
│   ├── settlement/
│   ├── reports/
│   ├── members/
│   ├── notifications/
│   ├── settings/
│   └── billing/
│
└── admin/
    ├── dashboard/
    ├── users/
    ├── basas/
    ├── subscriptions/
    ├── plans/
    └── settings/
```

---

# 4. Authentication

## 4.1 Registration

Fields:

- Name
- Email
- Password
- Confirm Password

Requirements:

- Validate with Zod
- Show field-level validation
- Disable submit while request is pending
- Show API errors
- Redirect to email verification if required
- Redirect verified new users to onboarding

## 4.2 Login

Fields:

- Email
- Password
- Remember me

Actions:

- Login
- Forgot password
- Register

After login:

1. Fetch current user
2. Fetch user's Basas
3. If no Basa exists → onboarding
4. If one active Basa exists → dashboard
5. If multiple Basas exist → Basa selector

---

# 5. Onboarding

## New User

Display:

```text
Welcome to Basa Expense Tracker

[Create a Basa]
[Join a Basa]
```

## Create Basa

Fields:

- Basa name
- Address/location
- Billing cycle start date
- Currency

On success:

- Create Basa
- Assign creator as Owner
- Set active Basa
- Redirect to dashboard

## Join Basa

Support:

- Invitation token
- Invitation link
- Email invitation

Show invitation details before accepting.

---

# 6. Global App Layout

Desktop:

```text
┌──────────────┬─────────────────────────────────────┐
│ Sidebar      │ Header                              │
│              ├─────────────────────────────────────┤
│ Dashboard    │                                     │
│ Meals        │ Main Content                        │
│ Bazaar       │                                     │
│ Expenses     │                                     │
│ Deposits     │                                     │
│ Settlement   │                                     │
│ Reports      │                                     │
│ Members      │                                     │
│              │                                     │
│ Settings     │                                     │
└──────────────┴─────────────────────────────────────┘
```

Mobile:

- Bottom navigation or collapsible drawer
- Sticky primary action where appropriate
- Responsive tables converted to cards

---

# 7. Basa Selector

The header must provide an active Basa selector.

Example:

```text
Mirpur Basa ▼
```

Dropdown:

- List Basas
- Active Basa indicator
- Create Basa
- Join Basa
- Basa settings

Changing Basa must invalidate/refetch Basa-scoped queries.

---

# 8. Dashboard

## Overview Cards

Display:

- Total members
- Total meals
- Total grocery cost
- Meal rate
- Shared expenses
- Total deposits
- Current cycle

## Charts

Recommended:

- Grocery spending over time
- Expense by category
- Meals by roommate
- Food cost by roommate
- Deposit vs actual cost

## Quick Actions

- Log today's meals
- Add bazaar expense
- Add shared expense
- Add deposit
- View settlement

---

# 9. Billing Cycle UI

Display active billing cycle:

```text
September 2026
01 Sep — 30 Sep
Status: Active
```

Actions:

- Select previous cycle
- Select next cycle when available
- Create/new cycle if authorized
- Close cycle if authorized

Closed cycles should be visually distinct.

---

# 10. Meal System

## 10.1 Today's Meals

Members can enter:

- Breakfast
- Lunch
- Dinner
- Custom meal types

Each value supports numeric quantities.

Example:

```text
Breakfast  [0]
Lunch      [1]
Dinner     [1]

Total Meals: 2

[Save Meals]
```

## 10.2 Meal Calendar

Requirements:

- Monthly calendar
- Current day indicator
- Meal count per day
- Click date to edit
- Loading state
- Empty state
- Error state

## 10.3 Meal History

Filters:

- Date range
- Member
- Meal type

Members should only edit their own records unless authorized.

## 10.4 Meal Summary

Table:

| Roommate | Breakfast | Lunch | Dinner | Total |
|---|---:|---:|---:|---:|
| Member A | 10 | 22 | 20 | 52 |

---

# 11. Bazaar Expense UI

## Add Bazaar Expense

Fields:

- Date
- Amount
- Category
- Description
- Paid by
- Receipt (optional)
- Notes

Validation:

- Amount > 0
- Valid date
- Required category
- Required payer
- Reasonable text length

## Expense List

Columns:

- Date
- Description
- Category
- Paid by
- Amount
- Actions

Actions:

- View
- Edit
- Delete

Delete requires confirmation.

---

# 12. Shared Expense UI

Fields:

- Expense name
- Date
- Amount
- Category
- Paid by
- Allocation method
- Members
- Notes

Allocation methods:

- Equal
- Custom amount
- Percentage

For custom allocations, frontend must validate that the allocation total equals the expense amount.

For percentages, total must equal 100%.

The backend remains authoritative.

---

# 13. Deposit UI

## Add Deposit

Fields:

- Roommate
- Amount
- Date
- Payment method
- Reference
- Notes

Payment methods:

- Cash
- bKash
- Nagad
- Bank
- Other

## Deposit History

Display:

- Member
- Amount
- Date
- Method
- Recorded by
- Status

---

# 14. Settlement UI

The settlement screen is one of the most important pages.

## Summary

Display:

```text
Total Grocery Cost     ৳40,000
Total Meals            800
Meal Rate              ৳50
Shared Expenses        ৳8,000
Total Deposits         ৳48,000
```

## Roommate Settlement Table

| Roommate | Deposit | Food Cost | Shared Cost | Balance | Status |
|---|---:|---:|---:|---:|---|
| Jihad | ৳5,000 | ৳3,000 | ৳1,000 | +৳1,000 | Refund |
| Rahim | ৳4,000 | ৳3,500 | ৳1,000 | -৳500 | Due |

Positive balance:

```text
Refund ৳1,000
```

Negative balance:

```text
Due ৳500
```

Zero:

```text
Settled
```

## Settlement Detail

Show:

- Initial deposit
- Total meals
- Meal rate
- Food cost
- Individual shared cost
- Total cost
- Final balance
- Settlement status
- Payment history

The frontend must display calculation inputs returned by the backend rather than independently deciding the final balance.

---

# 15. Settlement Actions

Manager actions:

- Generate settlement
- Finalize settlement
- Mark refund paid
- Mark due amount paid
- Record partial payment
- Reopen cycle

Confirmation dialogs are required for:

- Finalizing
- Reopening
- Recording payment
- Deleting financial records

---

# 16. Reports

## Monthly Report

Sections:

1. Basa information
2. Billing period
3. Members
4. Total meals
5. Grocery expenses
6. Meal rate
7. Shared expenses
8. Deposits
9. Individual costs
10. Final settlement

Actions:

- Download PDF
- Export CSV
- Export Excel

---

# 17. Members

Manager/Owner page:

- Member list
- Role
- Join date
- Status
- Meal count
- Current balance

Actions:

- Invite member
- Change role
- Remove member
- View member details

Removing a member requires confirmation and should warn about unresolved financial records.

---

# 18. Invitations

Invitation page:

- Pending invitations
- Accepted invitations
- Expired invitations

Manager actions:

- Send invitation
- Resend invitation
- Cancel invitation

Invite link page:

```text
You've been invited to join Mirpur Basa

[Accept Invitation]
```

---

# 19. Notifications

Notification center:

- Unread count
- Notification list
- Mark as read
- Mark all as read

Types:

- Invitation
- Meal reminder
- Expense
- Settlement
- Payment due
- Refund
- System

---

# 20. Subscription & Billing

## Pricing Page

Plans should be dynamically loaded from the backend.

Example:

```text
Free
Basic
Pro
```

Show:

- Monthly price
- Yearly price
- Features
- Limits
- Current plan

## Billing Dashboard

Display:

- Current plan
- Billing interval
- Renewal date
- Payment status
- Usage
- Invoice history

Actions:

- Upgrade
- Downgrade
- Cancel
- Resume

---

# 21. Settings

## Profile

- Name
- Email
- Avatar
- Password

## Basa Settings

- Basa name
- Location
- Currency
- Cycle configuration
- Meal types
- Expense categories

## Notification Settings

- Meal reminders
- Settlement alerts
- Invitations
- Expense notifications

---

# 22. Loading States

Every async page must have appropriate loading UI.

Use:

- Skeletons
- Button loading states
- Table skeletons
- Chart skeletons

Never leave a blank page while loading.

---

# 23. Error Handling

Handle:

- Network errors
- 400 validation errors
- 401 unauthenticated
- 403 unauthorized
- 404 not found
- 409 conflict
- 429 rate limit
- 500 server errors

Show user-friendly messages.

Never expose raw backend stack traces.

---

# 24. Empty States

Examples:

```text
No meals recorded yet.

[Log Today's Meals]
```

```text
No bazaar expenses found.

[Add Expense]
```

```text
No roommates added yet.

[Invite Roommate]
```

---

# 25. Form Requirements

All forms should use:

- React Hook Form
- Zod
- Reusable input components
- Server error mapping
- Accessible labels
- Keyboard navigation

Avoid duplicating validation logic unnecessarily.

---

# 26. API Integration

Recommended API client structure:

```text
src/
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── basas.ts
│   │   ├── meals.ts
│   │   ├── expenses.ts
│   │   ├── deposits.ts
│   │   ├── settlements.ts
│   │   ├── reports.ts
│   │   └── subscriptions.ts
│   └── query-client.ts
```

Use TanStack Query for:

- Server state
- Caching
- Mutations
- Invalidations
- Optimistic updates where safe

Do not optimistically update financial calculations unless rollback is guaranteed.

---

# 27. Query Key Strategy

Example:

```text
['basa', basaId]
['basa', basaId, 'members']
['basa', basaId, 'cycles']
['basa', basaId, 'meals', cycleId]
['basa', basaId, 'expenses', cycleId]
['basa', basaId, 'deposits', cycleId]
['basa', basaId, 'settlement', cycleId]
```

Changing active Basa must invalidate Basa-scoped data.

---

# 28. Components

Recommended reusable components:

```text
BasaSelector
BillingCycleSelector
DashboardCard
ExpenseForm
ExpenseTable
MealForm
MealCalendar
MealSummaryTable
DepositForm
DepositTable
SettlementTable
SettlementCard
MemberTable
InviteMemberDialog
ConfirmDialog
MoneyDisplay
StatusBadge
EmptyState
ErrorState
LoadingSkeleton
Pagination
DateRangePicker
```

---

# 29. Financial Formatting

Currency must be configurable.

Default:

```text
BDT / ৳
```

Use a centralized formatter.

Do not format monetary values differently across pages.

---

# 30. Accessibility

Requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- ARIA labels where necessary
- Dialog focus trapping
- Color should not be the only status indicator
- Sufficient contrast
- Accessible form errors

---

# 31. Responsive Requirements

### Mobile

Optimize for:

- Meal entry
- Expense entry
- Settlement viewing

### Tablet

- Two-column dashboard
- Responsive tables

### Desktop

- Full sidebar
- Multi-column dashboard
- Data-heavy tables

---

# 32. Security Requirements

Frontend must:

- Never store passwords
- Never expose secret API keys
- Never trust role information from local storage
- Avoid putting sensitive financial data in URLs when unnecessary
- Handle expired sessions
- Protect authenticated routes
- Sanitize user-generated content

---

# 33. Performance

Targets:

- Fast initial dashboard rendering
- Code splitting
- Lazy-load heavy charts
- Paginate large expense tables
- Debounce search
- Avoid unnecessary refetches
- Cache stable reference data

---

# 34. Testing

## Unit Tests

Test:

- Form validation
- Currency formatting
- Status formatting
- UI utility functions

## Component Tests

Test:

- Meal form
- Expense form
- Settlement table
- Invitation dialog

## E2E Tests

Critical flow:

```text
Register
→ Create Basa
→ Invite Roommate
→ Log Meals
→ Add Bazaar Expense
→ Add Deposit
→ View Settlement
```

Also test unauthorized actions.

---

# 35. Acceptance Criteria

The frontend is complete when:

- Users can register/login
- New users can create/join a Basa
- Managers can invite roommates
- Users can log meals
- Expenses can be recorded
- Deposits can be recorded
- Settlement data can be viewed
- Monthly reports can be generated/downloaded
- Role-based UI is enforced
- Responsive design works on mobile/tablet/desktop
- Loading/error/empty states exist
- Critical flows have automated tests
