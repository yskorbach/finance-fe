"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Variant = "default" | "destructive";

export interface ConfirmDialogProps {
  /** Tryb kontrolowany (opcjonalny). Gdy pominięte – dialog otwiera się sam. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Treść nagłówka/opisu albo własna zawartość środka. */
  title: string;
  description?: string;
  customContent?: React.ReactNode;

  /** Teksty przycisków i wariant. */
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;

  /** Handlery akcji. */
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;

  /** UI opcje. */
  loading?: boolean;     // zewnętrzny loading
  hideCancel?: boolean;  // ukryj przycisk Cancel
}

export function ConfirmDialog({
                                open,
                                onOpenChange,
                                title,
                                description,
                                customContent,
                                confirmText = "Confirm",
                                cancelText = "Cancel",
                                variant = "default",
                                onCancel,
                                onConfirm,
                                loading,
                                hideCancel = false,
                              }: ConfirmDialogProps) {
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = React.useState(true); // niekontrolowany: startuj otwarty
  const [internalLoading, setInternalLoading] = React.useState(false);

  const actualOpen = isControlled ? (open as boolean) : internalOpen;
  const isLoading = Boolean(loading ?? internalLoading);

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel?.();
    }
    onOpenChange?.(nextOpen);
    if (!isControlled) setInternalOpen(nextOpen);
  };

  const handleConfirm = async () => {
    try {
      const ret = onConfirm();
      if (ret instanceof Promise) {
        setInternalLoading(true);
        await ret;
      }
    } finally {
      setInternalLoading(false);
      close(false);
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {customContent ? null : description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {/* Własna zawartość, jeśli podana */}
        {customContent ?? null}

        <DialogFooter>
          {!hideCancel && (
            <Button type="button" variant="ghost" onClick={() => close(false)} disabled={isLoading}>
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Working…" : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
