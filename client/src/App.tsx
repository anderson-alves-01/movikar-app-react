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
import Reservations from "@/pages/reservations";
import Vehicles from "@/pages/vehicles";
import Messages from "@/pages/messages";
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
      <Route path="/reservations" component={Reservations} />
      <Route path="/vehicles" component={Vehicles} />
      <Route path="/messages" component={Messages} />
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
