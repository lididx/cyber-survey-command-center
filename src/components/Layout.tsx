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
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="citadel-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {!isArchivePage && !isManagementPage && <Button variant="outline" size="sm" onClick={() => navigate("/archive")} className="flex items-center gap-2 citadel-action-button hover:shadow-soft">
                  <Archive className="h-4 w-4" />
                  ארכיון
                </Button>}
              
              {(isArchivePage || isManagementPage) && <Button variant="outline" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2 citadel-action-button hover:shadow-soft">
                  <Home className="h-4 w-4" />
                  דף הבית
                </Button>}

              {profile?.role === "admin" && !isManagementPage && <Button variant="outline" size="sm" onClick={() => navigate("/management")} className="flex items-center gap-2 citadel-action-button hover:shadow-soft">
                  <Settings className="h-4 w-4" />
                  ניהול
                </Button>}
              
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2 citadel-action-button hover:shadow-soft">
                <LogOut className="h-4 w-4" />
                התנתק
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">מערכת לניהול סקרים - Citadel</h1>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {profile && <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-right">
                  <div className="font-semibold text-slate-800">
                    {profile.first_name} {profile.last_name}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {getRoleText(profile.role, profile.gender)}
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:px-8">
        <div className="space-y-1">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
          <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
        </div>
        <div className="mt-6">
          {children}
        </div>
      </main>
    </div>;
};
export default Layout;