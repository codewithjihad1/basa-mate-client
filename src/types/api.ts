/**
 * Types for the BasaMate REST API (docs/API.md).
 *
 * Two conventions from the API are load-bearing here:
 *  - Money and meal quantities are serialized as *strings* (SQL numeric) to avoid
 *    float rounding. They are typed as `string` and must go through `parseMoney`/
 *    `formatMoney` rather than arithmetic on the raw value.
 *  - `memberId` means different things per endpoint: `POST /meals` takes a **user id**,
 *    while deposits and expense allocations take a **member id** (docs/API.md §IDs).
 *    The branded aliases below keep that straight at call sites.
 */

/** `User.id` — the account. */
export type UserId = string;
/** `BasaMember.id` — a user's membership of one basa. */
export type MemberId = string;
export type BasaId = string;
export type CycleId = string;

/** Money as returned by the API: a numeric string such as `"1200"` or `"350.50"`. */
export type MoneyString = string;

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    details: ValidationIssue[] | Record<string, unknown> | null;
  };
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_NOT_VERIFIED"
  | "BASA_NOT_FOUND"
  | "BASA_ACCESS_DENIED"
  | "MEMBER_NOT_FOUND"
  | "INVITATION_EXPIRED"
  | "INVITATION_ALREADY_USED"
  | "CYCLE_NOT_FOUND"
  | "CYCLE_CLOSED"
  | "INVALID_MEAL"
  | "INVALID_EXPENSE"
  | "INVALID_ALLOCATION"
  | "INSUFFICIENT_PERMISSION"
  | "SETTLEMENT_NOT_FOUND"
  | "SETTLEMENT_ALREADY_FINALIZED"
  | "SUBSCRIPTION_LIMIT_REACHED"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface AuthUser {
  id: UserId;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  avatarUrl: string | null;
  timezone: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  /** Seconds until the access token expires (default 900). */
  expiresIn: number;
}

export interface AuthSession {
  user: Pick<AuthUser, "id" | "name" | "email"> & Partial<AuthUser>;
  tokens: AuthTokens;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Basas
// ---------------------------------------------------------------------------

export type BasaRole = "OWNER" | "MANAGER" | "MEMBER" | "VIEWER";
export type MembershipStatus = "ACTIVE" | "INACTIVE";
export type BasaStatus = "ACTIVE" | "ARCHIVED";

export interface MealType {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface BasaMember {
  id: MemberId;
  basaId?: BasaId;
  userId: UserId;
  role: BasaRole;
  status: MembershipStatus;
  joinedAt: string;
  leftAt: string | null;
  user?: {
    id: UserId;
    name: string;
    email: string;
    emailVerifiedAt?: string | null;
    status?: UserStatus;
  };
}

export interface Basa {
  id: BasaId;
  name: string;
  location: string | null;
  currency: string;
  /** Day of month (1–28) the billing cycle rolls over. */
  cycleStartDay: number;
  status: BasaStatus;
  deletedAt?: string | null;
  members?: BasaMember[];
  mealTypes?: MealType[];
  expenseCategories?: ExpenseCategory[];
  _count?: { members: number; cycles: number };
}

/** A row of `GET /basas` — the membership, with the basa embedded. */
export interface BasaMembershipSummary {
  role: BasaRole;
  joinedAt: string;
  basa: Basa;
}

export interface CreateBasaInput {
  name: string;
  location?: string;
  currency?: string;
  cycleStartDay?: number;
}

export type UpdateBasaInput = Partial<CreateBasaInput>;

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

export interface Invitation {
  id: string;
  email: string;
  role: BasaRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface CreateInvitationInput {
  email: string;
  role?: BasaRole;
  expiresInDays?: number;
}

// ---------------------------------------------------------------------------
// Billing cycles
// ---------------------------------------------------------------------------

export type CycleStatus = "ACTIVE" | "CLOSED" | "REOPENED";

export interface BillingCycle {
  id: CycleId;
  basaId: BasaId;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  closedAt: string | null;
  closedBy: UserId | null;
  _count?: { meals: number; expenses: number; deposits: number };
  settlement?: Settlement | null;
}

export interface CreateCycleInput {
  startDate: string;
  endDate?: string;
}

/** `GET /cycles/:cycleId/dashboard` — cycle totals for the summary screen. */
export interface CycleDashboard {
  members: number;
  totalMeals: MoneyString;
  totalGroceryCost: MoneyString;
  /** `0` until a settlement has been generated. */
  mealRate: number | MoneyString;
  sharedExpenses: MoneyString;
  totalDeposits: MoneyString;
}

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

export interface MealEntry {
  id: string;
  date: string;
  quantity: MoneyString;
  note: string | null;
  memberId: MemberId;
  mealTypeId: string;
  mealType?: { name: string };
  member?: { user: { name: string; email: string } };
}

export interface CreateMealInput {
  /** ⚠️ The **user id** of the eater, not the member id (docs/API.md §IDs). */
  memberId: UserId;
  date: string;
  entries: Array<{ mealTypeId: string; quantity: number }>;
}

export interface UpdateMealInput {
  quantity: number;
  note?: string;
}

export interface MealListParams {
  from?: string;
  to?: string;
  /** Member id (not user id) — the list filter differs from the create payload. */
  memberId?: MemberId;
  mealTypeId?: string;
}

export interface MealSummary {
  items: Array<{
    memberId: MemberId;
    userId: UserId;
    name: string;
    totalMeals: number;
  }>;
  totalMeals: number;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export type ExpenseType = "GROCERY" | "SHARED" | "OTHER";
export type AllocationMethod = "EQUAL" | "CUSTOM_AMOUNT" | "PERCENTAGE";

export interface ExpenseAllocation {
  id: string;
  expenseId: string;
  memberId: MemberId;
  amount: MoneyString;
  percentage: MoneyString | null;
  member?: { id: MemberId; user: { id: UserId; name: string } };
}

export interface Expense {
  id: string;
  basaId: BasaId;
  cycleId: CycleId;
  type: ExpenseType;
  amount: MoneyString;
  date: string;
  description: string | null;
  categoryId: string | null;
  paidByMemberId: MemberId | null;
  receiptUrl: string | null;
  notes: string | null;
  allocationMethod: AllocationMethod | null;
  softDeleted?: boolean;
  category?: ExpenseCategory | null;
  paidBy?: { id: MemberId; user: { id: UserId; name: string } } | null;
  allocations?: ExpenseAllocation[];
}

export interface ExpenseAllocationInput {
  memberId: MemberId;
  amount?: number;
  percentage?: number;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  type?: ExpenseType;
  description?: string;
  categoryId?: string;
  paidByMemberId?: MemberId;
  receiptUrl?: string;
  notes?: string;
  /** Required when `type` is `SHARED`. */
  allocationMethod?: AllocationMethod;
  /** Required and non-empty when `type` is `SHARED`. Sending it replaces the whole set. */
  allocations?: ExpenseAllocationInput[];
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseListParams extends PaginationParams {
  from?: string;
  to?: string;
  categoryId?: string;
  /** Member id of the payer. */
  paidBy?: MemberId;
  type?: ExpenseType;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

export type PaymentMethod = "CASH" | "BKASH" | "NAGAD" | "BANK" | "OTHER";

export interface Deposit {
  id: string;
  basaId: BasaId;
  cycleId: CycleId;
  memberId: MemberId;
  amount: MoneyString;
  paymentMethod: PaymentMethod;
  reference: string | null;
  notes: string | null;
  recordedBy: UserId;
  transactionDate: string;
  softDeleted: boolean;
  member?: { id: MemberId; role: BasaRole; user: { name: string } };
}

export interface CreateDepositInput {
  /** ⚠️ The **member id**, not the user id (docs/API.md §IDs). */
  memberId: MemberId;
  amount: number;
  paymentMethod?: PaymentMethod;
  reference?: string;
  notes?: string;
  transactionDate?: string;
}

export type UpdateDepositInput = Partial<CreateDepositInput>;

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

export type SettlementStatus = "GENERATED" | "FINALIZED" | "RECALCULATING";
export type SettlementItemStatus = "REFUND" | "PAYMENT_DUE" | "SETTLED";

export interface SettlementPayment {
  id: string;
  amount: MoneyString;
  paidAt: string;
  paymentMethod?: PaymentMethod;
  notes?: string | null;
}

export interface SettlementItem {
  id: string;
  memberId: MemberId;
  initialDeposit: MoneyString;
  totalMeals: MoneyString;
  foodCost: MoneyString;
  individualShare: MoneyString;
  totalCost: MoneyString;
  /** `initialDeposit - totalCost`. Positive = refund, negative = due. */
  finalBalance: MoneyString;
  status: SettlementItemStatus;
  settledAmount: MoneyString;
  remainingAmount: MoneyString;
  member?: { id: MemberId; role: BasaRole; user: { id: UserId; name: string } };
  payments?: SettlementPayment[];
}

export interface Settlement {
  id: string;
  basaId: BasaId;
  cycleId: CycleId;
  status: SettlementStatus;
  mealRate: MoneyString;
  totalMeals: MoneyString;
  totalGroceryCost: MoneyString;
  totalSharedExpenses: MoneyString;
  generatedAt: string;
  generatedBy: UserId;
  finalizedAt: string | null;
  finalizedBy: UserId | null;
  items?: SettlementItem[];
  cycle?: BillingCycle;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface CycleReport {
  cycle: BillingCycle;
  settlement: Settlement | null;
  expenses: Expense[];
  meals: Array<{ memberId: MemberId; _sum: { quantity: MoneyString } }>;
  deposits: Array<{ memberId: MemberId; totalDeposited: MoneyString }>;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType =
  | "INVITATION"
  | "MEAL_REMINDER"
  | "EXPENSE"
  | "SETTLEMENT"
  | "PAYMENT_DUE"
  | "REFUND"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

export interface NotificationList extends Paginated<AppNotification> {
  /** Always the count of *all* unread notifications, ignoring the current page. */
  unreadCount: number;
}
