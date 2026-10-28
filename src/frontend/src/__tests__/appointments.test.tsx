import { setIdentityForTest } from "@/__tests__/setup";
import { renderWithActor } from "@/__tests__/test-utils";
import type { Appointment, Doctor, Patient, backendInterface } from "@/backend";
import { AppointmentStatus, Gender } from "@/backend";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/** A signed-in (non-anonymous) caller, as the appointment write guard requires. */
function signIn() {
  setIdentityForTest({
    identity: {
      getPrincipal: () => ({ isAnonymous: () => false }),
    } as never,
  });
}

const PATIENT: Patient = {
  id: 1n,
  fullName: "Nguyễn Văn A",
  dateOfBirth: "1990-01-01",
  gender: Gender.male,
  phone: "0901234567",
  address: "Hà Nội",
  notes: "",
  createdAt: 1_700_000_000_000_000_000n,
};

const DOCTOR: Doctor = {
  id: 5n,
  fullName: "BS. Trần Văn B",
  specialty: "Nội tổng quát",
  email: "bs@phongkham.vn",
  phone: "0900000000",
  createdAt: 1_700_000_000_000_000_000n,
};

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 10n,
    status: AppointmentStatus.pending,
    doctorId: 5n,
    patientId: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    scheduledAt: 1_800_000_000_000_000_000n,
    reason: "Sốt cao",
    ...overrides,
  };
}

type Actor = Pick<
  backendInterface,
  | "listAppointments"
  | "listPatients"
  | "listDoctors"
  | "createAppointment"
  | "updateAppointmentStatus"
>;

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    listAppointments: vi.fn<backendInterface["listAppointments"]>(
      async () => [],
    ),
    listPatients: vi.fn<backendInterface["listPatients"]>(async () => [
      PATIENT,
    ]),
    listDoctors: vi.fn<backendInterface["listDoctors"]>(async () => [DOCTOR]),
    createAppointment: vi.fn<backendInterface["createAppointment"]>(
      async () => ({ __kind__: "ok", ok: makeAppointment() }),
    ),
    updateAppointmentStatus: vi.fn<backendInterface["updateAppointmentStatus"]>(
      async (id, status) => ({
        __kind__: "ok",
        ok: makeAppointment({ id, status }),
      }),
    ),
    ...overrides,
  };
}

describe("AppointmentsPage", () => {
  it("books an appointment that appears as pending", async () => {
    signIn();
    const user = userEvent.setup();
    const created = makeAppointment({ id: 11n, reason: "Đau đầu" });
    const listAppointments = vi
      .fn<backendInterface["listAppointments"]>()
      .mockResolvedValueOnce([])
      .mockResolvedValue([created]);
    const createAppointment = vi.fn<backendInterface["createAppointment"]>(
      async () => ({ __kind__: "ok", ok: created }),
    );
    const actor = makeActor({ listAppointments, createAppointment });
    renderWithActor(<AppointmentsPage />, actor);

    await user.click(
      await screen.findByTestId("appointments.open_modal_button"),
    );
    await user.selectOptions(
      screen.getByTestId("appointments.patient_select"),
      "1",
    );
    await user.selectOptions(
      screen.getByTestId("appointments.doctor_select"),
      "5",
    );
    await user.type(
      screen.getByTestId("appointments.reason_textarea"),
      "Đau đầu",
    );
    await user.click(screen.getByTestId("appointments.submit_button"));

    await waitFor(() => expect(createAppointment).toHaveBeenCalledTimes(1));
    expect(createAppointment.mock.calls[0][0]).toMatchObject({
      patientId: 1n,
      doctorId: 5n,
      reason: "Đau đầu",
    });
    const row = await screen.findByTestId("appointments.item.1");
    expect(within(row).getByTestId("appointments.status_select.1")).toHaveValue(
      "pending",
    );
  });

  it("confirms a pending appointment and updates the badge", async () => {
    signIn();
    const user = userEvent.setup();
    const pending = makeAppointment({ id: 10n });
    const confirmed = makeAppointment({
      id: 10n,
      status: AppointmentStatus.confirmed,
    });
    const listAppointments = vi
      .fn<backendInterface["listAppointments"]>()
      .mockResolvedValueOnce([pending])
      .mockResolvedValue([confirmed]);
    const updateAppointmentStatus = vi.fn<
      backendInterface["updateAppointmentStatus"]
    >(async () => ({ __kind__: "ok", ok: confirmed }));
    const actor = makeActor({ listAppointments, updateAppointmentStatus });
    renderWithActor(<AppointmentsPage />, actor);

    await user.click(
      await screen.findByTestId("appointments.confirm_button.1"),
    );

    await waitFor(() =>
      expect(updateAppointmentStatus).toHaveBeenCalledWith(
        10n,
        AppointmentStatus.confirmed,
      ),
    );
    const row = await screen.findByTestId("appointments.item.1");
    expect(within(row).getByTestId("appointments.status_select.1")).toHaveValue(
      "confirmed",
    );
  });

  it("cancels a pending appointment and updates the badge", async () => {
    signIn();
    const user = userEvent.setup();
    const pending = makeAppointment({ id: 10n });
    const cancelled = makeAppointment({
      id: 10n,
      status: AppointmentStatus.cancelled,
    });
    const listAppointments = vi
      .fn<backendInterface["listAppointments"]>()
      .mockResolvedValueOnce([pending])
      .mockResolvedValue([cancelled]);
    const updateAppointmentStatus = vi.fn<
      backendInterface["updateAppointmentStatus"]
    >(async () => ({ __kind__: "ok", ok: cancelled }));
    const actor = makeActor({ listAppointments, updateAppointmentStatus });
    renderWithActor(<AppointmentsPage />, actor);

    await user.click(await screen.findByTestId("appointments.cancel_button.1"));

    await waitFor(() =>
      expect(updateAppointmentStatus).toHaveBeenCalledWith(
        10n,
        AppointmentStatus.cancelled,
      ),
    );
    const row = await screen.findByTestId("appointments.item.1");
    expect(within(row).getByTestId("appointments.status_select.1")).toHaveValue(
      "cancelled",
    );
  });

  it("shows a read-only notice for an anonymous caller", async () => {
    const actor = makeActor();
    renderWithActor(<AppointmentsPage />, actor);

    expect(
      await screen.findByTestId("appointments.permission_notice"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("appointments.open_modal_button"),
    ).not.toBeInTheDocument();
  });
});
