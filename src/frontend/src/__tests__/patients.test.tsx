import { renderPageWithRouter } from "@/__tests__/router-test-utils";
import type { Patient, backendInterface } from "@/backend";
import { Gender, UserRole } from "@/backend";
import { PatientsPage } from "@/pages/PatientsPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1n,
    fullName: "Nguyễn Văn A",
    dateOfBirth: "1990-01-01",
    gender: Gender.male,
    phone: "0901234567",
    address: "Hà Nội",
    notes: "",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

type Actor = Pick<
  backendInterface,
  "listPatients" | "createPatient" | "getCallerUserRole"
>;

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    listPatients: vi.fn<backendInterface["listPatients"]>(async () => []),
    createPatient: vi.fn<backendInterface["createPatient"]>(async (input) => ({
      __kind__: "ok",
      ok: makePatient({ id: 2n, fullName: input.fullName }),
    })),
    getCallerUserRole: vi.fn<backendInterface["getCallerUserRole"]>(
      async () => UserRole.admin,
    ),
    ...overrides,
  };
}

describe("PatientsPage", () => {
  it("renders the patient list without a blank screen", async () => {
    const actor = makeActor({
      listPatients: vi.fn(async () => [makePatient()]),
    });
    renderPageWithRouter(<PatientsPage />, actor);

    expect(await screen.findByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("BN-0001")).toBeInTheDocument();
  });

  it("creates a patient and shows it in the list", async () => {
    const user = userEvent.setup();
    const created = makePatient({ id: 7n, fullName: "Trần Thị B" });
    const listPatients = vi
      .fn<backendInterface["listPatients"]>()
      .mockResolvedValueOnce([])
      .mockResolvedValue([created]);
    const createPatient = vi.fn<backendInterface["createPatient"]>(
      async () => ({ __kind__: "ok", ok: created }),
    );
    const actor = makeActor({ listPatients, createPatient });
    renderPageWithRouter(<PatientsPage />, actor);

    await user.click(await screen.findByTestId("patients.add_button"));
    await user.type(
      screen.getByTestId("patient_create.fullName_input"),
      "Trần Thị B",
    );
    await user.click(screen.getByTestId("patient_create.submit_button"));

    await waitFor(() => expect(createPatient).toHaveBeenCalledTimes(1));
    expect(createPatient.mock.calls[0][0]).toMatchObject({
      fullName: "Trần Thị B",
    });
    expect(await screen.findByText("Trần Thị B")).toBeInTheDocument();
  });

  it("filters the list by the search term", async () => {
    const user = userEvent.setup();
    const actor = makeActor({
      listPatients: vi.fn(async () => [
        makePatient({ id: 1n, fullName: "Nguyễn Văn A" }),
        makePatient({ id: 2n, fullName: "Lê Văn C" }),
      ]),
    });
    renderPageWithRouter(<PatientsPage />, actor);

    await screen.findByText("Nguyễn Văn A");
    await user.type(screen.getByTestId("patients.search_input"), "Lê");

    const table = screen.getByTestId("patients.table");
    expect(within(table).getByText("Lê Văn C")).toBeInTheDocument();
    expect(within(table).queryByText("Nguyễn Văn A")).not.toBeInTheDocument();
  });

  it("hides the add action for a non-admin caller", async () => {
    const actor = makeActor({
      getCallerUserRole: vi.fn(async () => UserRole.guest),
    });
    renderPageWithRouter(<PatientsPage />, actor);

    await screen.findByTestId("empty_state");
    expect(screen.queryByTestId("patients.add_button")).not.toBeInTheDocument();
  });
});
