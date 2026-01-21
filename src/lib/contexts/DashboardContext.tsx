import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type {
  SubscriptionDTO,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  SubscriptionQueryParams,
} from "@/types";
import type {
  DashboardState,
  DashboardContextValue,
  DashboardAction,
} from "@/types/dashboard.types";
import { initialDashboardState } from "@/types/dashboard.types";
import * as api from "@/lib/services/subscription-api.client";
import { ApiError } from "@/lib/services/subscription-api.client";

// ============================================================================
// Reducer
// ============================================================================

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_SUMMARY_LOADING":
      return { ...state, isSummaryLoading: action.payload };

    case "SET_SUBSCRIPTIONS":
      return {
        ...state,
        subscriptions: action.payload.subscriptions,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };

    case "SET_SUMMARY":
      return { ...state, summary: action.payload, isSummaryLoading: false };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "ADD_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: [action.payload, ...state.subscriptions],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      };

    case "UPDATE_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: state.subscriptions.map((sub) =>
          sub.id === action.payload.id ? action.payload : sub
        ),
      };

    case "REMOVE_SUBSCRIPTION":
      return {
        ...state,
        subscriptions: state.subscriptions.filter((sub) => sub.id !== action.payload),
        pagination: { ...state.pagination, total: Math.max(0, state.pagination.total - 1) },
      };

    case "SET_PAGE":
      return { ...state, pagination: { ...state.pagination, page: action.payload } };

    case "SET_AI_INSIGHTS":
      return { ...state, aiInsights: action.payload, isGeneratingInsights: false, aiError: null };

    case "SET_GENERATING_INSIGHTS":
      return { ...state, isGeneratingInsights: action.payload };

    case "SET_AI_ERROR":
      return { ...state, aiError: action.payload, isGeneratingInsights: false };

    case "OPEN_CREATE_MODAL":
      return {
        ...state,
        formModal: { isOpen: true, mode: "create", editingSubscription: null },
      };

    case "OPEN_EDIT_MODAL":
      return {
        ...state,
        formModal: { isOpen: true, mode: "edit", editingSubscription: action.payload },
      };

    case "CLOSE_FORM_MODAL":
      return {
        ...state,
        formModal: { isOpen: false, mode: "create", editingSubscription: null },
      };

    case "OPEN_DELETE_DIALOG":
      return {
        ...state,
        deleteDialog: { isOpen: true, subscription: action.payload, isDeleting: false },
      };

    case "CLOSE_DELETE_DIALOG":
      return {
        ...state,
        deleteDialog: { isOpen: false, subscription: null, isDeleting: false },
      };

    case "SET_DELETING":
      return {
        ...state,
        deleteDialog: { ...state.deleteDialog, isDeleting: action.payload },
      };

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  // Effect do obsługi przekierowania na login
  useEffect(() => {
    if (shouldRedirectToLogin) {
      window.location.href = "/login";
    }
  }, [shouldRedirectToLogin]);

  // Helper do obsługi błędów 401 - ustawia flagę przekierowania
  const handleAuthError = useCallback((error: unknown): boolean => {
    if (error instanceof ApiError && error.code === "UNAUTHORIZED") {
      toast.error("Sesja wygasła. Zaloguj się ponownie.");
      setShouldRedirectToLogin(true);
      return true;
    }
    return false;
  }, []);

  // ============================================================================
  // CRUD Actions
  // ============================================================================

  const fetchSubscriptions = useCallback(
    async (params?: SubscriptionQueryParams) => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const response = await api.fetchSubscriptions({
          page: params?.page ?? state.pagination.page,
          limit: params?.limit ?? state.pagination.limit,
          status: params?.status,
        });

        dispatch({
          type: "SET_SUBSCRIPTIONS",
          payload: { subscriptions: response.data, pagination: response.pagination },
        });
      } catch (error) {
        if (handleAuthError(error)) return;

        const message =
          error instanceof ApiError ? error.message : "Nie udało się pobrać subskrypcji";
        dispatch({ type: "SET_ERROR", payload: message });
        toast.error(message);
      }
    },
    [state.pagination.page, state.pagination.limit, handleAuthError]
  );

  const fetchSummary = useCallback(async () => {
    dispatch({ type: "SET_SUMMARY_LOADING", payload: true });

    try {
      const response = await api.fetchSummary();
      dispatch({ type: "SET_SUMMARY", payload: response.data });
    } catch (error) {
      if (handleAuthError(error)) return;
      // Nie pokazujemy toasta dla summary - nie blokuje funkcjonalności
      // Błąd jest ignorowany celowo - summary jest opcjonalne
    }
  }, [handleAuthError]);

  const createSubscription = useCallback(
    async (data: CreateSubscriptionCommand): Promise<SubscriptionDTO> => {
      try {
        const response = await api.createSubscription(data);
        dispatch({ type: "ADD_SUBSCRIPTION", payload: response.data });
        toast.success("Subskrypcja została dodana");

        // Odśwież summary
        fetchSummary();

        return response.data;
      } catch (error) {
        if (handleAuthError(error)) throw error;

        const message =
          error instanceof ApiError ? error.message : "Nie udało się dodać subskrypcji";
        toast.error(message);
        throw error;
      }
    },
    [handleAuthError, fetchSummary]
  );

  const updateSubscription = useCallback(
    async (id: string, data: UpdateSubscriptionCommand): Promise<SubscriptionDTO> => {
      try {
        const response = await api.updateSubscription(id, data);
        dispatch({ type: "UPDATE_SUBSCRIPTION", payload: response.data });
        toast.success("Subskrypcja została zaktualizowana");

        // Odśwież summary
        fetchSummary();

        return response.data;
      } catch (error) {
        if (handleAuthError(error)) throw error;

        if (error instanceof ApiError && error.code === "NOT_FOUND") {
          toast.error("Subskrypcja nie została znaleziona");
          fetchSubscriptions();
          throw error;
        }

        const message =
          error instanceof ApiError ? error.message : "Nie udało się zaktualizować subskrypcji";
        toast.error(message);
        throw error;
      }
    },
    [handleAuthError, fetchSummary, fetchSubscriptions]
  );

  const deleteSubscription = useCallback(
    async (id: string): Promise<void> => {
      dispatch({ type: "SET_DELETING", payload: true });

      try {
        await api.deleteSubscription(id);
        dispatch({ type: "REMOVE_SUBSCRIPTION", payload: id });
        dispatch({ type: "CLOSE_DELETE_DIALOG" });
        toast.success("Subskrypcja została usunięta");

        // Odśwież summary
        fetchSummary();
      } catch (error) {
        dispatch({ type: "SET_DELETING", payload: false });

        if (handleAuthError(error)) return;

        if (error instanceof ApiError && error.code === "NOT_FOUND") {
          toast.error("Subskrypcja nie została znaleziona");
          dispatch({ type: "CLOSE_DELETE_DIALOG" });
          fetchSubscriptions();
          return;
        }

        const message =
          error instanceof ApiError ? error.message : "Nie udało się usunąć subskrypcji";
        toast.error(message);
      }
    },
    [handleAuthError, fetchSummary, fetchSubscriptions]
  );

  // ============================================================================
  // Pagination
  // ============================================================================

  const setPage = useCallback(
    (page: number) => {
      dispatch({ type: "SET_PAGE", payload: page });
      fetchSubscriptions({ page });
    },
    [fetchSubscriptions]
  );

  // ============================================================================
  // AI Insights
  // ============================================================================

  const generateInsights = useCallback(
    async (subscriptionIds?: string[]) => {
      dispatch({ type: "SET_GENERATING_INSIGHTS", payload: true });
      dispatch({ type: "SET_AI_ERROR", payload: null });

      try {
        const response = await api.generateInsights(
          subscriptionIds ? { subscription_ids: subscriptionIds } : undefined
        );
        dispatch({ type: "SET_AI_INSIGHTS", payload: response.data });
      } catch (error) {
        if (handleAuthError(error)) return;

        if (error instanceof ApiError && error.code === "AI_SERVICE_UNAVAILABLE") {
          dispatch({
            type: "SET_AI_ERROR",
            payload: "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie później.",
          });
          return;
        }

        const message =
          error instanceof ApiError ? error.message : "Nie udało się wygenerować wglądów AI";
        dispatch({ type: "SET_AI_ERROR", payload: message });
      }
    },
    [handleAuthError]
  );

  // ============================================================================
  // Modal Actions
  // ============================================================================

  const openCreateModal = useCallback(() => {
    dispatch({ type: "OPEN_CREATE_MODAL" });
  }, []);

  const openEditModal = useCallback((subscription: SubscriptionDTO) => {
    dispatch({ type: "OPEN_EDIT_MODAL", payload: subscription });
  }, []);

  const closeFormModal = useCallback(() => {
    dispatch({ type: "CLOSE_FORM_MODAL" });
  }, []);

  const openDeleteDialog = useCallback((subscription: SubscriptionDTO) => {
    dispatch({ type: "OPEN_DELETE_DIALOG", payload: subscription });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    dispatch({ type: "CLOSE_DELETE_DIALOG" });
  }, []);

  // ============================================================================
  // Initial Load
  // ============================================================================

  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    if (isInitialLoadDone.current) return;
    isInitialLoadDone.current = true;

    fetchSubscriptions();
    fetchSummary();
  }, [fetchSubscriptions, fetchSummary]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: DashboardContextValue = {
    ...state,
    fetchSubscriptions,
    fetchSummary,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    setPage,
    generateInsights,
    openCreateModal,
    openEditModal,
    closeFormModal,
    openDeleteDialog,
    closeDeleteDialog,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }

  return context;
}
