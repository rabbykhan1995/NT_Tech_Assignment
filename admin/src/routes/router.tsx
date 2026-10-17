import { createBrowserRouter } from "react-router";
import type { ComponentType } from "react";
import PrivateRoute from "./PrivateRoute";
import PermissionRoute from "./PermissionRoute";

type PageLoader = () => Promise<{ default: ComponentType }>;

const lazyPage =
  (load: PageLoader) =>
    async () => {
      const { default: Component } = await load();
      return { Component };
    };

const lazyProtectedPage =
  (permission: string, load: PageLoader) =>
    async () => {
      const { default: Page } = await load();
      return {
        Component: () => (
          <PermissionRoute permission={permission}>
            <Page />
          </PermissionRoute>
        ),
      };
    };

const lazyRootLayout = async () => {
  const { default: RootLayout } = await import("../layouts/RootLayout");
  return {
    HydrateFallback: () => (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      </div>
    ),
    Component: () => (
      <PrivateRoute>
        <RootLayout />
      </PrivateRoute>
    ),
  };
};

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: lazyRootLayout,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/Dashboard/Dashboard")),
      },

      // Contact
      {
        path: "contact",
        children: [
          {
            path: "supplier",
            lazy: lazyProtectedPage(
              "contact:read",
              () => import("../pages/Contact/Supplier")
            ),
          },
          {
            path: "supplier-ledger/:id",
            lazy: lazyProtectedPage(
              "ledger:read",
              () => import("../pages/Contact/SupplierLedger")
            ),
          },
        ],
      },

      // product
      {
        path: "product",
        children: [
          {
            path: "new",
            lazy: lazyProtectedPage(
              "product:create",
              () => import("../pages/Product/NewProduct")
            ),
          },
          {
            path: "list",
            lazy: lazyProtectedPage(
              "product:read",
              () => import("../pages/Product/ProductList")
            ),
          },
          {
            path: "edit/:id",
            lazy: lazyProtectedPage(
              "product:update",
              () => import("../pages/Product/EditProduct")
            ),
          },
        ],
      },

      // purchase
      {
        path: "purchase",
        children: [
          {
            path: "new",
            lazy: lazyProtectedPage(
              "purchase:create",
              () => import("../pages/Purchase/NewPurchase")
            ),
          },
          {
            path: "list",
            lazy: lazyProtectedPage(
              "purchase:read",
              () => import("../pages/Purchase/PurchaseList")
            ),
          },
          {
            path: "invoice/:id",
            lazy: lazyProtectedPage(
              "purchase:read",
              () => import("../pages/Purchase/PurchaseInvoice")
            ),
          },
        ],
      },

      // Sale
      {
        path: "sale",
        children: [
          {
            path: "new",
            lazy: lazyProtectedPage(
              "sale:create",
              () => import("../pages/Sale/NewSale")
            ),
          },
          {
            path: "list",
            lazy: lazyProtectedPage(
              "sale:read",
              () => import("../pages/Sale/SaleList")
            ),
          },
          {
            path: "invoice/:id",
            lazy: lazyProtectedPage(
              "sale:read",
              () => import("../pages/Sale/SaleInvoice")
            ),
          },
        ],
      },

      // AI Assistant
      {
        path: "ai",
        lazy: lazyProtectedPage(
          "ai:read",
          () => import("../pages/Ai/AiAssistant")
        ),
      },

      // 404 fallback
      {
        path: "*",
        lazy: lazyPage(() => import("../pages/NotFound")),
      },
    ],
  },
  {
    path: "/login",
    lazy: lazyPage(() => import("../pages/Auth/Login")),
  },
]);
