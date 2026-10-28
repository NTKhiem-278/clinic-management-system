import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AccountError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Principal;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface Appointment {
    id: Id;
    status: AppointmentStatus;
    doctorId: Id;
    patientId: Id;
    createdAt: Timestamp;
    scheduledAt: Timestamp;
    reason: string;
}
export type AppointmentError = {
    __kind__: "invalidStatusTransition";
    invalidStatusTransition: string;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface AppointmentInput {
    doctorId: Id;
    patientId: Id;
    scheduledAt: Timestamp;
    reason: string;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface Doctor {
    id: Id;
    createdAt: Timestamp;
    fullName: string;
    email: string;
    specialty: string;
    phone: string;
}
export type DoctorError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface DoctorInput {
    fullName: string;
    email: string;
    specialty: string;
    phone: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type Id = bigint;
export interface MedicalRecord {
    id: Id;
    doctorId: Id;
    testResults: string;
    patientId: Id;
    createdAt: Timestamp;
    diagnosis: string;
    updatedAt: Timestamp;
    examinationResult: string;
    symptoms: string;
    appointmentId: Id;
}
export type MedicalRecordError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface MedicalRecordInput {
    testResults: string;
    diagnosis: string;
    examinationResult: string;
    symptoms: string;
    appointmentId: Id;
}
export interface Medicine {
    id: Id;
    stockQuantity: bigint;
    expiryDate: string;
    name: string;
    createdAt: Timestamp;
    unit: string;
    unitPrice: bigint;
}
export type MedicineError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface MedicineInput {
    stockQuantity: bigint;
    expiryDate: string;
    name: string;
    unit: string;
    unitPrice: bigint;
}
export interface Patient {
    id: Id;
    dateOfBirth: string;
    createdAt: Timestamp;
    fullName: string;
    address: string;
    gender: Gender;
    notes: string;
    phone: string;
}
export type PatientError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface PatientInput {
    dateOfBirth: string;
    fullName: string;
    address: string;
    gender: Gender;
    notes: string;
    phone: string;
}
export interface Prescription {
    id: Id;
    doctorId: Id;
    patientId: Id;
    createdAt: Timestamp;
    notes: string;
    medicalRecordId: Id;
}
export interface PrescriptionDetail {
    id: Id;
    prescriptionId: Id;
    dosage: string;
    quantity: bigint;
    medicineId: Id;
}
export type PrescriptionError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface PrescriptionView {
    id: Id;
    doctorId: Id;
    patientId: Id;
    createdAt: Timestamp;
    notes: string;
    medicalRecordId: Id;
    details: Array<PrescriptionDetail>;
}
export type Result = {
    __kind__: "ok";
    ok: UserAccount;
} | {
    __kind__: "err";
    err: AccountError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: Role;
} | {
    __kind__: "err";
    err: RoleError;
};
export type Result__1 = {
    __kind__: "ok";
    ok: MedicalRecord;
} | {
    __kind__: "err";
    err: MedicalRecordError;
};
export type Result__2 = {
    __kind__: "ok";
    ok: Patient;
} | {
    __kind__: "err";
    err: PatientError;
};
export type Result__3 = {
    __kind__: "ok";
    ok: Medicine;
} | {
    __kind__: "err";
    err: MedicineError;
};
export type Result__4 = {
    __kind__: "ok";
    ok: PrescriptionDetail;
} | {
    __kind__: "err";
    err: PrescriptionError;
};
export type Result__4_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: PrescriptionError;
};
export type Result__4_2 = {
    __kind__: "ok";
    ok: Prescription;
} | {
    __kind__: "err";
    err: PrescriptionError;
};
export type Result__5 = {
    __kind__: "ok";
    ok: Doctor;
} | {
    __kind__: "err";
    err: DoctorError;
};
export type Result__6 = {
    __kind__: "ok";
    ok: Appointment;
} | {
    __kind__: "err";
    err: AppointmentError;
};
export interface Result__7 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__8 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Role {
    id: Id;
    permissions: Array<string>;
    name: RoleName;
}
export type RoleError = {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "notFound";
    notFound: Id;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export type Timestamp = bigint;
export interface UserAccount {
    principal: Principal;
    active: boolean;
    displayName: string;
    createdAt: Timestamp;
    role: RoleName;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum AppointmentStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    confirmed = "confirmed"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum RoleName {
    patient = "patient",
    admin = "admin",
    doctor = "doctor",
    receptionist = "receptionist"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDetail(prescriptionId: Id, medicineId: Id, dosage: string, quantity: bigint): Promise<Result__4>;
    addPermission(roleId: Id, permission: string): Promise<Result_1>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateTotalItems(prescriptionId: Id): Promise<bigint>;
    checkExpiry(id: Id): Promise<string | null>;
    checkStock(id: Id): Promise<bigint | null>;
    createAppointment(input: AppointmentInput): Promise<Result__6>;
    createDoctor(input: DoctorInput): Promise<Result__5>;
    createMedicine(input: MedicineInput): Promise<Result__3>;
    createPatient(input: PatientInput): Promise<Result__2>;
    createPrescription(medicalRecordId: Id, patientId: Id, doctorId: Id, notes: string): Promise<Result__4_2>;
    createRecord(patientId: Id, doctorId: Id, input: MedicalRecordInput): Promise<Result__1>;
    createRole(name: RoleName, permissions: Array<string>): Promise<Result_1>;
    execute(qJson: string): Promise<Result__7>;
    getAccount(principal: Principal): Promise<UserAccount | null>;
    getApiDoc(): Promise<string>;
    getAppointment(id: Id): Promise<Appointment | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDoctor(id: Id): Promise<Doctor | null>;
    getMedicine(id: Id): Promise<Medicine | null>;
    getPatient(id: Id): Promise<Patient | null>;
    getPermissions(roleId: Id): Promise<Array<string> | null>;
    getPrescription(id: Id): Promise<PrescriptionView | null>;
    getRecord(id: Id): Promise<MedicalRecord | null>;
    isCallerAdmin(): Promise<boolean>;
    listAccounts(): Promise<Array<UserAccount>>;
    listAppointments(): Promise<Array<Appointment>>;
    listAppointmentsByDoctor(doctorId: Id): Promise<Array<Appointment>>;
    listAppointmentsByPatient(patientId: Id): Promise<Array<Appointment>>;
    listDoctors(): Promise<Array<Doctor>>;
    listMedicines(): Promise<Array<Medicine>>;
    listPatients(): Promise<Array<Patient>>;
    listPrescriptions(): Promise<Array<Prescription>>;
    listRecords(): Promise<Array<MedicalRecord>>;
    listRecordsByPatient(patientId: Id): Promise<Array<MedicalRecord>>;
    listRoles(): Promise<Array<Role>>;
    removeDetail(detailId: Id): Promise<Result__4_1>;
    removePermission(roleId: Id, permission: string): Promise<Result_1>;
    schema(): Promise<string>;
    searchDoctors(term: string): Promise<Array<Doctor>>;
    searchPatients(term: string): Promise<Array<Patient>>;
    setAccountActive(principal: Principal, active: boolean): Promise<Result>;
    updateAppointmentStatus(id: Id, status: AppointmentStatus): Promise<Result__6>;
    updateDoctor(id: Id, input: DoctorInput): Promise<Result__5>;
    updateDosage(detailId: Id, dosage: string, quantity: bigint): Promise<Result__4>;
    updateMedicine(id: Id, input: MedicineInput): Promise<Result__3>;
    updatePatient(id: Id, input: PatientInput): Promise<Result__2>;
    updateRecord(id: Id, input: MedicalRecordInput): Promise<Result__1>;
    upsertAccount(principal: Principal, displayName: string, role: RoleName): Promise<Result>;
}
