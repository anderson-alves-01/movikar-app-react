import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Car, FileText, Settings, Users, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  {
    href: "/admin/contracts",
    label: "Contratos",
    icon: FileText,
  },
  {
    href: "/admin/vehicle-brands",
    label: "Marcas de Veículos",
    icon: Car,
  },
  {
    href: "/admin/users",
    label: "Usuários",
    icon: Users,
  },
  {
    href: "/admin/settings",
    label: "Configurações",
    icon: Settings,
  },
];

function AdminSidebar({ className = "" }: { className?: string }) {
  const [location] = useLocation();

  return (
    <div className={`w-64 bg-background border-r ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground">Painel Admin</h2>
      </div>
      
      <nav className="px-4 space-y-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <Link href="/">
          <Button variant="outline" className="w-full">
            Voltar ao Site
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AdminHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold">CarShare Admin</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              Ver Site
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar className="hidden md:flex md:flex-col md:fixed md:inset-y-0" />
        
        <div className="flex-1 md:ml-64">
          <AdminHeader />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}