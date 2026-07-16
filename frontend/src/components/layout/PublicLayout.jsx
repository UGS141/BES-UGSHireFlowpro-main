import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/context/ThemeContext";

export function PublicLayout() {
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  const { theme, toggle } = useTheme();
  React.useEffect(() => setOpen(false), [loc.pathname]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" data-testid="brand-logo">
            <img src="/bes_logo.png" alt="BES" className="h-10 w-10 object-contain" />
            <div className="leading-none">
              <div className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-[#4A5FBF] via-[#5B8CB5] to-[#3EB489] bg-clip-text text-transparent">
                BES Info Tech
              </div>
              <div className="text-[10px] text-muted-foreground overline mt-0.5">Placements Since 2010</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === "/"} data-testid={`nav-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `text-sm font-medium link-underline ${isActive ? "text-primary" : "text-slate-700 dark:text-slate-200 hover:text-primary"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} data-testid="public-theme-toggle" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link to="/login"><Button variant="ghost" data-testid="nav-login-btn">Sign in</Button></Link>
            <Link to="/register">
              <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20" data-testid="nav-register-btn">
                Register <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-btn">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border/60 px-6 py-4 space-y-3 bg-background">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="block text-sm font-medium">{l.label}</Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Sign in</Button></Link>
              <Link to="/register" className="flex-1"><Button className="w-full">Register</Button></Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="mt-24 bg-slate-950 text-slate-300">
        <div className="mx-auto max-w-7xl px-6 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/bes_logo.png" alt="BES" className="h-11 w-11 object-contain" />
              <div className="font-display font-bold text-3xl text-white tracking-tighter">BES Info Tech</div>
            </div>
            <p className="mt-3 text-sm text-slate-400 max-w-md leading-relaxed">
              India&apos;s trusted placement partner since 2010. Helping students and professionals build careers with leading companies.
            </p>
          </div>
          <div>
            <div className="overline text-slate-400 mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services" className="hover:text-white">Services</Link></li>
              <li><Link to="/register" className="hover:text-white">Register</Link></li>
              <li><Link to="/login" className="hover:text-white">Login</Link></li>
            </ul>
          </div>
          <div>
            <div className="overline text-slate-400 mb-3">Company</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          © 2026 BES Consultancy · Powered by BES Info Tech
        </div>
      </footer>
    </div>
  );
}
