import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { USER_ROLES } from './utils/constants';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { WaiterLayout } from './layouts/WaiterLayout';

// Public & Error Pages
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { Tables } from './pages/admin/Tables';
import { Products } from './pages/admin/Products';
import { Categories } from './pages/admin/Categories';
import { Waiters } from './pages/admin/Waiters';
import { Discounts } from './pages/admin/Discounts';
import { Orders } from './pages/admin/Orders';
import { Bills } from './pages/admin/Bills';
import { Sales } from './pages/admin/Sales';
import { OwnersAndAdmins } from './pages/admin/OwnersAndAdmins';
import { ContactUs } from './pages/ContactUs';

// Waiter Pages
import { WaiterTables } from './pages/waiter/WaiterTables';
import { OrderPage } from './pages/waiter/OrderPage';
import { WaiterOrders } from './pages/waiter/WaiterOrders';
import { WaiterBills } from './pages/waiter/WaiterBills';
import { Billing } from './pages/waiter/Billing';
import { Payment } from './pages/waiter/Payment';

export default function App() {
  const { user, isAdmin, isWaiter } = useAuth();

  return (
    <Routes>
      {/* Root redirect based on auth status */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : isAdmin ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/waiter/tables" replace />
          )
        }
      />

      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Admin Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tables" element={<Tables />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="waiters" element={<Waiters />} />
        <Route path="discounts" element={<Discounts />} />
        <Route path="orders" element={<Orders />} />
        <Route path="bills" element={<Bills />} />
        <Route path="sales" element={<Sales />} />
        <Route
          path="owners-admins"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.OWNER]}>
              <OwnersAndAdmins />
            </ProtectedRoute>
          }
        />
        <Route path="contact-us" element={<ContactUs />} />
      </Route>

      {/* Waiter Protected Routes */}
      <Route
        path="/waiter"
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.WAITER, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <WaiterLayout />
          </ProtectedRoute>
        }
      >
        <Route path="tables" element={<WaiterTables />} />
        <Route path="table/:id" element={<OrderPage />} />
        <Route path="orders" element={<WaiterOrders />} />
        <Route path="bills" element={<WaiterBills />} />
        <Route path="bill/:id" element={<Billing />} />
        <Route path="payment/:id" element={<Payment />} />
        <Route path="contact-us" element={<ContactUs />} />
      </Route>

      {/* Authorization & Fallback Pages */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
