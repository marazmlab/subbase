import { useId } from "react";
import { Plus } from "lucide-react";

import { DashboardProvider, useDashboard } from "@/lib/contexts/DashboardContext";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "./TopBar";
import { SummarySection } from "./SummarySection";
import { SubscriptionList } from "./SubscriptionList";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { SubscriptionFormModal } from "./SubscriptionFormModal";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

function DashboardContent() {
  const {
    subscriptions,
    summary,
    pagination,
    isLoading,
    isSummaryLoading,
    aiInsights,
    isGeneratingInsights,
    aiError,
    formModal,
    deleteDialog,
    openCreateModal,
    openEditModal,
    openDeleteDialog,
    closeFormModal,
    closeDeleteDialog,
    deleteSubscription,
    setPage,
    generateInsights,
  } = useDashboard();

  const subscriptionsSectionId = useId();

  const showEmptyState = !isLoading && subscriptions.length === 0;
  const showSubscriptionList = !isLoading && subscriptions.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <main className="container py-6" aria-label="Dashboard">
        <div className="space-y-8">
          {/* Summary Section */}
          <SummarySection summary={summary} isLoading={isSummaryLoading} />

          {/* Subscriptions Section */}
          <section aria-labelledby={subscriptionsSectionId} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id={subscriptionsSectionId} className="text-lg font-semibold">
                Twoje subskrypcje
              </h2>
              {showSubscriptionList && (
                <Button onClick={openCreateModal} size="sm">
                  <Plus className="size-4" />
                  Dodaj subskrypcję
                </Button>
              )}
            </div>

            {showEmptyState && <EmptyState onAddClick={openCreateModal} />}

            {showSubscriptionList && (
              <>
                <SubscriptionList
                  subscriptions={subscriptions}
                  isLoading={isLoading}
                  onEdit={openEditModal}
                  onDelete={openDeleteDialog}
                />
                <Pagination pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
              </>
            )}

            {isLoading && (
              <SubscriptionList
                subscriptions={[]}
                isLoading={true}
                onEdit={() => {
                  /* noop - skeleton shown when loading */
                }}
                onDelete={() => {
                  /* noop - skeleton shown when loading */
                }}
              />
            )}
          </section>

          {/* AI Insights Section */}
          <AiInsightsPanel
            subscriptions={subscriptions}
            aiInsights={aiInsights}
            isGenerating={isGeneratingInsights}
            error={aiError}
            onGenerateInsights={generateInsights}
          />
        </div>
      </main>

      {/* Modals */}
      <SubscriptionFormModal
        isOpen={formModal.isOpen}
        onClose={closeFormModal}
        editingSubscription={formModal.editingSubscription}
      />

      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        subscription={deleteDialog.subscription}
        onClose={closeDeleteDialog}
        onConfirm={() =>
          deleteDialog.subscription
            ? deleteSubscription(deleteDialog.subscription.id)
            : Promise.resolve()
        }
        isDeleting={deleteDialog.isDeleting}
      />

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

export function DashboardLayout() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
