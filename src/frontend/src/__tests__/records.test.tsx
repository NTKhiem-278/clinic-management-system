import { renderWithActor } from "@/__tests__/test-utils";
import type { MedicalRecord, backendInterface } from "@/backend";
import { UserRole } from "@/backend";
import { RecordsPage } from "@/pages/RecordsPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: 3n,
    doctorId: 5n,
    patientId: 1n,
    appointmentId: 10n,
    symptoms: "Sốt, ho",
    diagnosis: "Viêm họng cấp",
    examinationResult: "Họng đỏ",
    testResults: "",
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

type Actor = Pick<
  backendInterface,
  | "listRecords"
  | "listRecordsByPatient"
  | "getRecord"
  | "getCallerUserRole"
  | "listPatients"
  | "listDoctors"
  | "listAppointments"
  | "createRecord"
>;

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    listRecords: vi.fn<backendInterface["listRecords"]>(async () => []),
    listRecordsByPatient: vi.fn<backendInterface["listRecordsByPatient"]>(
      async () => [],
    ),
    getRecord: vi.fn<backendInterface["getRecord"]>(async () => null),
    getCallerUserRole: vi.fn<backendInterface["getCallerUserRole"]>(
      async () => UserRole.admin,
    ),
    listPatients: vi.fn<backendInterface["listPatients"]>(async () => []),
    listDoctors: vi.fn<backendInterface["listDoctors"]>(async () => []),
    listAppointments: vi.fn<backendInterface["listAppointments"]>(
      async () => [],
    ),
    createRecord: vi.fn<backendInterface["createRecord"]>(async () => ({
      __kind__: "ok",
      ok: makeRecord(),
    })),
    ...overrides,
  };
}

describe("RecordsPage", () => {
  it("lists records and opens a record detail", async () => {
    const user = userEvent.setup();
    const record = makeRecord();
    const actor = makeActor({
      listRecords: vi.fn(async () => [record]),
      getRecord: vi.fn(async () => record),
    });
    renderWithActor(<RecordsPage />, actor);

    await user.click(await screen.findByTestId("records.item.1"));

    const panel = await screen.findByTestId("records.detail.panel");
    expect(panel).toHaveTextContent("Viêm họng cấp");
    expect(panel).toHaveTextContent("Họng đỏ");
  });

  it("shows a patient's examination history", async () => {
    const user = userEvent.setup();
    const record = makeRecord({ id: 4n, diagnosis: "Viêm phế quản" });
    const actor = makeActor({
      listPatients: vi.fn(async () => [
        {
          id: 1n,
          fullName: "Nguyễn Văn A",
          dateOfBirth: "1990-01-01",
          gender: "male" as never,
          phone: "",
          address: "",
          notes: "",
          createdAt: 0n,
        },
      ]),
      listRecordsByPatient: vi.fn(async () => [record]),
      getRecord: vi.fn(async () => record),
    });
    renderWithActor(<RecordsPage />, actor);

    await user.click(await screen.findByTestId("records.tab.history"));
    await user.selectOptions(
      await screen.findByTestId("records.history.patient_select"),
      "1",
    );

    expect(await screen.findByText("Viêm phế quản")).toBeInTheDocument();
  });

  it("creates a record for an appointment", async () => {
    const user = userEvent.setup();
    const created = makeRecord({ id: 9n, diagnosis: "Cảm cúm" });
    const listRecords = vi
      .fn<backendInterface["listRecords"]>()
      .mockResolvedValueOnce([])
      .mockResolvedValue([created]);
    const createRecord = vi.fn<backendInterface["createRecord"]>(async () => ({
      __kind__: "ok",
      ok: created,
    }));
    const actor = makeActor({
      listRecords,
      createRecord,
      listPatients: vi.fn(async () => [
        {
          id: 1n,
          fullName: "Nguyễn Văn A",
          dateOfBirth: "1990-01-01",
          gender: "male" as never,
          phone: "",
          address: "",
          notes: "",
          createdAt: 0n,
        },
      ]),
      listDoctors: vi.fn(async () => [
        {
          id: 5n,
          fullName: "BS. Trần Văn B",
          specialty: "Nội",
          email: "",
          phone: "",
          createdAt: 0n,
        },
      ]),
      listAppointments: vi.fn(async () => [
        {
          id: 10n,
          status: "pending" as never,
          doctorId: 5n,
          patientId: 1n,
          createdAt: 0n,
          scheduledAt: 1_800_000_000_000_000_000n,
          reason: "Khám",
        },
      ]),
    });
    renderWithActor(<RecordsPage />, actor);

    await user.click(await screen.findByTestId("records.add_button"));
    await user.selectOptions(
      screen.getByTestId("records.form.patient_select"),
      "1",
    );
    await user.selectOptions(
      screen.getByTestId("records.form.doctor_select"),
      "5",
    );
    await user.selectOptions(
      screen.getByTestId("records.form.appointment_select"),
      "10",
    );
    await user.type(
      screen.getByTestId("records.form.symptoms_input"),
      "Ho, sốt",
    );
    await user.type(
      screen.getByTestId("records.form.diagnosis_input"),
      "Cảm cúm",
    );
    await user.click(screen.getByTestId("records.form.submit_button"));

    await waitFor(() => expect(createRecord).toHaveBeenCalledTimes(1));
    expect(createRecord.mock.calls[0][0]).toBe(1n);
    expect(createRecord.mock.calls[0][1]).toBe(5n);
    expect(createRecord.mock.calls[0][2]).toMatchObject({
      appointmentId: 10n,
      diagnosis: "Cảm cúm",
    });
  });
});
