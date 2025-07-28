import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Archive, Home, Settings } from "lucide-react";
interface LayoutProps {
  children: ReactNode;
}
const Layout = ({
  children
}: LayoutProps) => {
  const {
    profile,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  const isArchivePage = location.pathname === "/archive";
  const isManagementPage = location.pathname === "/management";
  const getRoleText = (role: string, gender: string) => {
    if (role === "surveyor") return gender === "female" ? "סוקרת" : "סוקר";
    if (role === "manager") return gender === "female" ? "מנהלת" : "מנהל";
    if (role === "admin") return "מנהל מערכת";
    return role;
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {!isArchivePage && !isManagementPage && <Button variant="outline" size="sm" onClick={() => navigate("/archive")} className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  ארכיון
                </Button>}
              
              {(isArchivePage || isManagementPage) && <Button variant="outline" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  דף הבית
                </Button>}

              {profile?.role === "admin" && !isManagementPage && <Button variant="outline" size="sm" onClick={() => navigate("/management")} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  ניהול
                </Button>}
              
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                התנתק
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <h1 className="text-xl font-bold text-primary">מערכת לניהול סקרים - Citadel</h1>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {profile && <div className="text-sm text-muted-foreground text-right">
                  <div className="font-medium">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-xs">
                    {getRoleText(profile.role, profile.gender)}
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>;
};
export default Layout;