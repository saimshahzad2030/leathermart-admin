import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { RoleRoute } from '@/components/layout/RoleRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

import { Login } from '@/pages/auth/Login';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { ProductList } from '@/pages/products/ProductList';
import { ProductForm } from '@/pages/products/ProductForm';
import { ReviewsModeration } from '@/pages/reviews/ReviewsModeration';
import { CategoriesList } from '@/pages/categories/CategoriesList';
import { CommissionList } from '@/pages/commissions/CommissionList';
import { BespokeStudioOptions } from '@/pages/bespoke-studio/BespokeStudioOptions';
import { CmsSectionsList } from '@/pages/cms/CmsSectionsList';
import { TestimonialsList } from '@/pages/cms/TestimonialsList';
import { SocialLooksList } from '@/pages/cms/SocialLooksList';
import { SubscribersList } from '@/pages/subscribers/SubscribersList';
import { MediaLibrary } from '@/pages/media/MediaLibrary';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { UsersList } from '@/pages/users/UsersList';
import { ProfilePage } from '@/pages/profile/ProfilePage';

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/new" element={<ProductForm />} />
                    <Route path="/products/edit/:id" element={<ProductForm />} />
                    <Route path="/reviews" element={<ReviewsModeration />} />
                    <Route path="/categories" element={<CategoriesList />} />
                    <Route path="/commissions" element={<CommissionList />} />
                    <Route path="/bespoke-studio" element={<BespokeStudioOptions />} />
                    <Route path="/cms" element={<CmsSectionsList />} />
                    <Route path="/testimonials" element={<TestimonialsList />} />
                    <Route path="/social-looks" element={<SocialLooksList />} />
                    <Route path="/subscribers" element={<SubscribersList />} />
                    <Route path="/media" element={<MediaLibrary />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Role-Gated: Super Admin Only */}
                    <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
                      <Route path="/users" element={<UsersList />} />
                    </Route>
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
