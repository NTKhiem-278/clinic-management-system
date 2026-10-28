import { Gender, UserRole } from "@/backend";
import type { PatientInput } from "@/backend";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  TableSkeleton,
} from "@/components/DataStates";
import {
  useCallerRole,
  useCreatePatient,
  usePatients,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Plus, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: Gender.male, label: vi.gender.male },
  { value: Gender.female, label: vi.gender.female },
  { value: Gender.other, label: vi.gender.other },
];

const EMPTY_FORM: PatientInput = {
  fullName: "",
  dateOfBirth: "",
  gender: Gender.male,
  phone: "",
  address: "",
  notes: "",
};

/** Only administrators may create or update patient records (patients-api.mo:35,42). */
const MANAGE_ROLES = new Set([UserRole.admin]);

function CreatePatientForm({ onDone }: { onDone: () => void }) {
  const createPatient = useCreatePatient();
  const [form, setForm] = useState<PatientInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = form.fullName.trim().length > 0 && !createPatient.isPending;

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
    createPatient.mutate(payload, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          setForm(EMPTY_FORM);
          onDone();
        } else {
          setError(
            result.err.__kind__ === "invalidInput"
              ? result.err.invalidInput
              : "Không thể lưu bệnh nhân. Vui lòng kiểm tra lại thông tin.",
          );
        }
      },
      onError: () => {
        setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
      },
    });
  }

  const fieldClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const labelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground";

  return (
    <form
      data-ocid="patient_create.form"
      onSubmit={handleSubmit}
      className="space-y-4 border-b border-border bg-muted/30 px-4 py-5 md:px-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="patient-fullName">
            {vi.patients.fullName}
          </label>
          <input
            id="patient-fullName"
            data-ocid="patient_create.fullName_input"
            className={fieldClass}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="patient-dateOfBirth">
            {vi.patients.dateOfBirth}
          </label>
          <input
            id="patient-dateOfBirth"
            type="date"
            data-ocid="patient_create.dateOfBirth_input"
            className={fieldClass}
            value={form.dateOfBirth}
            onChange={(e) => update("dateOfBirth", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="patient-gender">
            {vi.patients.gender}
          </label>
          <select
            id="patient-gender"
            data-ocid="patient_create.gender_select"
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
          <label className={labelClass} htmlFor="patient-phone">
            {vi.patients.phone}
          </label>
          <input
            id="patient-phone"
            data-ocid="patient_create.phone_input"
            className={fieldClass}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="0901 234 567"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="patient-address">
            {vi.patients.address}
          </label>
          <input
            id="patient-address"
            data-ocid="patient_create.address_input"
            className={fieldClass}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Số nhà, đường, quận, thành phố"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={labelClass} htmlFor="patient-notes">
            {vi.patients.notes}
          </label>
          <textarea
            id="patient-notes"
            data-ocid="patient_create.notes_textarea"
            className={cn(fieldClass, "min-h-20 resize-y")}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Tiền sử bệnh, dị ứng thuốc…"
          />
        </div>
      </div>

      {error && (
        <p
          data-ocid="patient_create.error_state"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          data-ocid="patient_create.cancel_button"
          onClick={onDone}
          className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {vi.common.cancel}
        </button>
        <button
          type="submit"
          data-ocid="patient_create.submit_button"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden="true" />
          {vi.common.save}
        </button>
      </div>
    </form>
  );
}

export function PatientsPage() {
  const { data, isLoading, isError, refetch } = usePatients();
  const callerRole = useCallerRole();
  const [term, setTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canManage = callerRole.data ? MANAGE_ROLES.has(callerRole.data) : false;

  const patients = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.id.toString().includes(query),
    );
  }, [patients, term]);

  return (
    <>
      <PageHeader
        title={vi.patients.title}
        subtitle={vi.patients.subtitle}
        actions={
          canManage ? (
            <button
              type="button"
              data-ocid="patients.add_button"
              onClick={() => setShowForm((open) => !open)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {showForm ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <UserPlus className="size-4" aria-hidden="true" />
              )}
              {showForm ? vi.common.close : vi.patients.add}
            </button>
          ) : undefined
        }
      />

      <section className="rounded-lg border border-border bg-card shadow-subtle">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              data-ocid="patients.search_input"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã bệnh nhân…"
              aria-label="Tìm bệnh nhân theo tên hoặc mã"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {vi.common.showing} {filtered.length} {vi.common.of}{" "}
            {patients.length} {vi.common.results}
          </p>
        </div>

        {showForm && canManage && (
          <CreatePatientForm onDone={() => setShowForm(false)} />
        )}

        {isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : patients.length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.patients.empty}
            action={
              canManage ? (
                <button
                  type="button"
                  data-ocid="patients.empty_state.add_button"
                  onClick={() => setShowForm(true)}
                  className="mt-1 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  {vi.patients.add}
                </button>
              ) : undefined
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bệnh nhân"
            body={`Không có bệnh nhân nào khớp với “${term.trim()}”.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table data-ocid="patients.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <th scope="col" className="px-4 py-3 md:px-6">
                    {vi.patients.code}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {vi.patients.fullName}
                  </th>
                  <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                    {vi.patients.phone}
                  </th>
                  <th scope="col" className="hidden px-4 py-3 md:table-cell">
                    {vi.patients.gender}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right md:px-6">
                    {vi.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p, index) => (
                  <tr
                    key={p.id.toString()}
                    data-ocid={`patients.row.${index + 1}`}
                    className="transition-smooth hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground md:px-6">
                      BN-{p.id.toString().padStart(4, "0")}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.fullName}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                      {p.phone || vi.common.notAvailable}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {vi.gender[p.gender]}
                    </td>
                    <td className="px-4 py-3 text-right md:px-6">
                      <Link
                        to="/patients/$patientId"
                        params={{ patientId: p.id.toString() }}
                        data-ocid={`patients.view_button.${index + 1}`}
                        className="inline-flex items-center rounded-md border border-input bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {vi.common.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
