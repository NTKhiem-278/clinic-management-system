import type { Medicine, MedicineInput } from "@/backend";
import { UserRole } from "@/backend";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/DataStates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  useCallerRole,
  useCreateMedicine,
  useMedicines,
  useUpdateMedicine,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import {
  AlertTriangle,
  CalendarClock,
  PackagePlus,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

const LOW_STOCK_THRESHOLD = 10n;

const EXPIRED_LABEL = "Đã hết hạn";
const IN_STOCK_LABEL = "Còn hàng";

type Draft = {
  name: string;
  unit: string;
  unitPrice: string;
  stockQuantity: string;
  expiryDate: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  unit: "",
  unitPrice: "",
  stockQuantity: "",
  expiryDate: "",
};

function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
}

function formatExpiry(expiryDate: string): string {
  if (!expiryDate) return vi.common.notAvailable;
  const date = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return expiryDate;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toInput(draft: Draft): MedicineInput {
  return {
    name: draft.name.trim(),
    unit: draft.unit.trim(),
    unitPrice: BigInt(Math.max(0, Math.trunc(Number(draft.unitPrice) || 0))),
    stockQuantity: BigInt(
      Math.max(0, Math.trunc(Number(draft.stockQuantity) || 0)),
    ),
    expiryDate: draft.expiryDate,
  };
}

function MedicineFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Medicine | null;
}) {
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const pending = createMedicine.isPending || updateMedicine.isPending;
  const canSubmit =
    draft.name.trim().length > 0 &&
    draft.unit.trim().length > 0 &&
    draft.expiryDate.length > 0 &&
    !pending;

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(
        editing
          ? {
              name: editing.name,
              unit: editing.unit,
              unitPrice: editing.unitPrice.toString(),
              stockQuantity: editing.stockQuantity.toString(),
              expiryDate: editing.expiryDate,
            }
          : EMPTY_DRAFT,
      );
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const input = toInput(draft);
    setError(null);
    const onError = (err: unknown) => {
      setError(err instanceof Error ? err.message : vi.common.errorBody);
    };
    if (editing) {
      updateMedicine.mutate(
        { id: editing.id, input },
        { onSuccess: () => onOpenChange(false), onError },
      );
    } else {
      createMedicine.mutate(input, {
        onSuccess: () => onOpenChange(false),
        onError,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-ocid="medicine.modal">
        <DialogHeader>
          <DialogTitle>
            {editing ? vi.common.edit : vi.medicines.add}
          </DialogTitle>
          <DialogDescription>{vi.medicines.subtitle}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicine-name">{vi.medicines.name}</Label>
            <Input
              id="medicine-name"
              data-ocid="medicine.name_input"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicine-unit">{vi.medicines.unit}</Label>
              <Input
                id="medicine-unit"
                data-ocid="medicine.unit_input"
                value={draft.unit}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, unit: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-price">{vi.medicines.unitPrice}</Label>
              <Input
                id="medicine-price"
                data-ocid="medicine.unit_price_input"
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.unitPrice}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, unitPrice: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-stock">
                {vi.medicines.stockQuantity}
              </Label>
              <Input
                id="medicine-stock"
                data-ocid="medicine.stock_input"
                type="number"
                min={0}
                inputMode="numeric"
                value={draft.stockQuantity}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, stockQuantity: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medicine-expiry">{vi.medicines.expiryDate}</Label>
              <Input
                id="medicine-expiry"
                data-ocid="medicine.expiry_input"
                type="date"
                value={draft.expiryDate}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, expiryDate: e.target.value }))
                }
                required
              />
            </div>
          </div>
          {error && (
            <p
              data-ocid="medicine.form_error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="medicine.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              {vi.common.cancel}
            </Button>
            <Button
              type="submit"
              data-ocid="medicine.submit_button"
              disabled={!canSubmit}
            >
              {pending ? vi.common.loading : vi.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MedicinesPage() {
  const { data, isLoading, isError, refetch } = useMedicines();
  const callerRole = useCallerRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  const canManage = callerRole.data === UserRole.admin;
  const medicines = data ?? [];

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(medicine: Medicine) {
    setEditing(medicine);
    setDialogOpen(true);
  }

  return (
    <>
      <PageHeader
        title={vi.medicines.title}
        subtitle={vi.medicines.subtitle}
        actions={
          canManage ? (
            <Button
              type="button"
              data-ocid="medicine.add_button"
              onClick={openCreate}
            >
              <PackagePlus aria-hidden="true" />
              {vi.medicines.add}
            </Button>
          ) : undefined
        }
      />

      <section className="rounded-lg border border-border bg-card shadow-subtle">
        {isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : medicines.length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.medicines.empty}
            action={
              canManage ? (
                <Button
                  type="button"
                  data-ocid="medicine.empty_add_button"
                  onClick={openCreate}
                >
                  <PackagePlus aria-hidden="true" />
                  {vi.medicines.add}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table
              data-ocid="medicines.table"
              className="w-full min-w-[720px] border-collapse text-sm"
            >
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-semibold md:px-6">
                    {vi.medicines.name}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.medicines.unit}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold"
                  >
                    {vi.medicines.unitPrice}
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right font-semibold"
                  >
                    {vi.medicines.stockQuantity}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.medicines.expiryDate}
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    {vi.common.status}
                  </th>
                  {canManage && (
                    <th
                      scope="col"
                      className="px-4 py-3 text-right font-semibold md:px-6"
                    >
                      {vi.common.actions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {medicines.map((medicine, index) => {
                  const lowStock =
                    medicine.stockQuantity <= LOW_STOCK_THRESHOLD;
                  const expired = isExpired(medicine.expiryDate);
                  return (
                    <tr
                      key={medicine.id.toString()}
                      data-ocid={`medicines.row.${index + 1}`}
                      className="transition-smooth hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium text-foreground md:px-6">
                        {medicine.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {medicine.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {formatCurrency(medicine.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {medicine.stockQuantity.toString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatExpiry(medicine.expiryDate)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {expired ? (
                            <StatusBadge
                              label={EXPIRED_LABEL}
                              tone="cancelled"
                            />
                          ) : lowStock ? (
                            <StatusBadge
                              label={vi.medicines.lowStock}
                              tone="pending"
                            />
                          ) : (
                            <StatusBadge
                              label={IN_STOCK_LABEL}
                              tone="completed"
                            />
                          )}
                          {expired && (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-destructive"
                              title={EXPIRED_LABEL}
                            >
                              <AlertTriangle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              {EXPIRED_LABEL}
                            </span>
                          )}
                          {!expired && lowStock && (
                            <span
                              className="inline-flex items-center gap-1 text-xs text-warning"
                              title={vi.medicines.lowStock}
                            >
                              <CalendarClock
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              {vi.medicines.lowStock}
                            </span>
                          )}
                        </div>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right md:px-6">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-ocid={`medicine.edit_button.${index + 1}`}
                            onClick={() => openEdit(medicine)}
                          >
                            <Pencil aria-hidden="true" />
                            {vi.common.edit}
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canManage && (
        <MedicineFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
        />
      )}
    </>
  );
}
