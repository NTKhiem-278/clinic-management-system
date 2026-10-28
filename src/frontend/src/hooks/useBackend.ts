import { createActor } from "@/backend";
import type {
  AppointmentInput,
  AppointmentStatus,
  DoctorInput,
  Id,
  MedicalRecordInput,
  MedicineInput,
  PatientInput,
  RoleName,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Convert a Motoko nanosecond timestamp into a JavaScript Date. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp for display, with a safe fallback. */
export function formatTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a bigint currency value (VND) for display. */
export function formatCurrency(value: bigint): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */

export function usePatients() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPatients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePatient(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["patient", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getPatient(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreatePatient() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PatientInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createPatient(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdatePatient() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: Id; input: PatientInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updatePatient(id, input);
    },
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
      void queryClient.invalidateQueries({
        queryKey: ["patient", id.toString()],
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Doctors                                                             */
/* ------------------------------------------------------------------ */

export function useDoctors() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listDoctors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDoctor(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["doctor", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getDoctor(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateDoctor() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DoctorInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createDoctor(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: Id; input: DoctorInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateDoctor(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export function useAppointments() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAppointments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAppointmentsByPatient(patientId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["appointments", "patient", patientId?.toString()],
    queryFn: async () => {
      if (!actor || patientId === undefined) return [];
      return actor.listAppointmentsByPatient(patientId);
    },
    enabled: !!actor && !isFetching && patientId !== undefined,
  });
}

export function useAppointmentsByDoctor(doctorId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["appointments", "doctor", doctorId?.toString()],
    queryFn: async () => {
      if (!actor || doctorId === undefined) return [];
      return actor.listAppointmentsByDoctor(doctorId);
    },
    enabled: !!actor && !isFetching && doctorId !== undefined,
  });
}

export function useAppointment(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["appointment", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getAppointment(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateAppointment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createAppointment(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: Id; status: AppointmentStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateAppointmentStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Medical records                                                     */
/* ------------------------------------------------------------------ */

export function useRecords() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordsByPatient(patientId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["records", "patient", patientId?.toString()],
    queryFn: async () => {
      if (!actor || patientId === undefined) return [];
      return actor.listRecordsByPatient(patientId);
    },
    enabled: !!actor && !isFetching && patientId !== undefined,
  });
}

export function useRecord(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["record", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getRecord(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateRecord() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      patientId,
      doctorId,
      input,
    }: { patientId: Id; doctorId: Id; input: MedicalRecordInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createRecord(patientId, doctorId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["records"] });
    },
  });
}

export function useUpdateRecord() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: Id; input: MedicalRecordInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateRecord(id, input);
    },
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["records"] });
      void queryClient.invalidateQueries({
        queryKey: ["record", id.toString()],
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Prescriptions                                                       */
/* ------------------------------------------------------------------ */

export function usePrescriptions() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPrescriptions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePrescription(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["prescription", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getPrescription(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreatePrescription() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      medicalRecordId,
      patientId,
      doctorId,
      notes,
    }: {
      medicalRecordId: Id;
      patientId: Id;
      doctorId: Id;
      notes: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createPrescription(
        medicalRecordId,
        patientId,
        doctorId,
        notes,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
}

export function useAddDetail() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      prescriptionId,
      medicineId,
      dosage,
      quantity,
    }: {
      prescriptionId: Id;
      medicineId: Id;
      dosage: string;
      quantity: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addDetail(prescriptionId, medicineId, dosage, quantity);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["prescription"] });
    },
  });
}

export function useRemoveDetail() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (detailId: Id) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeDetail(detailId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["prescription"] });
    },
  });
}

export function useUpdateDosage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      detailId,
      dosage,
      quantity,
    }: { detailId: Id; dosage: string; quantity: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateDosage(detailId, dosage, quantity);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      void queryClient.invalidateQueries({ queryKey: ["prescription"] });
    },
  });
}

export function useCalculateTotalItems(prescriptionId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["prescription", "total", prescriptionId?.toString()],
    queryFn: async () => {
      if (!actor || prescriptionId === undefined) return 0n;
      return actor.calculateTotalItems(prescriptionId);
    },
    enabled: !!actor && !isFetching && prescriptionId !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Medicines                                                           */
/* ------------------------------------------------------------------ */

export function useMedicines() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMedicines();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMedicine(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["medicine", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getMedicine(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCreateMedicine() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MedicineInput) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createMedicine(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useUpdateMedicine() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: Id; input: MedicineInput }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateMedicine(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
  });
}

export function useCheckStock(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["medicine", "stock", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.checkStock(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useCheckExpiry(id: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["medicine", "expiry", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.checkExpiry(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Accounts and roles                                                  */
/* ------------------------------------------------------------------ */

export function useAccounts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAccounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAccount(principal: Principal | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["account", principal?.toText()],
    queryFn: async () => {
      if (!actor || principal === undefined) return null;
      return actor.getAccount(principal);
    },
    enabled: !!actor && !isFetching && principal !== undefined,
  });
}

export function useUpsertAccount() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      displayName,
      role,
    }: { principal: Principal; displayName: string; role: RoleName }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.upsertAccount(principal, displayName, role);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useSetAccountActive() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      principal,
      active,
    }: { principal: Principal; active: boolean }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setAccountActive(principal, active);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useRoles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRoles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRole() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      permissions,
    }: { name: RoleName; permissions: string[] }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createRole(name, permissions);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function usePermissions(roleId: Id | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["permissions", roleId?.toString()],
    queryFn: async () => {
      if (!actor || roleId === undefined) return [];
      return actor.getPermissions(roleId);
    },
    enabled: !!actor && !isFetching && roleId !== undefined,
  });
}

export function useAddPermission() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permission,
    }: { roleId: Id; permission: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addPermission(roleId, permission);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
      void queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
}

export function useRemovePermission() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roleId,
      permission,
    }: { roleId: Id; permission: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removePermission(roleId, permission);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roles"] });
      void queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Caller identity                                                     */
/* ------------------------------------------------------------------ */

export function useCallerRole() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}
