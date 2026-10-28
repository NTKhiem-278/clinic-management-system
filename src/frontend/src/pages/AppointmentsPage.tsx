import type { Appointment, AppointmentStatus, Id } from "@/backend";
import { AppointmentStatus as Status } from "@/backend";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/DataStates";
import {
  formatTimestamp,
  useAppointments,
  useCreateAppointment,
  useDoctors,
  usePatients,
  useUpdateAppointmentStatus,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

const STATUS_TONE = {
  pending: "pending",
  confirmed: "confirmed",
  completed: "completed",
  cancelled: "cancelled",
} as const;

const STATUS_ORDER: AppointmentStatus[] = [
  Status.pending,
  Status.confirmed,
  Status.completed,
  Status.cancelled,
];

/** Screen-specific Vietnamese copy that extends the shared language module. */
const copy = {
  emptyFiltered: "Không có lịch hẹn nào khớp với bộ lọc hiện tại.",
  searchPlaceholder: "Tìm theo bệnh nhân, bác sĩ hoặc lý do…",
  filterByDate: "Lọc theo ngày",
  clearDate: "Bỏ lọc ngày",
  confirm: "Xác nhận",
  complete: "Hoàn tất",
  cancel: "Hủy lịch",
  updateStatus: "Cập nhật trạng thái",
  unknownPatient: "Bệnh nhân không xác định",
  unknownDoctor: "Bác sĩ không xác định",
  readOnlyNotice:
    "Bạn đang xem ở chế độ chỉ đọc. Chỉ quản trị viên, bác sĩ và lễ tân mới có thể đặt hoặc thay đổi lịch hẹn.",
  form: {
    title: "Đặt lịch khám mới",
    selectPatient: "Chọn bệnh nhân",
    selectDoctor: "Chọn bác sĩ",
    date: "Ngày khám",
    time: "Giờ khám",
    reasonPlaceholder: "Mô tả triệu chứng hoặc lý do khám…",
    submit: "Đặt lịch",
    saving: "Đang lưu…",
    requiredPeople: "Vui lòng chọn bệnh nhân và bác sĩ.",
    requiredTime: "Vui lòng chọn ngày và giờ khám hợp lệ.",
    requiredReason: "Vui lòng nhập lý do khám.",
    saveError: "Không thể đặt lịch hẹn. Vui lòng thử lại.",
    missingPeople:
      "Cần có ít nhất một bệnh nhân và một bác sĩ trong hệ thống trước khi đặt lịch.",
  },
} as const;

type StatusFilter = AppointmentStatus | "all";

function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/** Combine a yyyy-mm-dd date and HH:mm time into a nanosecond timestamp. */
function toTimestamp(date: string, time: string): bigint | null {
  if (!date || !time) return null;
  const parsed = new Date(`${date}T${time}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return BigInt(parsed.getTime()) * 1_000_000n;
}

function dateKey(timestamp: bigint): string {
  const date = new Date(Number(timestamp / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function AppointmentsPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();

  // The backend authorizes appointment writes for any signed-in caller
  // (appointments-api.mo:39-47), so every authenticated user can manage them.
  const canManage = !!principal && !principal.isAnonymous();

  const { data, isLoading, isError, refetch } = useAppointments();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? [])
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter((a) => !dateFilter || dateKey(a.scheduledAt) === dateFilter)
      .filter((a) => {
        if (!term) return true;
        const pName = patientName.get(a.patientId.toString()) ?? "";
        const dName = doctorName.get(a.doctorId.toString()) ?? "";
        return (
          pName.toLowerCase().includes(term) ||
          dName.toLowerCase().includes(term) ||
          a.reason.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => Number(b.scheduledAt - a.scheduledAt));
  }, [data, statusFilter, dateFilter, search, patientName, doctorName]);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: (data ?? []).length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const a of data ?? []) base[a.status] += 1;
    return base;
  }, [data]);

  function resetForm() {
    setPatientId("");
    setDoctorId("");
    setDate(todayInputValue());
    setTime("09:00");
    setReason("");
    setFormError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientId || !doctorId) {
      setFormError(copy.form.requiredPeople);
      return;
    }
    const scheduledAt = toTimestamp(date, time);
    if (scheduledAt === null) {
      setFormError(copy.form.requiredTime);
      return;
    }
    if (!reason.trim()) {
      setFormError(copy.form.requiredReason);
      return;
    }
    setFormError(null);
    const payload = {
      patientId: BigInt(patientId),
      doctorId: BigInt(doctorId),
      scheduledAt,
      reason: reason.trim(),
    };
    createAppointment.mutate(payload, {
      onSuccess: () => {
        resetForm();
        setShowForm(false);
      },
      onError: () => setFormError(copy.form.saveError),
    });
  }

  function changeStatus(id: Id, status: AppointmentStatus) {
    updateStatus.mutate({ id, status });
  }

  const hasPatients = (patients ?? []).length > 0;
  const hasDoctors = (doctors ?? []).length > 0;

  return (
    <>
      <PageHeader
        title={vi.appointments.title}
        subtitle={vi.appointments.subtitle}
        actions={
          canManage ? (
            <button
              type="button"
              data-ocid="appointments.open_modal_button"
              onClick={() => setShowForm((open) => !open)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus className="size-4" aria-hidden="true" />
              {vi.appointments.add}
            </button>
          ) : null
        }
      />

      {!canManage && (
        <p
          data-ocid="appointments.permission_notice"
          className="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
        >
          {copy.readOnlyNotice}
        </p>
      )}

      {canManage && showForm && (
        <section
          data-ocid="appointments.form"
          className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-6"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">
            {copy.form.title}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="appt-patient"
                className="text-sm font-medium text-foreground"
              >
                {vi.appointments.patient}
              </label>
              <select
                id="appt-patient"
                data-ocid="appointments.patient_select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!hasPatients}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                <option value="">{copy.form.selectPatient}</option>
                {(patients ?? []).map((p) => (
                  <option key={p.id.toString()} value={p.id.toString()}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="appt-doctor"
                className="text-sm font-medium text-foreground"
              >
                {vi.appointments.doctor}
              </label>
              <select
                id="appt-doctor"
                data-ocid="appointments.doctor_select"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                disabled={!hasDoctors}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                <option value="">{copy.form.selectDoctor}</option>
                {(doctors ?? []).map((d) => (
                  <option key={d.id.toString()} value={d.id.toString()}>
                    {d.fullName} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="appt-date"
                className="text-sm font-medium text-foreground"
              >
                {copy.form.date}
              </label>
              <input
                id="appt-date"
                type="date"
                data-ocid="appointments.date_input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="appt-time"
                className="text-sm font-medium text-foreground"
              >
                {copy.form.time}
              </label>
              <input
                id="appt-time"
                type="time"
                data-ocid="appointments.time_input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label
                htmlFor="appt-reason"
                className="text-sm font-medium text-foreground"
              >
                {vi.appointments.reason}
              </label>
              <textarea
                id="appt-reason"
                data-ocid="appointments.reason_textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={copy.form.reasonPlaceholder}
                className="resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>

            {formError && (
              <p
                role="alert"
                data-ocid="appointments.form.error_state"
                className="text-sm text-destructive md:col-span-2"
              >
                {formError}
              </p>
            )}

            <div className="flex items-center gap-2 md:col-span-2">
              <button
                type="submit"
                data-ocid="appointments.submit_button"
                disabled={
                  createAppointment.isPending || !hasPatients || !hasDoctors
                }
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                {createAppointment.isPending
                  ? copy.form.saving
                  : copy.form.submit}
              </button>
              <button
                type="button"
                data-ocid="appointments.cancel_button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {vi.common.cancel}
              </button>
            </div>

            {(!hasPatients || !hasDoctors) && (
              <p className="text-xs text-muted-foreground md:col-span-2">
                {copy.form.missingPeople}
              </p>
            )}
          </form>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div
            data-ocid="appointments.filter.tab"
            className="flex flex-wrap items-center gap-1"
          >
            {(["all", ...STATUS_ORDER] as StatusFilter[]).map((key) => {
              const active = statusFilter === key;
              const label =
                key === "all" ? vi.common.all : vi.appointments.status[key];
              return (
                <button
                  key={key}
                  type="button"
                  data-ocid={`appointments.filter.${key}`}
                  aria-pressed={active}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {label}
                  <span className="tabular-nums opacity-70">{counts[key]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                data-ocid="appointments.search_input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={vi.common.search}
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-56"
              />
            </div>
            <input
              type="date"
              data-ocid="appointments.date_filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label={copy.filterByDate}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            {dateFilter && (
              <button
                type="button"
                data-ocid="appointments.clear_date_button"
                onClick={() => setDateFilter("")}
                className="rounded-md border border-input bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {copy.clearDate}
              </button>
            )}
          </div>
        </div>

        {isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={
              (data ?? []).length === 0
                ? vi.appointments.empty
                : copy.emptyFiltered
            }
            action={
              canManage && (data ?? []).length === 0 ? (
                <button
                  type="button"
                  data-ocid="appointments.empty_state.open_modal_button"
                  onClick={() => setShowForm(true)}
                  className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {vi.appointments.add}
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul data-ocid="appointments.list" className="divide-y divide-border">
            {filtered.map((a, index) => (
              <AppointmentRow
                key={a.id.toString()}
                appointment={a}
                index={index}
                patientName={patientName.get(a.patientId.toString())}
                doctorName={doctorName.get(a.doctorId.toString())}
                canManage={canManage}
                isUpdating={updateStatus.isPending}
                onChangeStatus={changeStatus}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function AppointmentRow({
  appointment,
  index,
  patientName,
  doctorName,
  canManage,
  isUpdating,
  onChangeStatus,
}: {
  appointment: Appointment;
  index: number;
  patientName?: string;
  doctorName?: string;
  canManage: boolean;
  isUpdating: boolean;
  onChangeStatus: (id: Id, status: AppointmentStatus) => void;
}) {
  const { id, status, scheduledAt, reason } = appointment;
  const isFinal = status === Status.completed || status === Status.cancelled;

  return (
    <li
      data-ocid={`appointments.item.${index + 1}`}
      className="chart-stripe flex flex-col gap-3 px-4 py-4 transition-smooth hover:bg-muted/40 md:flex-row md:items-center md:justify-between md:px-6"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {patientName ?? copy.unknownPatient}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {doctorName ?? copy.unknownDoctor}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {reason}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 md:justify-end">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatTimestamp(scheduledAt)}
        </span>
        <StatusBadge
          label={vi.appointments.status[status]}
          tone={STATUS_TONE[status]}
        />

        {canManage && (
          <div className="flex items-center gap-2">
            {status === Status.pending && (
              <button
                type="button"
                data-ocid={`appointments.confirm_button.${index + 1}`}
                disabled={isUpdating}
                onClick={() => onChangeStatus(id, Status.confirmed)}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {copy.confirm}
              </button>
            )}

            {status === Status.confirmed && (
              <button
                type="button"
                data-ocid={`appointments.complete_button.${index + 1}`}
                disabled={isUpdating}
                onClick={() => onChangeStatus(id, Status.completed)}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {copy.complete}
              </button>
            )}

            {!isFinal && (
              <button
                type="button"
                data-ocid={`appointments.cancel_button.${index + 1}`}
                disabled={isUpdating}
                onClick={() => onChangeStatus(id, Status.cancelled)}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-destructive transition-smooth hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
              >
                <XCircle className="size-3.5" aria-hidden="true" />
                {copy.cancel}
              </button>
            )}

            <label className="sr-only" htmlFor={`appt-status-${id.toString()}`}>
              {copy.updateStatus}
            </label>
            <select
              id={`appt-status-${id.toString()}`}
              data-ocid={`appointments.status_select.${index + 1}`}
              value={status}
              disabled={isUpdating}
              onChange={(e) =>
                onChangeStatus(id, e.target.value as AppointmentStatus)
              }
              className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {vi.appointments.status[s]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </li>
  );
}
