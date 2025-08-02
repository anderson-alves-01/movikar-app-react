import { lazy } from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchProvider } from "@/contexts/SearchContext";
import VehicleComparison from "@/components/vehicle-comparison";
import AuthProvider from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import VehicleDetail from "@/pages/vehicle-detail";
import VehicleEdit from "@/pages/vehicle-edit";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminContracts from "@/pages/admin-contracts";
import AdminVehicleBrands from "@/pages/admin-vehicle-brands";
import AdminVehicleApproval from "@/pages/admin-vehicle-approval";
import AdminDocumentVerification from "@/pages/admin-document-verification";
import AdminUsers from "@/pages/admin-users";
import AdminBookings from "@/pages/admin-bookings";
import AdminDocuments from "@/pages/admin-documents";
import Reservations from "@/pages/reservations";
import Vehicles from "@/pages/vehicles";
import Messages from "@/pages/messages";
import Contracts from "@/pages/contracts";
import Rewards from "@/pages/rewards";
import Suggestions from "@/pages/suggestions";
import DocumentVerification from "@/pages/document-verification";
import PerformanceDashboard from "@/pages/performance-dashboard";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";
import ContractPreview from "@/pages/contract-preview";
import ContractSignedSuccess from "@/pages/contract-signed-success";
import ContractSignatureError from "@/pages/contract-signature-error";
import LoadingDemo from "@/pages/loading-demo";
import AdminSettings from "@/pages/admin-settings";
import AdminCouponsPage from "@/pages/admin-coupons";
import AdminReports from "@/pages/admin-reports";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import EarningsPage from "@/pages/earnings";
import DebugPix from "@/pages/debug-pix";
import SavedVehicles from "@/pages/saved-vehicles";
import SubscriptionPlans from "@/pages/subscription-plans";
import SubscriptionCheckout from "@/pages/subscription-checkout";
import SubscriptionCheckoutDebug from "@/pages/subscription-checkout-debug";
import SubscriptionSuccess from "@/pages/subscription-success";
import TestSubscription from "@/pages/test-subscription";
import DebugAuth from "@/pages/debug-auth";
import AuthDebug from "@/pages/auth-debug";
import NotFound from "@/pages/not-found";
import { InstallPrompt, IOSInstallPrompt } from "@/components/InstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/profile" component={Profile} />
      <Route path="/vehicle/:id" component={VehicleDetail} />
      <Route path="/vehicle/:id/edit" component={VehicleEdit} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/admin/vehicle-brands" component={AdminVehicleBrands} />
      <Route path="/admin/vehicle-approval" component={AdminVehicleApproval} />
      <Route path="/admin/document-verification" component={AdminDocumentVerification} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/documents" component={AdminDocuments} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/vehicles" component={Vehicles} />
      <Route path="/vehicles/create" component={VehicleEdit} />
      <Route path="/my-vehicles" component={Vehicles} />
      <Route path="/dashboard" component={Profile} />
      <Route path="/messages" component={Messages} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/:id" component={ContractPreview} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/suggestions" component={Suggestions} />
      <Route path="/saved-vehicles" component={SavedVehicles} />
      <Route path="/document-verification" component={DocumentVerification} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/checkout/:vehicleId" component={Checkout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/contract-preview/:bookingId" component={ContractPreview} />
      <Route path="/contract-signed-success" component={ContractSignedSuccess} />
      <Route path="/contract-signature-error" component={ContractSignatureError} />
      <Route path="/contract-signature-callback" component={ContractSignedSuccess} />
      <Route path="/loading-demo" component={LoadingDemo} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/coupons" component={AdminCouponsPage} />
      <Route path="/earnings" component={EarningsPage} />
      <Route path="/debug-pix" component={DebugPix} />
      <Route path="/subscription-plans" component={SubscriptionPlans} />
      <Route path="/subscription-checkout" component={SubscriptionCheckout} />
      <Route path="/subscription-checkout-debug" component={SubscriptionCheckoutDebug} />
      <Route path="/subscription-success">
        <ProtectedRoute requireAuth={true}>
          <SubscriptionSuccess />
        </ProtectedRoute>
      </Route>
      <Route path="/test-subscription" component={TestSubscription} />
      <Route path="/test-auth-flow" component={lazy(() => import('@/pages/test-auth-flow'))} />
      <Route path="/debug-auth" component={DebugAuth} />
      <Route path="/auth-debug" component={AuthDebug} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SearchProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <VehicleComparison />
            
            {/* PWA Components */}
            <InstallPrompt />
            <IOSInstallPrompt />
            <OfflineIndicator />
          </TooltipProvider>
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
