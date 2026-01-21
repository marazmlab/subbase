import { useEffect, useCallback } from "react";

import type { SubscriptionDTO } from "@/types";
import type { SubscriptionFormValues } from "@/types/dashboard.types";
import {
  subscriptionToFormValues,
  formValuesToCreateCommand,
  formValuesToUpdateCommand,
} from "@/types/dashboard.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscriptionForm } from "@/lib/hooks/useSubscriptionForm";
import { useDashboard } from "@/lib/contexts/DashboardContext";
import { SubscriptionForm } from "./SubscriptionForm";

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSubscription: SubscriptionDTO | null;
}

export function SubscriptionFormModal({
  isOpen,
  onClose,
  editingSubscription,
}: SubscriptionFormModalProps) {
  const { createSubscription, updateSubscription } = useDashboard();

  const isEditMode = !!editingSubscription;

  const handleSubmit = useCallback(
    async (values: SubscriptionFormValues) => {
      if (isEditMode && editingSubscription) {
        const command = formValuesToUpdateCommand(values);
        await updateSubscription(editingSubscription.id, command);
      } else {
        const command = formValuesToCreateCommand(values);
        await createSubscription(command);
      }

      onClose();
    },
    [isEditMode, editingSubscription, createSubscription, updateSubscription, onClose]
  );

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit: onSubmit,
    reset,
  } = useSubscriptionForm({
    initialValues: editingSubscription ? subscriptionToFormValues(editingSubscription) : undefined,
    onSubmit: handleSubmit,
  });

  // Reset form when modal opens/closes or subscription changes
  useEffect(() => {
    if (isOpen) {
      reset(editingSubscription ? subscriptionToFormValues(editingSubscription) : undefined);
    }
  }, [isOpen, editingSubscription, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj subskrypcję" : "Dodaj nową subskrypcję"}</DialogTitle>
        </DialogHeader>

        <SubscriptionForm
          values={values}
          errors={errors}
          touched={touched}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onBlur={handleBlur}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={isEditMode ? "Zapisz zmiany" : "Dodaj subskrypcję"}
        />
      </DialogContent>
    </Dialog>
  );
}
