import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, HelpCircle, FileText, BarChart3, FileEdit, UserCog, FileSpreadsheet, Upload, Repeat, FileSignature, FolderOpen, Inbox, Hash } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { HelpButton } from './HelpButton';
import { useCognitoAuth } from '@/hooks/useCognitoAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StartGuide } from './StartGuide';
import { useTranslation } from 'react-i18next';

// Navigation organized into logical sections
const getMenuItems = (t: (key: string) => string) => [
  // Overview Section
  { icon: LayoutDashboard, label: t('common.dashboard'), path: "/", section: "overview" },
  { icon: HelpCircle, label: t('common.startGuide'), path: "#guide", isAction: true, section: "overview" },
  
  // Workflows Section
  { icon: Repeat, label: t('common.myPersonalizedWF'), path: "/my-personalized-workflows", section: "workflows" },
  { icon: UserCog, label: t('common.capacity'), path: "/capacity", section: "workflows" },
  
  // Documents Section
  { icon: FileSignature, label: t('common.eSignature'), path: "/esignature", section: "documents" },
  { icon: Inbox, label: t('common.documentQueue'), path: "/cfo-document-queue", adminOrCfo: true, section: "documents" },
  { icon: FolderOpen, label: t('common.documentTemplates'), path: "/document-templates", section: "documents" },
  { icon: Hash, label: t('common.documentSequence'), path: "/document-sequence", section: "documents" },
  
  // Analytics Section
  { icon: BarChart3, label: t('common.analytics'), path: "/analytics", section: "analytics" },
];

// Administration menu with section grouping
const getAdminMenuItems = (t: (key: string) => string) => [
  { icon: Users, label: t('common.userManagement'), path: "/users", section: "admin" },
  { icon: FileText, label: t('common.workflowTemplates'), path: "/templates", section: "admin" },
  { icon: FileSpreadsheet, label: t('common.formTemplates'), path: "/admin/form-templates", section: "admin" },
  { icon: Upload, label: t('common.excelTemplates'), path: "/admin/excel-templates", section: "admin" },
  { icon: FileEdit, label: t('common.sequenceGenerator'), path: "/admin/sequences", section: "admin" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useCognitoAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { t } = useTranslation();
  const { user, signOut } = useCognitoAuth();
  const { user: userWithRole } = useUserRole();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuItems = getMenuItems(t);
  const adminMenuItems = getAdminMenuItems(t);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/94657144/VBJnHGARwdnBRpGK.png" alt="Compawnion" className="h-8 w-8 rounded-full" />
                  <span className="font-semibold tracking-tight truncate">
                    Compawnion
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* Render menu items grouped by section */}
            {['overview', 'workflows', 'documents', 'analytics'].map(section => {
              const sectionItems = menuItems.filter(item => {
                // Filter by section
                if (item.section !== section) return false;
                
                // Hide Document Queue from non-Admin/CFO users
                if ((item as any).adminOrCfo) {
                  return userWithRole && (userWithRole.role === 'CFO' || userWithRole.role === 'admin');
                }
                // Hide Capacity and Analytics from Dept Heads and Staff
                if (['Capacity', 'Analytics'].includes(item.label)) {
                  return userWithRole && ['admin', 'CEO', 'CFO', 'COO', 'Exec Asst'].includes(userWithRole.role);
                }
                return true;
              });
              
              if (sectionItems.length === 0) return null;
              
              const sectionTitles: Record<string, string> = {
                overview: t('common.overview'),
                workflows: t('common.workflows'),
                documents: t('common.documents'),
                analytics: t('common.analytics'),
              };
              
              return (
                <div key={section}>
                  {!isCollapsed && section !== 'overview' && (
                    <div className="px-4 py-2 mt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {sectionTitles[section]}
                      </p>
                    </div>
                  )}
                  <SidebarMenu className="px-2 py-1">
                    {sectionItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (item.isAction && item.path === '#guide') {
                          setGuideOpen(true);
                        } else {
                          setLocation(item.path);
                        }
                      }}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
                    })}
                  </SidebarMenu>
                </div>
              );
            })}
            
            {/* Admin Menu Section */}
            {userWithRole && ['admin', 'CEO', 'CFO', 'COO', 'Exec Asst', 'PPIC', 'Purchasing', 'Finance', 'Sales', 'GA', 'Brand Manager', 'PR Manager'].includes(userWithRole.role) && (
              <>
                {!isCollapsed && (
                  <div className="px-4 py-2 mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('common.administration')}
                    </p>
                  </div>
                )}
                <SidebarMenu className="px-2 py-1">
                  {adminMenuItems.filter(item => {
                    // Only show User Management to Admin and CFO
                    if (item.label === t('common.userManagement')) {
                      return userWithRole && (userWithRole.role === 'admin' || userWithRole.role === 'CFO');
                    }
                    return true;
                  }).map(item => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-10 transition-all font-normal`}
                        >
                          <item.icon
                            className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                          />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            {/* Help/Support Button */}
            <a
              href="https://tech.compawnion.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm group-data-[collapsible=icon]:hidden">{t('common.helpSupport')}</span>
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.fullName || user?.email?.split('@')[0] || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top header with language switcher */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && (
              <>
                <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="tracking-tight text-foreground">
                      {activeMenuItem?.label ?? "Menu"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <LanguageSwitcher />
        </div>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      <HelpButton />
      <StartGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
