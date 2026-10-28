import { renderWithActor } from "@/__tests__/test-utils";
import type { backendInterface } from "@/backend";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * Render a page that uses TanStack Router primitives (Link, getRouteApi) inside
 * a real memory router, so router context is available without the app shell.
 */
export function renderPageWithRouter<K extends keyof backendInterface>(
  page: ReactElement,
  actor: Pick<backendInterface, K>,
  path = "/",
) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => page,
  });
  const patientDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/patients/$patientId",
    component: () => page,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, patientDetailRoute]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return renderWithActor(<RouterProvider router={router} />, actor);
}
