import { renderWithActor } from "@/__tests__/test-utils";
import type { Medicine, backendInterface } from "@/backend";
import { UserRole } from "@/backend";
import { MedicinesPage } from "@/pages/MedicinesPage";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function makeMedicine(overrides: Partial<Medicine> = {}): Medicine {
  return {
    id: 1n,
    name: "Paracetamol",
    unit: "viên",
    unitPrice: 1000n,
    stockQuantity: 100n,
    expiryDate: "2030-01-01",
    createdAt: 0n,
    ...overrides,
  };
}

type Actor = Pick<
  backendInterface,
  "listMedicines" | "getCallerUserRole" | "createMedicine" | "updateMedicine"
>;

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    listMedicines: vi.fn<backendInterface["listMedicines"]>(async () => []),
    getCallerUserRole: vi.fn<backendInterface["getCallerUserRole"]>(
      async () => UserRole.admin,
    ),
    createMedicine: vi.fn<backendInterface["createMedicine"]>(async () => ({
      __kind__: "ok",
      ok: makeMedicine(),
    })),
    updateMedicine: vi.fn<backendInterface["updateMedicine"]>(async () => ({
      __kind__: "ok",
      ok: makeMedicine(),
    })),
    ...overrides,
  };
}

describe("MedicinesPage", () => {
  it("shows stock quantity and flags an out-of-stock medicine", async () => {
    const actor = makeActor({
      listMedicines: vi.fn(async () => [
        makeMedicine({ id: 1n, name: "Paracetamol", stockQuantity: 0n }),
      ]),
    });
    renderWithActor(<MedicinesPage />, actor);

    const row = await screen.findByTestId("medicines.row.1");
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(within(row).getAllByText("Sắp hết").length).toBeGreaterThan(0);
  });

  it("flags an expired medicine", async () => {
    const actor = makeActor({
      listMedicines: vi.fn(async () => [
        makeMedicine({
          id: 1n,
          name: "Amoxicillin",
          stockQuantity: 50n,
          expiryDate: "2000-01-01",
        }),
      ]),
    });
    renderWithActor(<MedicinesPage />, actor);

    const row = await screen.findByTestId("medicines.row.1");
    expect(within(row).getAllByText("Đã hết hạn").length).toBeGreaterThan(0);
  });

  it("shows an in-stock medicine without a warning", async () => {
    const actor = makeActor({
      listMedicines: vi.fn(async () => [makeMedicine({ stockQuantity: 100n })]),
    });
    renderWithActor(<MedicinesPage />, actor);

    const row = await screen.findByTestId("medicines.row.1");
    expect(within(row).getByText("Còn hàng")).toBeInTheDocument();
    expect(within(row).queryByText("Sắp hết")).not.toBeInTheDocument();
  });
});
