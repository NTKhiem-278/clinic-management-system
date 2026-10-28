import { renderWithActor } from "@/__tests__/test-utils";
import type {
  Medicine,
  Prescription,
  PrescriptionView,
  backendInterface,
} from "@/backend";
import { UserRole } from "@/backend";
import { PrescriptionsPage } from "@/pages/PrescriptionsPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const MEDICINE: Medicine = {
  id: 1n,
  name: "Paracetamol",
  unit: "viên",
  unitPrice: 1000n,
  stockQuantity: 100n,
  expiryDate: "2030-01-01",
  createdAt: 0n,
};

function makePrescription(overrides: Partial<Prescription> = {}): Prescription {
  return {
    id: 20n,
    doctorId: 5n,
    patientId: 1n,
    medicalRecordId: 3n,
    notes: "Uống sau ăn",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

function makeView(details: PrescriptionView["details"]): PrescriptionView {
  return { ...makePrescription(), details };
}

type Actor = Pick<
  backendInterface,
  | "listPrescriptions"
  | "getPrescription"
  | "calculateTotalItems"
  | "getCallerUserRole"
  | "listMedicines"
  | "listPatients"
  | "listDoctors"
  | "listRecords"
  | "addDetail"
  | "removeDetail"
  | "updateDosage"
  | "createPrescription"
>;

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    listPrescriptions: vi.fn<backendInterface["listPrescriptions"]>(
      async () => [],
    ),
    getPrescription: vi.fn<backendInterface["getPrescription"]>(
      async () => null,
    ),
    calculateTotalItems: vi.fn<backendInterface["calculateTotalItems"]>(
      async () => 0n,
    ),
    getCallerUserRole: vi.fn<backendInterface["getCallerUserRole"]>(
      async () => UserRole.admin,
    ),
    listMedicines: vi.fn<backendInterface["listMedicines"]>(async () => [
      MEDICINE,
    ]),
    listPatients: vi.fn<backendInterface["listPatients"]>(async () => []),
    listDoctors: vi.fn<backendInterface["listDoctors"]>(async () => []),
    listRecords: vi.fn<backendInterface["listRecords"]>(async () => []),
    addDetail: vi.fn<backendInterface["addDetail"]>(async () => ({
      __kind__: "ok",
      ok: {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "2 viên/ngày",
        quantity: 2n,
      },
    })),
    removeDetail: vi.fn<backendInterface["removeDetail"]>(async () => ({
      __kind__: "ok",
      ok: null,
    })),
    updateDosage: vi.fn<backendInterface["updateDosage"]>(async () => ({
      __kind__: "ok",
      ok: {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "3 viên/ngày",
        quantity: 3n,
      },
    })),
    createPrescription: vi.fn<backendInterface["createPrescription"]>(
      async () => ({ __kind__: "ok", ok: makePrescription() }),
    ),
    ...overrides,
  };
}

describe("PrescriptionsPage", () => {
  it("shows the total number of medicine types in a prescription", async () => {
    const view = makeView([
      {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "2 viên/ngày",
        quantity: 2n,
      },
      {
        id: 2n,
        prescriptionId: 20n,
        medicineId: 2n,
        dosage: "1 viên/ngày",
        quantity: 1n,
      },
    ]);
    const actor = makeActor({
      listPrescriptions: vi.fn(async () => [makePrescription()]),
      getPrescription: vi.fn(async () => view),
      calculateTotalItems: vi.fn(async () => 2n),
    });
    renderWithActor(<PrescriptionsPage />, actor);

    const panel = await screen.findByTestId("prescriptions.detail.panel");
    expect(panel).toHaveTextContent("Tổng số loại thuốc");
    expect(panel).toHaveTextContent("Số loại thuốc trong đơn");
    // The "Số loại thuốc trong đơn" tile renders the detail count of 2.
    expect(panel).toHaveTextContent("2");
  });

  it("adds a medicine detail to a prescription", async () => {
    const user = userEvent.setup();
    const empty = makeView([]);
    const withDetail = makeView([
      {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "2 viên/ngày",
        quantity: 2n,
      },
    ]);
    const getPrescription = vi
      .fn<backendInterface["getPrescription"]>()
      .mockResolvedValueOnce(empty)
      .mockResolvedValue(withDetail);
    const addDetail = vi.fn<backendInterface["addDetail"]>(async () => ({
      __kind__: "ok",
      ok: {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "2 viên/ngày",
        quantity: 2n,
      },
    }));
    const actor = makeActor({
      listPrescriptions: vi.fn(async () => [makePrescription()]),
      getPrescription,
      addDetail,
    });
    renderWithActor(<PrescriptionsPage />, actor);

    await user.click(
      await screen.findByTestId("prescriptions.add_detail_button"),
    );
    await user.click(
      screen.getByTestId("prescriptions.add_detail.medicine_select"),
    );
    await user.click(
      await screen.findByRole("option", { name: /Paracetamol/ }),
    );
    await user.type(
      screen.getByTestId("prescriptions.add_detail.dosage_input"),
      "2 viên/ngày",
    );
    await user.click(
      screen.getByTestId("prescriptions.add_detail.submit_button"),
    );

    await waitFor(() => expect(addDetail).toHaveBeenCalledTimes(1));
    expect(addDetail.mock.calls[0][0]).toBe(20n);
    expect(addDetail.mock.calls[0][1]).toBe(1n);
    expect(await screen.findByText("Paracetamol")).toBeInTheDocument();
  });

  it("removes a medicine detail from a prescription", async () => {
    const user = userEvent.setup();
    const view = makeView([
      {
        id: 1n,
        prescriptionId: 20n,
        medicineId: 1n,
        dosage: "2 viên/ngày",
        quantity: 2n,
      },
    ]);
    const removeDetail = vi.fn<backendInterface["removeDetail"]>(async () => ({
      __kind__: "ok",
      ok: null,
    }));
    const actor = makeActor({
      listPrescriptions: vi.fn(async () => [makePrescription()]),
      getPrescription: vi.fn(async () => view),
      removeDetail,
    });
    renderWithActor(<PrescriptionsPage />, actor);

    await user.click(
      await screen.findByTestId("prescriptions.detail.delete_button.1"),
    );

    await waitFor(() => expect(removeDetail).toHaveBeenCalledWith(1n));
  });
});
