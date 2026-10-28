import type { Id, MedicalRecord, MedicalRecordInput } from "@/backend";
import { UserRole } from "@/backend";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TableSkeleton,
} from "@/components/DataStates";
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
import { Textarea } from "@/components/ui/textarea";
import {
  formatTimestamp,
  useAppointments,
  useCallerRole,
  useCreateRecord,
  useDoctors,
  usePatients,
  useRecord,
  useRecords,
  useRecordsByPatient,
  useUpdateRecord,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  FlaskConical,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

/** Screen-specific Vietnamese copy layered on the shared language module. */
const copy = {
  editTitle: "Cập nhật hồ sơ khám",
  formHint:
    "Chọn bệnh nhân, bác sĩ và lịch hẹn, sau đó ghi nhận triệu chứng, chẩn đoán và kết quả khám.",
  selectPatient: "Chọn bệnh nhân",
  selectDoctor: "Chọn bác sĩ",
  selectAppointment: "Chọn lịch hẹn",
  appointment: "Lịch hẹn",
  appointmentHint: "Hồ sơ khám gắn với lịch hẹn đã đặt.",
  symptomsPlaceholder: "Ví dụ: sốt, ho khan, đau họng 3 ngày",
  diagnosisPlaceholder: "Ví dụ: viêm họng cấp",
  examinationPlaceholder: "Mô tả kết quả thăm khám lâm sàng…",
  testResultsPlaceholder: "Nhập kết quả xét nghiệm, chỉ số, kết luận…",
  saving: "Đang lưu…",
  saveError: "Không thể lưu hồ sơ. Vui lòng kiểm tra lại thông tin.",
  noTestResults: "Chưa có kết quả xét nghiệm cho hồ sơ này.",
  tabList: "Danh sách hồ sơ",
  tabHistory: "Lịch sử khám theo bệnh nhân",
  historyTitle: "Lịch sử khám bệnh",
  historyHint: "Chọn một bệnh nhân để xem toàn bộ lịch sử khám bệnh.",
  detailTitle: "Chi tiết hồ sơ khám",
  detailHint: "Chọn một hồ sơ trong danh sách để xem chi tiết.",
} as const;

type Draft = {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  symptoms: string;
  diagnosis: string;
  examinationResult: string;
  testResults: string;
};

const EMPTY_DRAFT: Draft = {
  patientId: "",
  doctorId: "",
  appointmentId: "",
  symptoms: "",
  diagnosis: "",
  examinationResult: "",
  testResults: "",
};

function toInput(draft: Draft): MedicalRecordInput {
  return {
    appointmentId: BigInt(draft.appointmentId || "0"),
    symptoms: draft.symptoms.trim(),
    diagnosis: draft.diagnosis.trim(),
    examinationResult: draft.examinationResult.trim(),
    testResults: draft.testResults.trim(),
  };
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RecordFormDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: MedicalRecord;
}) {
  const patients = usePatients();
  const doctors = useDoctors();
  const appointments = useAppointments();
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord();
  const editing = record !== undefined;

  const [draft, setDraft] = useState<Draft>(() =>
    record
      ? {
          patientId: record.patientId.toString(),
          doctorId: record.doctorId.toString(),
          appointmentId: record.appointmentId.toString(),
          symptoms: record.symptoms,
          diagnosis: record.diagnosis,
          examinationResult: record.examinationResult,
          testResults: record.testResults,
        }
      : EMPTY_DRAFT,
  );
  const [error, setError] = useState<string | null>(null);

  const pending = createRecord.isPending || updateRecord.isPending;
  const valid =
    draft.patientId !== "" &&
    draft.doctorId !== "" &&
    draft.appointmentId !== "" &&
    draft.symptoms.trim() !== "" &&
    draft.diagnosis.trim() !== "";

  const submit = () => {
    if (!valid || pending) return;
    setError(null);
    const input = toInput(draft);
    const onError = () => setError(copy.saveError);
    if (editing && record) {
      updateRecord.mutate(
        { id: record.id, input },
        { onSuccess: () => onOpenChange(false), onError },
      );
    } else {
      createRecord.mutate(
        {
          patientId: BigInt(draft.patientId),
          doctorId: BigInt(draft.doctorId),
          input,
        },
        { onSuccess: () => onOpenChange(false), onError },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="records.form.dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? copy.editTitle : vi.records.add}
          </DialogTitle>
          <DialogDescription>{copy.formHint}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={vi.records.patient}>
            <select
              data-ocid="records.form.patient_select"
              value={draft.patientId}
              disabled={editing}
              onChange={(e) =>
                setDraft((d) => ({ ...d, patientId: e.target.value }))
              }
              className={selectClass}
            >
              <option value="">{copy.selectPatient}</option>
              {(patients.data ?? []).map((p) => (
                <option key={p.id.toString()} value={p.id.toString()}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </Field>

          <Field label={vi.records.doctor}>
            <select
              data-ocid="records.form.doctor_select"
              value={draft.doctorId}
              disabled={editing}
              onChange={(e) =>
                setDraft((d) => ({ ...d, doctorId: e.target.value }))
              }
              className={selectClass}
            >
              <option value="">{copy.selectDoctor}</option>
              {(doctors.data ?? []).map((d) => (
                <option key={d.id.toString()} value={d.id.toString()}>
                  {d.fullName} — {d.specialty}
                </option>
              ))}
            </select>
          </Field>

          <Field label={copy.appointment} hint={copy.appointmentHint}>
            <select
              data-ocid="records.form.appointment_select"
              value={draft.appointmentId}
              disabled={editing}
              onChange={(e) =>
                setDraft((d) => ({ ...d, appointmentId: e.target.value }))
              }
              className={selectClass}
            >
              <option value="">{copy.selectAppointment}</option>
              {(appointments.data ?? []).map((a) => (
                <option key={a.id.toString()} value={a.id.toString()}>
                  #{a.id.toString()} — {formatTimestamp(a.scheduledAt)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={vi.records.symptoms}>
            <Input
              data-ocid="records.form.symptoms_input"
              value={draft.symptoms}
              onChange={(e) =>
                setDraft((d) => ({ ...d, symptoms: e.target.value }))
              }
              placeholder={copy.symptomsPlaceholder}
            />
          </Field>

          <Field label={vi.records.diagnosis}>
            <Input
              data-ocid="records.form.diagnosis_input"
              value={draft.diagnosis}
              onChange={(e) =>
                setDraft((d) => ({ ...d, diagnosis: e.target.value }))
              }
              placeholder={copy.diagnosisPlaceholder}
            />
          </Field>

          <Field label={vi.records.examinationResult}>
            <Textarea
              data-ocid="records.form.examination_input"
              value={draft.examinationResult}
              onChange={(e) =>
                setDraft((d) => ({ ...d, examinationResult: e.target.value }))
              }
              placeholder={copy.examinationPlaceholder}
              rows={3}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label={vi.records.testResults}>
              <Textarea
                data-ocid="records.form.test_results_input"
                value={draft.testResults}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, testResults: e.target.value }))
                }
                placeholder={copy.testResultsPlaceholder}
                rows={3}
              />
            </Field>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            data-ocid="records.form.error_state"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <DialogFooter>
          <button
            type="button"
            data-ocid="records.form.cancel_button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {vi.common.cancel}
          </button>
          <button
            type="button"
            data-ocid="records.form.submit_button"
            disabled={!valid || pending}
            onClick={submit}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {pending ? copy.saving : vi.common.save}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
        {value.trim() === "" ? vi.common.notAvailable : value}
      </dd>
    </div>
  );
}

function RecordDetail({
  recordId,
  canWrite,
}: {
  recordId: Id;
  canWrite: boolean;
}) {
  const record = useRecord(recordId);
  const [editing, setEditing] = useState(false);

  if (record.isError) {
    return (
      <ErrorState
        title={vi.common.errorTitle}
        body={vi.common.errorBody}
        retryLabel={vi.common.retry}
        onRetry={() => void record.refetch()}
      />
    );
  }
  if (record.isLoading) return <LoadingState label={vi.common.loading} />;
  if (!record.data) {
    return <EmptyState title={vi.common.emptyTitle} body={vi.records.empty} />;
  }

  const r = record.data;
  return (
    <div data-ocid="records.detail.panel" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-muted-foreground">
            {vi.records.code} #{r.id.toString()}
          </p>
          <h2 className="font-display text-xl font-semibold text-foreground">
            {r.diagnosis}
          </h2>
        </div>
        {canWrite && (
          <button
            type="button"
            data-ocid="records.detail.edit_button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Pencil className="size-4" aria-hidden="true" />
            {vi.common.edit}
          </button>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow
          label={vi.records.patient}
          value={`#${r.patientId.toString()}`}
        />
        <DetailRow
          label={vi.records.doctor}
          value={`#${r.doctorId.toString()}`}
        />
        <DetailRow
          label={copy.appointment}
          value={`#${r.appointmentId.toString()}`}
        />
        <DetailRow
          label={vi.records.createdAt}
          value={formatTimestamp(r.createdAt)}
        />
        <DetailRow label={vi.records.symptoms} value={r.symptoms} />
        <DetailRow
          label={vi.records.examinationResult}
          value={r.examinationResult}
        />
      </dl>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" aria-hidden="true" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            {vi.records.testResults}
          </h3>
        </div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">
          {r.testResults.trim() === "" ? copy.noTestResults : r.testResults}
        </p>
      </div>

      {editing && (
        <RecordFormDialog open={editing} onOpenChange={setEditing} record={r} />
      )}
    </div>
  );
}

function PatientHistory({ canWrite }: { canWrite: boolean }) {
  const patients = usePatients();
  const [patientId, setPatientId] = useState("");
  const [selected, setSelected] = useState<Id | undefined>(undefined);
  const history = useRecordsByPatient(
    patientId === "" ? undefined : BigInt(patientId),
  );

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Field label={vi.records.patient}>
          <select
            data-ocid="records.history.patient_select"
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setSelected(undefined);
            }}
            className={selectClass}
          >
            <option value="">{copy.selectPatient}</option>
            {(patients.data ?? []).map((p) => (
              <option key={p.id.toString()} value={p.id.toString()}>
                {p.fullName}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {patientId === "" ? (
        <EmptyState title={copy.historyTitle} body={copy.historyHint} />
      ) : history.isError ? (
        <ErrorState
          title={vi.common.errorTitle}
          body={vi.common.errorBody}
          retryLabel={vi.common.retry}
          onRetry={() => void history.refetch()}
        />
      ) : history.isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (history.data ?? []).length === 0 ? (
        <EmptyState title={vi.common.emptyTitle} body={vi.records.empty} />
      ) : (
        <ul
          data-ocid="records.history.list"
          className="divide-y divide-border rounded-lg border border-border bg-card shadow-subtle"
        >
          {(history.data ?? []).map((r, index) => (
            <li key={r.id.toString()}>
              <button
                type="button"
                data-ocid={`records.history.item.${index + 1}`}
                onClick={() => setSelected(r.id)}
                className={cn(
                  "chart-stripe flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-smooth hover:bg-muted/50 md:px-6",
                  selected === r.id && "bg-muted/60",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {r.diagnosis}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.symptoms}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatTimestamp(r.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected !== undefined && (
        <section className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-6">
          <RecordDetail recordId={selected} canWrite={canWrite} />
        </section>
      )}
    </div>
  );
}

export function RecordsPage() {
  const records = useRecords();
  const callerRole = useCallerRole();
  const [tab, setTab] = useState<"list" | "history">("list");
  const [selected, setSelected] = useState<Id | undefined>(undefined);
  const [creating, setCreating] = useState(false);

  const canWrite = useMemo(
    () =>
      callerRole.data === UserRole.admin || callerRole.data === UserRole.user,
    [callerRole.data],
  );

  return (
    <>
      <PageHeader
        title={vi.records.title}
        subtitle={vi.records.subtitle}
        actions={
          canWrite ? (
            <button
              type="button"
              data-ocid="records.add_button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus className="size-4" aria-hidden="true" />
              {vi.records.add}
            </button>
          ) : undefined
        }
      />

      <div
        role="tablist"
        aria-label={vi.records.title}
        className="inline-flex rounded-md border border-border bg-card p-1 shadow-subtle"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "list"}
          data-ocid="records.tab.list"
          onClick={() => setTab("list")}
          className={cn(
            "inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            tab === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          {copy.tabList}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          data-ocid="records.tab.history"
          onClick={() => setTab("history")}
          className={cn(
            "inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            tab === "history"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <UserRound className="size-4" aria-hidden="true" />
          {copy.tabHistory}
        </button>
      </div>

      {tab === "history" ? (
        <PatientHistory canWrite={canWrite} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="rounded-lg border border-border bg-card shadow-subtle">
            {records.isError ? (
              <ErrorState
                title={vi.common.errorTitle}
                body={vi.common.errorBody}
                retryLabel={vi.common.retry}
                onRetry={() => void records.refetch()}
              />
            ) : records.isLoading ? (
              <LoadingState label={vi.common.loading} />
            ) : (records.data ?? []).length === 0 ? (
              <EmptyState
                title={vi.common.emptyTitle}
                body={vi.records.empty}
                action={
                  canWrite ? (
                    <button
                      type="button"
                      data-ocid="records.empty.add_button"
                      onClick={() => setCreating(true)}
                      className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      {vi.records.add}
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <ul data-ocid="records.list" className="divide-y divide-border">
                {(records.data ?? []).map((r, index) => (
                  <li key={r.id.toString()}>
                    <button
                      type="button"
                      data-ocid={`records.item.${index + 1}`}
                      onClick={() => setSelected(r.id)}
                      className={cn(
                        "chart-stripe flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-smooth hover:bg-muted/50 md:px-6",
                        selected === r.id && "bg-muted/60",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {r.diagnosis}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.symptoms}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimestamp(r.createdAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-6">
            {selected === undefined ? (
              <EmptyState title={copy.detailTitle} body={copy.detailHint} />
            ) : (
              <RecordDetail recordId={selected} canWrite={canWrite} />
            )}
          </section>
        </div>
      )}

      {creating && (
        <RecordFormDialog open={creating} onOpenChange={setCreating} />
      )}
    </>
  );
}
