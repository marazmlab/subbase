import type {
  SubscriptionDTO,
  SubscriptionSummaryDTO,
  PaginationDTO,
  AIInsightsDataDTO,
  BillingCycle,
  SubscriptionStatus,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  SubscriptionQueryParams,
} from "@/types";

// ============================================================================
// Form ViewModel Types
// ============================================================================

/**
 * Wartości formularza subskrypcji (ViewModel)
 * cost jest stringiem dla kontroli inputa, konwertowane na number przy submit
 */
export interface SubscriptionFormValues {
  name: string;
  cost: string;
  currency: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  start_date: string;
  next_billing_date: string;
  description: string;
}

/** Błędy walidacji formularza */
export type SubscriptionFormErrors = Partial<Record<keyof SubscriptionFormValues, string>>;

/** Domyślne wartości formularza */
export const defaultFormValues: SubscriptionFormValues = {
  name: "",
  cost: "",
  currency: "PLN",
  billing_cycle: "monthly",
  status: "active",
  start_date: new Date().toISOString().split("T")[0],
  next_billing_date: "",
  description: "",
};

// ============================================================================
// Conversion Functions
// ============================================================================

/** Konwersja z SubscriptionDTO do SubscriptionFormValues */
export function subscriptionToFormValues(dto: SubscriptionDTO): SubscriptionFormValues {
  return {
    name: dto.name,
    cost: dto.cost.toString(),
    currency: dto.currency,
    billing_cycle: dto.billing_cycle,
    status: dto.status,
    start_date: dto.start_date,
    next_billing_date: dto.next_billing_date ?? "",
    description: dto.description ?? "",
  };
}

/** Konwersja z SubscriptionFormValues do CreateSubscriptionCommand */
export function formValuesToCreateCommand(values: SubscriptionFormValues): CreateSubscriptionCommand {
  return {
    name: values.name.trim(),
    cost: parseFloat(values.cost),
    currency: values.currency,
    billing_cycle: values.billing_cycle,
    status: values.status,
    start_date: values.start_date,
    next_billing_date: values.next_billing_date || null,
    description: values.description.trim() || null,
  };
}

/** Konwersja z SubscriptionFormValues do UpdateSubscriptionCommand */
export function formValuesToUpdateCommand(values: SubscriptionFormValues): UpdateSubscriptionCommand {
  return {
    name: values.name.trim(),
    cost: parseFloat(values.cost),
    currency: values.currency,
    billing_cycle: values.billing_cycle,
    status: values.status,
    start_date: values.start_date,
    next_billing_date: values.next_billing_date || null,
    description: values.description.trim() || null,
  };
}

// ============================================================================
// Dashboard State Types
// ============================================================================

/** Główny stan dashboardu (dla DashboardContext) */
export interface DashboardState {
  // Dane
  subscriptions: SubscriptionDTO[];
  summary: SubscriptionSummaryDTO | null;
  pagination: PaginationDTO;

  // Stany ładowania
  isLoading: boolean;
  isSummaryLoading: boolean;

  // Błędy
  error: string | null;

  // AI Insights
  aiInsights: AIInsightsDataDTO | null;
  isGeneratingInsights: boolean;
  aiError: string | null;

  // Modal/Dialog
  formModal: {
    isOpen: boolean;
    mode: "create" | "edit";
    editingSubscription: SubscriptionDTO | null;
  };
  deleteDialog: {
    isOpen: boolean;
    subscription: SubscriptionDTO | null;
    isDeleting: boolean;
  };
}

/** Początkowy stan dashboardu */
export const initialDashboardState: DashboardState = {
  subscriptions: [],
  summary: null,
  pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
  isLoading: true,
  isSummaryLoading: true,
  error: null,
  aiInsights: null,
  isGeneratingInsights: false,
  aiError: null,
  formModal: { isOpen: false, mode: "create", editingSubscription: null },
  deleteDialog: { isOpen: false, subscription: null, isDeleting: false },
};

// ============================================================================
// Context Types
// ============================================================================

/** Wartość DashboardContext */
export interface DashboardContextValue extends DashboardState {
  // Akcje CRUD
  fetchSubscriptions: (params?: SubscriptionQueryParams) => Promise<void>;
  fetchSummary: () => Promise<void>;
  createSubscription: (data: CreateSubscriptionCommand) => Promise<SubscriptionDTO>;
  updateSubscription: (id: string, data: UpdateSubscriptionCommand) => Promise<SubscriptionDTO>;
  deleteSubscription: (id: string) => Promise<void>;

  // Akcje paginacji
  setPage: (page: number) => void;

  // Akcje AI
  generateInsights: (subscriptionIds?: string[]) => Promise<void>;

  // Akcje modali
  openCreateModal: () => void;
  openEditModal: (subscription: SubscriptionDTO) => void;
  closeFormModal: () => void;
  openDeleteDialog: (subscription: SubscriptionDTO) => void;
  closeDeleteDialog: () => void;
}

// ============================================================================
// Action Types (for reducer)
// ============================================================================

export type DashboardAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SUMMARY_LOADING"; payload: boolean }
  | { type: "SET_SUBSCRIPTIONS"; payload: { subscriptions: SubscriptionDTO[]; pagination: PaginationDTO } }
  | { type: "SET_SUMMARY"; payload: SubscriptionSummaryDTO }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_SUBSCRIPTION"; payload: SubscriptionDTO }
  | { type: "UPDATE_SUBSCRIPTION"; payload: SubscriptionDTO }
  | { type: "REMOVE_SUBSCRIPTION"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_AI_INSIGHTS"; payload: AIInsightsDataDTO }
  | { type: "SET_GENERATING_INSIGHTS"; payload: boolean }
  | { type: "SET_AI_ERROR"; payload: string | null }
  | { type: "OPEN_CREATE_MODAL" }
  | { type: "OPEN_EDIT_MODAL"; payload: SubscriptionDTO }
  | { type: "CLOSE_FORM_MODAL" }
  | { type: "OPEN_DELETE_DIALOG"; payload: SubscriptionDTO }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "SET_DELETING"; payload: boolean };
