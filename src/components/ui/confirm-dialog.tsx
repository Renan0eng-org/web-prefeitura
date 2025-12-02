"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog"

type ConfirmDialogProps = {
  open: boolean
  title?: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  intent?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Confirmação',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  intent = 'destructive',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {description && <div className="text-sm text-muted-foreground">{description}</div>}

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
            <Button className={cn(intent === 'destructive' ? 'bg-destructive text-white' : '')} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
