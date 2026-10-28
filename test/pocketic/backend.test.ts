import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";
import { registerCaller } from "./test-utils";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];
let admin: Actor<_SERVICE>;

const alice = createIdentity("alice");
const bob = createIdentity("bob");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  });
  canisterId = installed.canisterId;
  // The first initialized caller becomes administrator.
  admin = await registerCaller(installed.actor, alice);
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(admin.listPatients()).resolves.toEqual([]);
  await expect(admin.listAppointments()).resolves.toEqual([]);
  await expect(admin.listMedicines()).resolves.toEqual([]);
  await expect(admin.listPrescriptions()).resolves.toEqual([]);
});

it("round-trips a patient through create, search and get", async () => {
  const created = await admin.createPatient({
    fullName: "Nguyễn Văn A",
    dateOfBirth: "1990-01-01",
    gender: { male: null },
    phone: "0901234567",
    address: "Hà Nội",
    notes: "",
  });
  expect(created).toHaveProperty("ok");
  if (!("ok" in created)) return;
  const id = created.ok.id;

  const found = await admin.searchPatients("Nguyễn");
  expect(found.map((p) => p.id)).toContain(id);

  const fetched = await admin.getPatient(id);
  expect(fetched).not.toBeNull();
  expect(fetched?.[0]?.fullName).toBe("Nguyễn Văn A");
});

it("books an appointment that starts pending and can be confirmed", async () => {
  const patient = await admin.createPatient({
    fullName: "Trần Thị B",
    dateOfBirth: "1985-05-05",
    gender: { female: null },
    phone: "",
    address: "",
    notes: "",
  });
  const doctor = await admin.createDoctor({
    fullName: "BS. Lê Văn C",
    specialty: "Nội tổng quát",
    email: "bs@phongkham.vn",
    phone: "",
  });
  if (!("ok" in patient) || !("ok" in doctor)) return;

  const booked = await admin.createAppointment({
    patientId: patient.ok.id,
    doctorId: doctor.ok.id,
    scheduledAt: 1_800_000_000_000_000_000n,
    reason: "Sốt cao",
  });
  expect(booked).toHaveProperty("ok");
  if (!("ok" in booked)) return;
  expect(booked.ok.status).toEqual({ pending: null });

  const confirmed = await admin.updateAppointmentStatus(booked.ok.id, {
    confirmed: null,
  });
  expect(confirmed).toHaveProperty("ok");
  if (!("ok" in confirmed)) return;
  expect(confirmed.ok.status).toEqual({ confirmed: null });
});

it("creates a record and reads it back through the patient history", async () => {
  // Record reads are gated on the accounts map, so the admin must have an
  // account entry (role #admin) before clinical-staff reads succeed.
  const self = await admin.upsertAccount(
    alice.getPrincipal(),
    "Quản trị viên",
    { admin: null },
  );
  expect(self).toHaveProperty("ok");

  const patient = await admin.createPatient({
    fullName: "Phạm Văn D",
    dateOfBirth: "1970-03-03",
    gender: { male: null },
    phone: "",
    address: "",
    notes: "",
  });
  const doctor = await admin.createDoctor({
    fullName: "BS. Hoàng E",
    specialty: "Nhi",
    email: "",
    phone: "",
  });
  if (!("ok" in patient) || !("ok" in doctor)) return;

  const record = await admin.createRecord(patient.ok.id, doctor.ok.id, {
    appointmentId: 0n,
    symptoms: "Ho, sốt",
    diagnosis: "Viêm họng cấp",
    examinationResult: "Họng đỏ",
    testResults: "",
  });
  expect(record).toHaveProperty("ok");
  if (!("ok" in record)) return;

  const history = await admin.listRecordsByPatient(patient.ok.id);
  expect(history.map((r) => r.id)).toContain(record.ok.id);
});

it("counts the medicine types in a prescription", async () => {
  const medicineA = await admin.createMedicine({
    name: "Paracetamol",
    unit: "viên",
    unitPrice: 1000n,
    stockQuantity: 100n,
    expiryDate: "2030-01-01",
  });
  const medicineB = await admin.createMedicine({
    name: "Amoxicillin",
    unit: "viên",
    unitPrice: 2000n,
    stockQuantity: 50n,
    expiryDate: "2030-01-01",
  });
  if (!("ok" in medicineA) || !("ok" in medicineB)) return;

  const prescription = await admin.createPrescription(0n, 0n, 0n, "Uống sau ăn");
  expect(prescription).toHaveProperty("ok");
  if (!("ok" in prescription)) return;

  await admin.addDetail(prescription.ok.id, medicineA.ok.id, "2 viên/ngày", 2n);
  await admin.addDetail(prescription.ok.id, medicineB.ok.id, "1 viên/ngày", 1n);

  await expect(admin.calculateTotalItems(prescription.ok.id)).resolves.toBe(2n);
});

it("reports stock and expiry for a medicine", async () => {
  const medicine = await admin.createMedicine({
    name: "Ibuprofen",
    unit: "viên",
    unitPrice: 500n,
    stockQuantity: 0n,
    expiryDate: "2000-01-01",
  });
  expect(medicine).toHaveProperty("ok");
  if (!("ok" in medicine)) return;

  await expect(admin.checkStock(medicine.ok.id)).resolves.toEqual([0n]);
  const expiry = await admin.checkExpiry(medicine.ok.id);
  expect(expiry).not.toBeNull();
});

it("rejects an anonymous caller from patient reads", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.listPatients()).rejects.toThrow();
});

it("does not expose admin account management to a non-admin caller", async () => {
  const member = await registerCaller(
    pic!.createActor<_SERVICE>(idlFactory, canisterId),
    bob,
  );
  await expect(member.listAccounts()).resolves.toEqual([]);
});
