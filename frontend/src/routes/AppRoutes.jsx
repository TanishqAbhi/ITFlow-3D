import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import CustomerLayout from '../components/layout/CustomerLayout';
import AdminLayout from '../components/layout/AdminLayout';
import StaffLayout from '../components/layout/StaffLayout';
import ProtectedRoute from './ProtectedRoute';

// Customer Pages
import Home3D from '../pages/customer/Home3D';
import ProductCatalog from '../pages/customer/ProductCatalog';
import ProductDetail3D from '../pages/customer/ProductDetail3D';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import CustomerAccount from '../pages/customer/CustomerAccount';
import OrderDetailPage from '../pages/customer/OrderDetailPage';

// Auth Pages
import CustomerLogin from '../pages/auth/CustomerLogin';
import CustomerRegister from '../pages/auth/CustomerRegister';
import StaffLogin from '../pages/auth/StaffLogin';
import AdminLogin from '../pages/auth/AdminLogin';

// Super Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import StaffManagement from '../pages/admin/StaffManagement';
import ProductApprovals from '../pages/admin/ProductApprovals';
import OrderControl from '../pages/admin/OrderControl';
import AuditLogs from '../pages/admin/AuditLogs';
import AdminSettings from '../pages/admin/AdminSettings';

// Staff Operations Pages
import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffProductCatalog from '../pages/staff/StaffProductCatalog';
import StaffInventoryManager from '../pages/staff/StaffInventoryManager';
import StaffOrderFulfillment from '../pages/staff/StaffOrderFulfillment';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Customer Storefront Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home3D />} />
        <Route path="/store" element={<ProductCatalog />} />
        <Route path="/store/product/:slug" element={<ProductDetail3D />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Authenticated Customer Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/account"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <CustomerAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders/:orderNumber"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 2. Authentication Interfaces */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 3. Super Admin Portal (Strict ADMIN RBAC) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="approvals" element={<ProductApprovals />} />
        <Route path="orders" element={<OrderControl />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 4. Staff Operations Portal (Strict STAFF & ADMIN RBAC) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StaffDashboard />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="products" element={<StaffProductCatalog />} />
        <Route path="inventory" element={<StaffInventoryManager />} />
        <Route path="orders" element={<StaffOrderFulfillment />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
