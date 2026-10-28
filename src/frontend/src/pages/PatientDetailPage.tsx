import { Gender, UserRole } from "@/backend";
import type { PatientInput } from "@/backend";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@/components/DataStates";
import {
  useCallerRole,
  usePatient,
  useRecordsByPatient,
  useUpdatePatient,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { useState } from "react";

const routeApi = getRouteApi("/patients/$patientId");

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: Gender.male, label: vi.gender.male },
  { value: Gender.female, label: vi.gender.female },
  { value: Gender.other, label: vi.gender.other },
];

/** Only administrators may update patient records (patients-api.mo:42). */
const MANAGE_ROLES = new Set([UserRole.admin]);

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">
        {value || vi.common.notAvailable}
      </dd>
    </div>
  );
}

function EditPatientForm({
  id,
  initial,
  onDone,
}: {
  id: bigint;
  initial: PatientInput;
  onDone: () => void;
}) {
  const updatePatient = useUpdatePatient();
  const [form, setForm] = useState<PatientInput>(initial);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.fullName.trim().length > 0 && !updatePatient.isPending;

  function update<K extends keyof PatientInput>(
    key: K,
    value: PatientInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const payload: PatientInput = {
      ...form,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    };
    updatePatient.mutate(
      { id, input: payload },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "ok") {
            onDone();
          } else {
            setError(
              result.err.__kind__ === "invalidInput"
                ? result.err.invalidInput
                : "Không thể cập nhật bệnh nhân. Vui lòng kiểm tra lại thông tin.",
            );
          }
        },
        onError: () => {
          setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
        },
      },
    );
  }

  return (
    <form
      data-ocid="patient_detail.edit_form"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="edit-fullName">
            {vi.patients.fullName}
          </label>
          <input
            id="edit-fullName"
            data-ocid="patient_detail.fullName_input"
            className={fieldClass}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-dateOfBirth">
            {vi.patients.dateOfBirth}
          </label>
          <input
            id="edit-dateOfBirth"
            type="date"
            data-ocid="patient_detail.dateOfBirth_input"
            className={fieldClass}
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-gender">
            {vi.patients.gender}
          </label>
          <select
            id="edit-gender"
            data-ocid="patient_detail.gender_select"
            className={fieldClass}
            value={form.gender}
            onChange={(e) => update("gender", e.target.value as Gender)}
          >
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-phone">
            {vi.patients.phone}
          </label>
          <input
            id="edit-phone"
            data-ocid="patient_detail.phone_input"
            className={fieldClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="edit-address">
            {vi.patients.address}
          </label>
          <input
            id="edit-address"
            data-ocid="patient_detail.address_input"
            className={fieldClass}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="edit-notes">
            {vi.patients.notes}
          </label>
          <textarea
            id="edit-notes"
            data-ocid="patient_detail.notes_textarea"
            className={cn(fieldClass, "min-h-20 resize-y")}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p
          data-ocid="patient_detail.error_state"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          data-ocid="patient_detail.cancel_button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-4" aria-hidden="true" />
          {vi.common.cancel}
        </button>
        <button
          type="submit"
          data-ocid="patient_detail.save_button"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {vi.common.save}
        </button>
      </div>
    </form>
  );
}

export function PatientDetailPage() {
  const { patientId } = routeApi.useParams();
  const id = BigInt(patientId);
  const patient = usePatient(id);
  const records = useRecordsByPatient(id);
  const callerRole = useCallerRole();
  const [editing, setEditing] = useState(false);

  const canManage = callerRole.data ? MANAGE_ROLES.has(callerRole.data) : false;
  const data = patient.data;

  return (
    <>
      <PageHeader
        title={vi.patients.detailTitle}
        subtitle={data?.fullName}
        badge={
          data ? (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-xs text-secondary-foreground">
              BN-{data.id.toString().padStart(4, "0")}
            </span>
          ) : undefined
        }
        actions={
          <Link
            to="/patients"
            data-ocid="patient_detail.back_button"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {vi.common.back}
          </Link>
        }
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-subtle md:p-6">
        {patient.isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void patient.refetch()}
          />
        ) : patient.isLoading ? (
          <LoadingState label={vi.common.loading} />
        ) : !data ? (
          <EmptyState title={vi.common.emptyTitle} body={vi.patients.empty} />
        ) : editing && canManage ? (
          <EditPatientForm
            id={id}
            initial={{
              fullName: data.fullName,
              dateOfBirth: data.dateOfBirth,
              gender: data.gender,
              phone: data.phone,
              address: data.address,
              notes: data.notes,
            }}
            onDone={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-foreground">
                Thông tin cá nhân
              </h2>
              {canManage && (
                <button
                  type="button"
                  data-ocid="patient_detail.edit_button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  {vi.common.edit}
                </button>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label={vi.patients.fullName} value={data.fullName} />
              <InfoRow
                label={vi.patients.dateOfBirth}
                value={data.dateOfBirth}
              />
              <InfoRow
                label={vi.patients.gender}
                value={vi.gender[data.gender]}
              />
              <InfoRow label={vi.patients.phone} value={data.phone} />
              <div className="sm:col-span-2">
                <InfoRow label={vi.patients.address} value={data.address} />
              </div>
              <div className="sm:col-span-2">
                <InfoRow label={vi.patients.notes} value={data.notes} />
              </div>
            </dl>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="border-b border-border px-4 py-3 md:px-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {vi.patients.history}
          </h2>
        </div>
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
          <EmptyState title={vi.common.emptyTitle} body={vi.records.empty} />
        ) : (
          <ul
            data-ocid="patient_detail.records.list"
            className="divide-y divide-border"
          >
            {(records.data ?? []).map((r, index) => (
              <li
                key={r.id.toString()}
                data-ocid={`patient_detail.records.item.${index + 1}`}
                className="chart-stripe px-4 py-3 md:px-6"
              >
                <p className="font-medium text-foreground">{r.diagnosis}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.symptoms}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
