import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Archive, Home, Settings, BarChart3, Shield, FileText, ChevronDown, Key } from "lucide-react";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
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
  const [showChangePassword, setShowChangePassword] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  const currentPath = location.pathname;
  const getRoleText = (role: string, gender: string) => {
    if (role === "surveyor") return gender === "female" ? "סוקרת" : "סוקר";
    if (role === "manager") return gender === "female" ? "מנהלת" : "מנהל";
    if (role === "admin") return "מנהל מערכת";
    return role;
  };
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Button 
                variant={currentPath === "/" ? "default" : "outline"} 
                size="sm" 
                onClick={() => navigate("/")} 
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                עמוד הבית
              </Button>

              <Button 
                variant={currentPath === "/statistics" ? "default" : "outline"} 
                size="sm" 
                onClick={() => navigate("/statistics")} 
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                סטטיסטיקה
              </Button>

              <Button 
                variant={currentPath === "/cve" ? "default" : "outline"} 
                size="sm" 
                onClick={() => navigate("/cve")} 
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                CVE
              </Button>

              <Button 
                variant={currentPath === "/findings-templates" ? "default" : "outline"} 
                size="sm" 
                onClick={() => navigate("/findings-templates")} 
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                ממצאים
              </Button>

              <Button 
                variant={currentPath === "/archive" ? "default" : "outline"} 
                size="sm" 
                onClick={() => navigate("/archive")} 
                className="flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                ארכיון
              </Button>

              {profile?.role === "admin" && (
                <Button 
                  variant={currentPath === "/management" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => navigate("/management")} 
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  ניהול
                </Button>
              )}
              
              <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                התנתק
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <h1 className="text-xl font-bold text-primary">מערכת לניהול סקרים - Citadel</h1>
            </div>
            
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {profile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="text-right">
                        <div className="font-medium">
                          {profile.first_name} {profile.last_name}
                        </div>
                        <div className="text-xs">
                          {getRoleText(profile.role, profile.gender)}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setShowChangePassword(true)} className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      החלף סיסמה
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
                      <LogOut className="h-4 w-4" />
                      התנתק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:px-[25px]">
        {children}
      </main>

      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
    </div>;
};
export default Layout;