import type { Doctor, DoctorInput, Id } from "@/backend";
import { UserRole } from "@/backend";
import {
  EmptyState,
  ErrorState,
  PageHeader,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCallerRole,
  useCreateDoctor,
  useDoctors,
  useUpdateDoctor,
} from "@/hooks/useBackend";
import { vi } from "@/lib/i18n";
import { Loader2, Pencil, Plus, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Draft = {
  fullName: string;
  specialty: string;
  phone: string;
  email: string;
};

const EMPTY_DRAFT: Draft = {
  fullName: "",
  specialty: "",
  phone: "",
  email: "",
};

/** Only administrators may create or update doctor records (doctors-api.mo:35,42). */
const MANAGER_ROLES = new Set([UserRole.admin]);

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return vi.common.errorBody;
}

export function DoctorsPage() {
  const { data, isLoading, isError, refetch } = useDoctors();
  const { data: callerRole } = useCallerRole();
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = callerRole != null && MANAGER_ROLES.has(callerRole);
  const doctors = data ?? [];
  const isSaving = createDoctor.isPending || updateDoctor.isPending;

  function openCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(doctor: Doctor) {
    setEditingId(doctor.id);
    setDraft({
      fullName: doctor.fullName,
      specialty: doctor.specialty,
      phone: doctor.phone,
      email: doctor.email,
    });
    setFormError(null);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: DoctorInput = {
      fullName: draft.fullName.trim(),
      specialty: draft.specialty.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };
    if (!input.fullName || !input.specialty) {
      setFormError(vi.doctors.requiredError);
      return;
    }
    setFormError(null);
    const onError = (error: unknown) => setFormError(errorMessage(error));
    if (editingId !== null) {
      updateDoctor.mutate(
        { id: editingId, input },
        { onSuccess: () => setOpen(false), onError },
      );
    } else {
      createDoctor.mutate(input, {
        onSuccess: () => setOpen(false),
        onError,
      });
    }
  }

  return (
    <>
      <PageHeader
        title={vi.doctors.title}
        subtitle={vi.doctors.subtitle}
        actions={
          canManage ? (
            <Button
              type="button"
              data-ocid="doctors.add_button"
              onClick={openCreate}
              className="rounded-md"
            >
              <Plus className="size-4" aria-hidden="true" />
              {vi.doctors.add}
            </Button>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-subtle">
        {isError ? (
          <ErrorState
            title={vi.common.errorTitle}
            body={vi.common.errorBody}
            retryLabel={vi.common.retry}
            onRetry={() => void refetch()}
          />
        ) : isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : doctors.length === 0 ? (
          <EmptyState
            title={vi.common.emptyTitle}
            body={vi.doctors.empty}
            action={
              canManage ? (
                <Button
                  type="button"
                  data-ocid="doctors.empty_state.add_button"
                  onClick={openCreate}
                  className="rounded-md"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {vi.doctors.add}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table data-ocid="doctors.table">
              <TableHeader>
                <TableRow>
                  <TableHead>{vi.doctors.fullName}</TableHead>
                  <TableHead>{vi.doctors.specialty}</TableHead>
                  <TableHead>{vi.doctors.phone}</TableHead>
                  <TableHead>{vi.doctors.email}</TableHead>
                  {canManage && (
                    <TableHead className="text-right">
                      {vi.common.actions}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor, index) => (
                  <TableRow
                    key={doctor.id.toString()}
                    data-ocid={`doctors.item.${index + 1}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      <span className="flex items-center gap-2">
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                          aria-hidden="true"
                        >
                          <Stethoscope className="size-3.5" />
                        </span>
                        <span className="truncate">{doctor.fullName}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.specialty}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {doctor.phone || vi.common.notAvailable}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doctor.email || vi.common.notAvailable}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-ocid={`doctors.edit_button.${index + 1}`}
                          onClick={() => openEdit(doctor)}
                          className="rounded-md"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          {vi.common.edit}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {canManage && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent data-ocid="doctors.dialog">
            <DialogHeader>
              <DialogTitle>
                {editingId !== null ? vi.doctors.editTitle : vi.doctors.add}
              </DialogTitle>
              <DialogDescription>{vi.doctors.formHint}</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="doctors.form"
            >
              <div className="space-y-2">
                <Label htmlFor="doctor-fullName">{vi.doctors.fullName}</Label>
                <Input
                  id="doctor-fullName"
                  data-ocid="doctors.fullName_input"
                  value={draft.fullName}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, fullName: e.target.value }))
                  }
                  placeholder={vi.doctors.fullNamePlaceholder}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-specialty">{vi.doctors.specialty}</Label>
                <Input
                  id="doctor-specialty"
                  data-ocid="doctors.specialty_input"
                  value={draft.specialty}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, specialty: e.target.value }))
                  }
                  placeholder={vi.doctors.specialtyPlaceholder}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctor-phone">{vi.doctors.phone}</Label>
                  <Input
                    id="doctor-phone"
                    data-ocid="doctors.phone_input"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder={vi.doctors.phonePlaceholder}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-email">{vi.doctors.email}</Label>
                  <Input
                    id="doctor-email"
                    data-ocid="doctors.email_input"
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, email: e.target.value }))
                    }
                    placeholder={vi.doctors.emailPlaceholder}
                    autoComplete="email"
                  />
                </div>
              </div>
              {formError && (
                <p
                  data-ocid="doctors.form.error_state"
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="doctors.cancel_button"
                  onClick={() => setOpen(false)}
                  className="rounded-md"
                >
                  {vi.common.cancel}
                </Button>
                <Button
                  type="submit"
                  data-ocid="doctors.submit_button"
                  disabled={isSaving}
                  className="rounded-md"
                >
                  {isSaving && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {isSaving ? vi.common.saving : vi.common.save}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
