import { AuthenticatedApp } from "@/components/InternetIdentity";
import { Layout } from "@/components/Layout";
import { vi } from "@/lib/i18n";
import { AccountsPage } from "@/pages/AccountsPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DoctorsPage } from "@/pages/DoctorsPage";
import { MedicinesPage } from "@/pages/MedicinesPage";
import { PatientDetailPage } from "@/pages/PatientDetailPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { PrescriptionsPage } from "@/pages/PrescriptionsPage";
import { RecordsPage } from "@/pages/RecordsPage";
import { RolesPage } from "@/pages/RolesPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <AuthenticatedApp
      title={vi.auth.title}
      description={vi.auth.description}
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground"
      buttonClassName="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground transition-smooth hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
    >
      <Layout>
        <Outlet />
      </Layout>
    </AuthenticatedApp>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const patientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients",
  component: PatientsPage,
});

const patientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patients/$patientId",
  component: PatientDetailPage,
});

const doctorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/doctors",
  component: DoctorsPage,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/appointments",
  component: AppointmentsPage,
});

const recordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/records",
  component: RecordsPage,
});

const prescriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/prescriptions",
  component: PrescriptionsPage,
});

const medicinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/medicines",
  component: MedicinesPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountsPage,
});

const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roles",
  component: RolesPage,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  patientsRoute,
  patientDetailRoute,
  doctorsRoute,
  appointmentsRoute,
  recordsRoute,
  prescriptionsRoute,
  medicinesRoute,
  accountsRoute,
  rolesRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
