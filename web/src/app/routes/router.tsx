import type { ComponentType } from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import { ConnectionRedirect } from "../../features/connections/components/ConnectionRedirect";
import { ConnectionScope } from "../../features/connections/components/ConnectionScope";
import { ProtectedRoute, PublicOnlyRoute } from "./guards";

// As telas são carregadas sob demanda para manter o bundle inicial enxuto.
const lazyPage = (load: () => Promise<ComponentType>) => async () => ({
  Component: await load(),
});

// Links antigos (/connections/:id/broadcasts) levam à lista com o filtro dessa conexão.
function BroadcastsOfConnection() {
  const { connectionId } = useParams();
  return <Navigate to={`/broadcasts?connection=${connectionId}`} replace />;
}

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        lazy: lazyPage(() =>
          import("../../features/auth/components/AuthPage").then(
            (m) => m.AuthPage,
          ),
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: lazyPage(() =>
              import("../../features/dashboard/DashboardPage").then(
                (m) => m.DashboardPage,
              ),
            ),
          },
          {
            path: "connections",
            lazy: lazyPage(() =>
              import("../../features/connections/ConnectionsPage").then(
                (m) => m.ConnectionsPage,
              ),
            ),
          },
          {
            path: "profile",
            lazy: lazyPage(() =>
              import("../../features/profile/ProfilePage").then(
                (m) => m.ProfilePage,
              ),
            ),
          },
          {
            path: "contacts",
            element: <ConnectionRedirect />,
          },
          {
            path: "broadcasts",
            lazy: lazyPage(() =>
              import("../../features/broadcasts/BroadcastsPage").then(
                (m) => m.BroadcastsPage,
              ),
            ),
          },
          {
            path: "connections/:connectionId",
            element: <ConnectionScope />,
            children: [
              {
                path: "contacts",
                lazy: lazyPage(() =>
                  import("../../features/contacts/ContactsPage").then(
                    (m) => m.ContactsPage,
                  ),
                ),
              },
              { path: "broadcasts", element: <BroadcastsOfConnection /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
