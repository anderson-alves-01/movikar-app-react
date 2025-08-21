import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchProvider } from "@/contexts/SearchContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
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
import AdminMessages from "@/pages/admin-messages";
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
import ContractSigned from "@/pages/contract-signed";
import AdminSettings from "@/pages/admin-settings";
import AdminCouponsPage from "@/pages/admin-coupons";
import AdminReports from "@/pages/admin-reports";
import AdminSubscriptions from "@/pages/admin-subscriptions";
import EarningsPage from "@/pages/earnings";
import SavedVehicles from "@/pages/saved-vehicles";
import SubscriptionPlans from "@/pages/subscription-plans";
import SubscriptionCheckout from "@/pages/subscription-checkout";
import SubscriptionSuccess from "@/pages/subscription-success";
import VehicleInspection from "@/pages/vehicle-inspection";
import InspectionHistory from "@/pages/inspection-history";
import StripeProduction from "@/pages/admin/StripeProduction";
import OwnerLeads from "@/pages/owner-leads";
import VehicleBoosts from "@/pages/vehicle-boosts";
import Reviews from "@/pages/reviews";
import Support from "@/pages/support";
import NotFound from "@/pages/not-found";
import { InstallPrompt, IOSInstallPrompt } from "@/components/InstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OnboardingFlow, OnboardingTrigger } from "@/components/onboarding/onboarding-flow";
import { PageTransition } from "@/components/ui/page-transition";
import { useQuery } from "@tanstack/react-query";

function Router() {
  // Fetch feature toggles to conditionally show routes
  const { data: featureToggles } = useQuery({
    queryKey: ['/api/public/feature-toggles'],
    queryFn: async () => {
      const response = await fetch('/api/public/feature-toggles');
      if (!response.ok) {
        throw new Error('Failed to fetch feature toggles');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false
  });

  return (
    <>
      <Switch>
        <Route path="/">
          <>
            <Home />
            <OnboardingFlow page="home" />
          </>
        </Route>
        <Route path="/auth" component={Auth} />
        <Route path="/login" component={Auth} />
        <Route path="/register" component={Auth} />
        <Route path="/profile">
          <>
            <Profile />
            <OnboardingFlow page="profile" />
          </>
        </Route>
        <Route path="/vehicle/:id" component={VehicleDetail} />
        <Route path="/vehicle/:id/edit" component={VehicleEdit} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/contracts" component={AdminContracts} />
        <Route path="/admin/vehicle-brands" component={AdminVehicleBrands} />
        <Route path="/admin/vehicle-approval" component={AdminVehicleApproval} />
        <Route path="/admin/document-verification" component={AdminDocumentVerification} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/documents" component={AdminDocuments} />
        <Route path="/reservations" component={Reservations} />
        <Route path="/vehicles" component={Vehicles} />
        <Route path="/vehicles/create" component={VehicleEdit} />
        <Route path="/add-vehicle" component={VehicleEdit} />
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
        <Route path="/contract-signed" component={ContractSigned} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/reports" component={AdminReports} />
        <Route path="/admin/subscriptions" component={AdminSubscriptions} />
        <Route path="/admin/coupons" component={AdminCouponsPage} />
        <Route path="/admin/stripe-production" component={StripeProduction} />
        {/* Only show earnings route when feature is enabled */}
        {featureToggles?.enableRentNowCheckout && (
          <Route path="/earnings" component={EarningsPage} />
        )}
        <Route path="/subscription-plans" component={SubscriptionPlans} />
        <Route path="/subscription-checkout" component={SubscriptionCheckout} />
        <Route path="/subscription-success">
          <ProtectedRoute requireAuth={true}>
            <SubscriptionSuccess />
          </ProtectedRoute>
        </Route>
        <Route path="/inspection/:reservationId" component={VehicleInspection} />
        <Route path="/inspection-history" component={InspectionHistory} />
        
        {/* New Monetization Routes */}
        <Route path="/owner-leads">
          <ProtectedRoute requireAuth={true}>
            <OwnerLeads />
          </ProtectedRoute>
        </Route>
        <Route path="/vehicles/:vehicleId/boosts">
          <ProtectedRoute requireAuth={true}>
            <VehicleBoosts />
          </ProtectedRoute>
        </Route>
        
        <Route path="/reviews" component={Reviews} />
        <Route path="/support" component={Support} />
        
        <Route component={NotFound} />
      </Switch>
      
      {/* Global onboarding trigger */}
      <OnboardingTrigger />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
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
      </OnboardingProvider>
    </QueryClientProvider>
  );
}

export default App;
