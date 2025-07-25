import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import VehicleComparison from "@/components/vehicle-comparison";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import VehicleDetail from "@/pages/vehicle-detail";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminContracts from "@/pages/admin-contracts";
import AdminVehicleBrands from "@/pages/admin-vehicle-brands";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/profile" component={Profile} />
      <Route path="/vehicle/:id" component={VehicleDetail} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/contracts" component={AdminContracts} />
      <Route path="/admin/vehicle-brands" component={AdminVehicleBrands} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/documents" component={AdminDocuments} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/vehicles" component={Vehicles} />
      <Route path="/messages" component={Messages} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/:id" component={ContractPreview} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/suggestions" component={Suggestions} />
      <Route path="/document-verification" component={DocumentVerification} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/checkout/:vehicleId" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/contract-preview/:bookingId" component={ContractPreview} />
      <Route path="/contract-signed-success" component={ContractSignedSuccess} />
      <Route path="/contract-signature-error" component={ContractSignatureError} />
      <Route path="/contract-signature-callback" component={ContractSignedSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <VehicleComparison />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
