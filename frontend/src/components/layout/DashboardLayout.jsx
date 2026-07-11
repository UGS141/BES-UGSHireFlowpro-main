import React from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Building2, Briefcase, GraduationCap, Kanban, Handshake,
  BarChart3, Activity, Settings, Bell, Search, Sun, Moon, LogOut, ChevronsLeft, ChevronsRight, User,
  Award, Inbox,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

const ADMIN_NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/candidates", label: "Candidates", icon: Users },
  { to: "/app/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/app/companies", label: "Companies", icon: Building2 },
  { to: "/app/jobs", label: "Job Openings", icon: Briefcase },
  { to: "/app/batches", label: "Batches", icon: GraduationCap },
  { to: "/app/partners", label: "Partners", icon: Handshake, adminOnly: true },
  { to: "/app/employees", label: "Employees", icon: Users, adminOnly: true },
  { to: "/app/placements", label: "Placement Gallery", icon: Award, adminOnly: true },
  { to: "/app/enquiries", label: "Website Enquiries", icon: Inbox, adminOnly: true, badge: "enquiries" },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/activity", label: "Activity Log", icon: Activity },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

const CANDIDATE_NAV = [
  { to: "/me", label: "My Workspace", icon: User, end: true },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState(null);
  const [notifs, setNotifs] = React.useState({ items: [], unread: 0 });
  const [enquiryUnread, setEnquiryUnread] = React.useState(0);

  const NAV = user?.role === "candidate" ? CANDIDATE_NAV
    : ADMIN_NAV.filter(n => !n.adminOnly || user?.role === "admin");

  const fetchNotifs = React.useCallback(async () => {
    try {
      const r = await api.get("/notifications");
      setNotifs(r.data);
    } catch (e) { /* ignore */ }
    try {
      if (user?.role === "admin") {
        const r2 = await api.get("/enquiries/unread-count");
        setEnquiryUnread(r2.data?.unread || 0);
      }
    } catch (e) { /* ignore */ }
  }, [user?.role]);
  React.useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  React.useEffect(() => {
    if (!q || q.length < 2) { setResults(null); return; }
    const t = setTimeout(async () => {
      try { const r = await api.get(`/search/full?q=${encodeURIComponent(q)}`); setResults(r.data); }
      catch { setResults(null); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const initials = (user?.full_name || user?.email || "?").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-[76px]" : "w-64"} shrink-0 hidden md:flex flex-col border-r border-border bg-white dark:bg-slate-900/40 transition-[width] duration-200`}>
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border">
          {collapsed ? (
            <img src="/favicon.png" alt="UGS" className="h-9 w-9 object-contain mx-auto" />
          ) : (
            <div className="flex items-center gap-2.5">
              <img src="/favicon.png" alt="UGS" className="h-10 w-10 object-contain" />
              <div className="leading-none">
                <div className="font-display font-bold tracking-tight bg-gradient-to-r from-[#4A5FBF] via-[#5B8CB5] to-[#3EB489] bg-clip-text text-transparent">UGS HireFlow</div>
                <div className="text-[10px] text-muted-foreground overline mt-0.5">Recruitment OS</div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`sidebar-${n.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover:translate-x-0.5"
                }`}>
              <n.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1">{n.label}</span>}
              {!collapsed && n.badge === "enquiries" && enquiryUnread > 0 && (
                <span className="rounded-full bg-red-500 text-white text-[10px] font-semibold h-5 min-w-[20px] px-1.5 grid place-items-center">{enquiryUnread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60" data-testid="sidebar-collapse">
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> <span>Collapse</span></>}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 glass border-b border-border/60 px-4 md:px-6 flex items-center gap-3">
          <Popover open={!!results && q.length >= 2} onOpenChange={(o) => !o && setResults(null)}>
            <PopoverTrigger asChild>
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search candidates, companies, jobs..."
                  className="pl-9 bg-white/60 dark:bg-slate-900/60 border-border/60"
                  data-testid="global-search-input" />
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[520px] p-0">
              {results && (
                <div className="max-h-96 overflow-y-auto p-2">
                  {["candidates", "companies", "jobs"].map(k => (results[k]?.length ? (
                    <div key={k} className="mb-2">
                      <div className="overline text-xs text-muted-foreground px-2 pt-2 pb-1">{k}</div>
                      {results[k].map(item => (
                        <button key={item.id} className="w-full text-left px-2 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-sm flex items-center justify-between"
                          onClick={() => {
                            setQ(""); setResults(null);
                            if (k === "candidates") navigate(`/app/candidates/${item.id}`);
                            if (k === "companies") navigate(`/app/companies/${item.id}`);
                            if (k === "jobs") navigate(`/app/jobs/${item.id}`);
                            if (k === "employees") navigate(`/app/employees/${item.id}`);
                            if (k === "batches") navigate(`/app/batches/${item.id}`);
                            if (k === "partners") navigate(`/app/candidates?partner_id=${item.id}`);
                          }}>
                          <span>{item.full_name || item.name || item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.candidate_code || item.industry || item.status}</span>
                        </button>
                      ))}
                    </div>
                  ) : null))}
                  {!results.candidates?.length && !results.companies?.length && !results.jobs?.length && !results.employees?.length && !results.batches?.length && !results.partners?.length && (
                    <div className="p-4 text-sm text-muted-foreground text-center">No results</div>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggle} data-testid="theme-toggle">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                <Bell className="h-4 w-4" />
                {notifs.unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] grid place-items-center">{notifs.unread}</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notifs.unread > 0 && (
                  <button onClick={async () => { await api.post("/notifications/mark-all-read"); fetchNotifs(); }}
                    className="text-xs text-primary hover:underline">Mark all read</button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifs.items.length === 0 && <div className="p-4 text-sm text-muted-foreground text-center">No notifications</div>}
              <div className="max-h-80 overflow-y-auto">
                {notifs.items.slice(0, 12).map(n => (
                  <div key={n.id} className={`px-3 py-2 text-sm ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.message}</div>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2" data-testid="user-menu">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{user?.full_name}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <Badge variant="secondary" className="mt-2 capitalize">{user?.role}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="logout-btn"><LogOut className="h-4 w-4 mr-2" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
