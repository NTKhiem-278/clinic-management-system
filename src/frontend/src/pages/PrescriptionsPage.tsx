import { UserRole } from "@/backend";
import type { Id } from "@/backend";
import {
  EmptyState,
  ErrorState,
  LoadingState,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatTimestamp,
  useAddDetail,
  useCalculateTotalItems,
  useCallerRole,
  useCreatePrescription,
  useDoctors,
  useMedicines,
  usePatients,
  usePrescription,
  usePrescriptions,
  useRecords,
  useRemoveDetail,
  useUpdateDosage,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Calculator, Plus, Printer, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

/** Caller roles allowed to manage prescriptions (guests are read-only). */
const MANAGER_ROLES = new Set<UserRole>([UserRole.admin, UserRole.user]);

/** Parse a dosage string such as "2 viên x 3 lần/ngày" into a daily unit count. */
function parseDosageUnits(dosage: string): number {
  const matches = dosage.match(/\d+(?:[.,]\d+)?/g);
  if (!matches || matches.length === 0) return 0;
  return matches.reduce((total, raw) => {
    const value = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(value) ? total + value : total;
  }, 0);
}

/** Quantity needed = dosage units per day × number of days. */
function calculateQuantity(dosage: string, days: number): number {
  const perDay = parseDosageUnits(dosage);
  if (perDay <= 0 || days <= 0) return 0;
  return Math.ceil(perDay * days);
}

export function PrescriptionsPage() {
  const { data, isLoading, isError, refetch } = usePrescriptions();
  const { data: callerRole } = useCallerRole();
  const [selectedId, setSelectedId] = useState<Id | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const canManage = callerRole ? MANAGER_ROLES.has(callerRole) : false;
  const prescriptions = data ?? [];
  const activeId = selectedId ?? prescriptions[0]?.id;

  return (
    <>
      <PageHeader
        title={vi.prescriptions.title}
        subtitle={vi.prescriptions.subtitle}
        badge={
          canManage ? undefined : <StatusBadge label="Chỉ xem" tone="neutral" />
        }
        actions={
          canManage ? (
            <Button
              type="button"
              data-ocid="prescriptions.open_modal_button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md"
            >
              <Plus className="size-4" aria-hidden="true" />
              {vi.prescriptions.add}
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <section className="rounded-lg border border-border bg-card shadow-subtle">
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        </section>
      ) : isLoading ? (
        <section className="rounded-lg border border-border bg-card shadow-subtle">
          <TableSkeleton rows={5} cols={4} />
        </section>
      ) : prescriptions.length === 0 ? (
        <section className="rounded-lg border border-border bg-card shadow-subtle">
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.prescriptions.empty}
            action={
              canManage ? (
                <Button
                  type="button"
                  data-ocid="prescriptions.empty_state.add_button"
                  onClick={() => setCreateOpen(true)}
                  className="rounded-md"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {vi.prescriptions.add}
                </Button>
              ) : undefined
            }
          />
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <section
            aria-label={vi.prescriptions.title}
            className="rounded-lg border border-border bg-card shadow-subtle"
          >
            <ul
              data-ocid="prescriptions.list"
              className="max-h-[32rem] divide-y divide-border overflow-y-auto"
            >
              {prescriptions.map((p, index) => {
                const active = p.id === activeId;
                return (
                  <li key={p.id.toString()}>
                    <button
                      type="button"
                      data-ocid={`prescriptions.item.${index + 1}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        "chart-stripe flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring md:px-5",
                        active ? "bg-muted" : "hover:bg-muted/50",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm text-foreground">
                          #{p.id.toString()}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.notes || vi.common.notAvailable}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimestamp(p.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {activeId !== undefined && (
            <PrescriptionDetailPanel
              key={activeId.toString()}
              prescriptionId={activeId}
              canManage={canManage}
            />
          )}
        </div>
      )}

      {canManage && (
        <CreatePrescriptionDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(id) => setSelectedId(id)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Detail panel                                                        */
/* ------------------------------------------------------------------ */

function PrescriptionDetailPanel({
  prescriptionId,
  canManage,
}: {
  prescriptionId: Id;
  canManage: boolean;
}) {
  const { data, isLoading, isError, refetch } = usePrescription(prescriptionId);
  const { data: totalItems } = useCalculateTotalItems(prescriptionId);
  const { data: medicines } = useMedicines();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const removeDetail = useRemoveDetail();
  const [addOpen, setAddOpen] = useState(false);

  const medicineName = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of medicines ?? []) map.set(m.id.toString(), m.name);
    return map;
  }, [medicines]);

  const patientName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients ?? []) map.set(p.id.toString(), p.fullName);
    return map;
  }, [patients]);

  const doctorName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of doctors ?? []) map.set(d.id.toString(), d.fullName);
    return map;
  }, [doctors]);

  if (isError) {
    return (
      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <ErrorState
          title={vi.common.errorTitle}
          body={vi.common.errorBody}
          retryLabel={vi.common.retry}
          onRetry={() => void refetch()}
        />
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <TableSkeleton rows={4} cols={4} />
      </section>
    );
  }

  const details = data.details;
  const totalQuantity = details.reduce((sum, d) => sum + Number(d.quantity), 0);

  return (
    <section
      data-ocid="prescriptions.detail.panel"
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-subtle md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {vi.prescriptions.code} #{data.id.toString()}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {vi.prescriptions.patient}:{" "}
            <span className="text-foreground">
              {patientName.get(data.patientId.toString()) ??
                `#${data.patientId.toString()}`}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {vi.prescriptions.doctor}:{" "}
            <span className="text-foreground">
              {doctorName.get(data.doctorId.toString()) ??
                `#${data.doctorId.toString()}`}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {vi.records.code}:{" "}
            <span className="font-mono text-foreground">
              #{data.medicalRecordId.toString()}
            </span>
          </p>
          {data.notes && (
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              {data.notes}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="prescriptions.print_button"
            onClick={() => window.print()}
            className="rounded-md"
          >
            <Printer className="size-4" aria-hidden="true" />
            In đơn thuốc
          </Button>
          {canManage && (
            <Button
              type="button"
              data-ocid="prescriptions.add_detail_button"
              onClick={() => setAddOpen(true)}
              className="rounded-md"
            >
              <Plus className="size-4" aria-hidden="true" />
              Thêm thuốc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label={vi.prescriptions.totalItems}
          value={(totalItems ?? BigInt(details.length)).toString()}
          tone="accent"
        />
        <SummaryTile
          label="Số loại thuốc trong đơn"
          value={details.length.toString()}
        />
        <SummaryTile
          label="Tổng số lượng thuốc"
          value={totalQuantity.toString()}
          tone="success"
        />
      </div>

      {details.length === 0 ? (
        <EmptyState
          title="Đơn thuốc chưa có thuốc"
          body="Thêm thuốc và liều dùng để hoàn thiện đơn thuốc này."
          action={
            canManage ? (
              <Button
                type="button"
                data-ocid="prescriptions.detail.empty_state.add_button"
                onClick={() => setAddOpen(true)}
                className="rounded-md"
              >
                <Plus className="size-4" aria-hidden="true" />
                Thêm thuốc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table
            data-ocid="prescriptions.detail.table"
            className="w-full border-collapse text-sm"
          >
            <thead className="bg-muted/60">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2 font-semibold">
                  {vi.prescriptions.medicine}
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  {vi.prescriptions.dosage}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  {vi.prescriptions.quantity}
                </th>
                {canManage && (
                  <th
                    scope="col"
                    className="px-3 py-2 text-right font-semibold"
                  >
                    {vi.common.actions}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {details.map((d, index) => (
                <DetailRow
                  key={d.id.toString()}
                  index={index}
                  detailId={d.id}
                  medicineLabel={
                    medicineName.get(d.medicineId.toString()) ??
                    `#${d.medicineId.toString()}`
                  }
                  dosage={d.dosage}
                  quantity={d.quantity}
                  canManage={canManage}
                  onRemove={() => removeDetail.mutate(d.id)}
                  removing={
                    removeDetail.isPending && removeDetail.variables === d.id
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <AddDetailDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          prescriptionId={prescriptionId}
        />
      )}
    </section>
  );
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "success";
}) {
  const valueTone =
    tone === "accent"
      ? "text-accent"
      : tone === "success"
        ? "text-success"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-2xl font-bold tracking-tight",
          valueTone,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  index,
  detailId,
  medicineLabel,
  dosage,
  quantity,
  canManage,
  onRemove,
  removing,
}: {
  index: number;
  detailId: Id;
  medicineLabel: string;
  dosage: string;
  quantity: bigint;
  canManage: boolean;
  onRemove: () => void;
  removing: boolean;
}) {
  const updateDosage = useUpdateDosage();
  const [editing, setEditing] = useState(false);
  const [draftDosage, setDraftDosage] = useState(dosage);
  const [draftDays, setDraftDays] = useState("1");

  const previewQuantity = calculateQuantity(draftDosage, Number(draftDays));

  function startEdit() {
    setDraftDosage(dosage);
    setDraftDays("1");
    setEditing(true);
  }

  function save() {
    const nextQuantity = BigInt(Math.max(previewQuantity, 1));
    updateDosage.mutate(
      { detailId, dosage: draftDosage, quantity: nextQuantity },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <tr
      data-ocid={`prescriptions.detail.row.${index + 1}`}
      className="align-top"
    >
      <td className="px-3 py-3 font-medium text-foreground">{medicineLabel}</td>
      <td className="px-3 py-3 text-muted-foreground">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input
              data-ocid={`prescriptions.detail.dosage_input.${index + 1}`}
              value={draftDosage}
              onChange={(e) => setDraftDosage(e.target.value)}
              aria-label={vi.prescriptions.dosage}
              className="h-8"
            />
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`detail-days-${detailId.toString()}`}
                className="text-xs text-muted-foreground"
              >
                Số ngày
              </Label>
              <Input
                id={`detail-days-${detailId.toString()}`}
                data-ocid={`prescriptions.detail.days_input.${index + 1}`}
                type="number"
                min={1}
                value={draftDays}
                onChange={(e) => setDraftDays(e.target.value)}
                className="h-8 w-20"
              />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calculator className="size-3" aria-hidden="true" />
              Cần dùng:{" "}
              <span className="font-mono text-foreground">
                {previewQuantity}
              </span>
            </p>
          </div>
        ) : (
          dosage || vi.common.notAvailable
        )}
      </td>
      <td className="px-3 py-3 text-right font-mono text-foreground">
        {quantity.toString()}
      </td>
      {canManage && (
        <td className="px-3 py-3">
          <div className="flex items-center justify-end gap-1">
            {editing ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`prescriptions.detail.save_button.${index + 1}`}
                  onClick={save}
                  disabled={updateDosage.isPending}
                  aria-label="Lưu liều dùng"
                >
                  <Save className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-ocid={`prescriptions.detail.cancel_button.${index + 1}`}
                  onClick={() => setEditing(false)}
                  aria-label={vi.common.cancel}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-ocid={`prescriptions.detail.edit_button.${index + 1}`}
                onClick={startEdit}
                aria-label="Sửa liều dùng"
              >
                <Calculator className="size-4" aria-hidden="true" />
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-ocid={`prescriptions.detail.delete_button.${index + 1}`}
              onClick={onRemove}
              disabled={removing}
              aria-label="Xóa thuốc khỏi đơn"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/* Create prescription dialog                                          */
/* ------------------------------------------------------------------ */

function CreatePrescriptionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: Id) => void;
}) {
  const { data: records } = useRecords();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createPrescription = useCreatePrescription();

  const [recordId, setRecordId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = recordId !== "" && patientId !== "" && doctorId !== "";

  function reset() {
    setRecordId("");
    setPatientId("");
    setDoctorId("");
    setNotes("");
  }

  function submit() {
    if (!canSubmit) return;
    const payload = {
      medicalRecordId: BigInt(recordId),
      patientId: BigInt(patientId),
      doctorId: BigInt(doctorId),
      notes,
    };
    reset();
    createPrescription.mutate(payload, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          onCreated(result.ok.id);
          onOpenChange(false);
        }
      },
    });
  }

  const errorMessage =
    createPrescription.isError ||
    (createPrescription.data && createPrescription.data.__kind__ === "err")
      ? "Không thể tạo đơn thuốc. Vui lòng kiểm tra lại thông tin."
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="prescriptions.create.modal">
        <DialogHeader>
          <DialogTitle>{vi.prescriptions.add}</DialogTitle>
          <DialogDescription>
            Chọn hồ sơ khám bệnh, bệnh nhân và bác sĩ kê đơn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prescription-record">{vi.records.code}</Label>
            <Select value={recordId} onValueChange={setRecordId}>
              <SelectTrigger
                id="prescription-record"
                data-ocid="prescriptions.create.record_select"
                className="w-full"
              >
                <SelectValue placeholder="Chọn hồ sơ khám bệnh" />
              </SelectTrigger>
              <SelectContent>
                {(records ?? []).map((r) => (
                  <SelectItem key={r.id.toString()} value={r.id.toString()}>
                    #{r.id.toString()} · {r.diagnosis || "Chưa có chẩn đoán"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription-patient">
              {vi.prescriptions.patient}
            </Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger
                id="prescription-patient"
                data-ocid="prescriptions.create.patient_select"
                className="w-full"
              >
                <SelectValue placeholder="Chọn bệnh nhân" />
              </SelectTrigger>
              <SelectContent>
                {(patients ?? []).map((p) => (
                  <SelectItem key={p.id.toString()} value={p.id.toString()}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription-doctor">
              {vi.prescriptions.doctor}
            </Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger
                id="prescription-doctor"
                data-ocid="prescriptions.create.doctor_select"
                className="w-full"
              >
                <SelectValue placeholder="Chọn bác sĩ" />
              </SelectTrigger>
              <SelectContent>
                {(doctors ?? []).map((d) => (
                  <SelectItem key={d.id.toString()} value={d.id.toString()}>
                    {d.fullName} · {d.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription-notes">Ghi chú</Label>
            <Input
              id="prescription-notes"
              data-ocid="prescriptions.create.notes_input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Lời dặn cho bệnh nhân"
            />
          </div>

          {errorMessage && (
            <p
              data-ocid="prescriptions.create.error_state"
              className="text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="prescriptions.create.cancel_button"
            onClick={() => onOpenChange(false)}
            className="rounded-md"
          >
            {vi.common.cancel}
          </Button>
          <Button
            type="button"
            data-ocid="prescriptions.create.submit_button"
            onClick={submit}
            disabled={!canSubmit || createPrescription.isPending}
            className="rounded-md"
          >
            {vi.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Add detail dialog                                                   */
/* ------------------------------------------------------------------ */

function AddDetailDialog({
  open,
  onOpenChange,
  prescriptionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptionId: Id;
}) {
  const { data: medicines } = useMedicines();
  const addDetail = useAddDetail();

  const [medicineId, setMedicineId] = useState("");
  const [dosage, setDosage] = useState("");
  const [days, setDays] = useState("1");

  const previewQuantity = calculateQuantity(dosage, Number(days));
  const canSubmit = medicineId !== "" && dosage.trim() !== "";

  function reset() {
    setMedicineId("");
    setDosage("");
    setDays("1");
  }

  function submit() {
    if (!canSubmit) return;
    const payload = {
      prescriptionId,
      medicineId: BigInt(medicineId),
      dosage: dosage.trim(),
      quantity: BigInt(Math.max(previewQuantity, 1)),
    };
    reset();
    addDetail.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="prescriptions.add_detail.modal">
        <DialogHeader>
          <DialogTitle>Thêm thuốc vào đơn</DialogTitle>
          <DialogDescription>
            Nhập liều dùng và số ngày để hệ thống tính số lượng cần dùng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="detail-medicine">{vi.prescriptions.medicine}</Label>
            <Select value={medicineId} onValueChange={setMedicineId}>
              <SelectTrigger
                id="detail-medicine"
                data-ocid="prescriptions.add_detail.medicine_select"
                className="w-full"
              >
                <SelectValue placeholder="Chọn thuốc" />
              </SelectTrigger>
              <SelectContent>
                {(medicines ?? []).map((m) => (
                  <SelectItem key={m.id.toString()} value={m.id.toString()}>
                    {m.name} · {m.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-dosage">{vi.prescriptions.dosage}</Label>
            <Input
              id="detail-dosage"
              data-ocid="prescriptions.add_detail.dosage_input"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="Ví dụ: 2 viên x 3 lần/ngày"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-days">Số ngày dùng</Label>
            <Input
              id="detail-days"
              data-ocid="prescriptions.add_detail.days_input"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calculator className="size-4" aria-hidden="true" />
              Số lượng cần dùng
            </span>
            <span
              data-ocid="prescriptions.add_detail.quantity_preview"
              className="font-mono text-lg font-semibold text-foreground"
            >
              {previewQuantity}
            </span>
          </div>

          {addDetail.isError && (
            <p
              data-ocid="prescriptions.add_detail.error_state"
              className="text-sm text-destructive"
            >
              Không thể thêm thuốc. Vui lòng thử lại.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="prescriptions.add_detail.cancel_button"
            onClick={() => onOpenChange(false)}
            className="rounded-md"
          >
            {vi.common.cancel}
          </Button>
          <Button
            type="button"
            data-ocid="prescriptions.add_detail.submit_button"
            onClick={submit}
            disabled={!canSubmit || addDetail.isPending}
            className="rounded-md"
          >
            {vi.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
