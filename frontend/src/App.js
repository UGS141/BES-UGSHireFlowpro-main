import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import api from "@/lib/api";
import "@/App.css";
import { useAuth } from "@/context/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Home from "@/pages/public/Home";
import About from "@/pages/public/About";
import Services from "@/pages/public/Services";
import Contact from "@/pages/public/Contact";
import Register from "@/pages/public/Register";
import Login from "@/pages/auth/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import Candidates from "@/pages/admin/Candidates";
import CandidateDetail from "@/pages/admin/CandidateDetail";
import Employees from "@/pages/admin/Employees";
import EmployeeDetail from "@/pages/admin/EmployeeDetail";
import Companies from "@/pages/admin/Companies";
import CompanyDetail from "@/pages/admin/CompanyDetail";
import Jobs from "@/pages/admin/Jobs";
import JobWorkspace from "@/pages/admin/JobWorkspace";
import Batches from "@/pages/admin/Batches";
import BatchDetail from "@/pages/admin/BatchDetail";
import Partners from "@/pages/admin/Partners";
import PlacementGallery from "@/pages/admin/PlacementGallery";
import Enquiries from "@/pages/admin/Enquiries";
import Pipeline from "@/pages/admin/Pipeline";
import Reports from "@/pages/admin/Reports";
import ActivityFeed from "@/pages/admin/ActivityFeed";
import Settings from "@/pages/admin/Settings";
import CandidateHome from "@/pages/candidate/CandidateHome";

function RequireAuth({ roles }) {
  const { user, logout } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("ugs_token");
    const storedUser = localStorage.getItem("ugs_user");

    if (!token || !storedUser || !user) {
      if (isMounted) {
        setIsValid(false);
        setIsValidating(false);
        logout();
      }
      return;
    }

    setIsValidating(true);
    api.get("/auth/me")
      .then((res) => {
        if (isMounted) {
          const serverUser = res.data;
          if (roles && !roles.includes(serverUser.role)) {
            setIsValid(false);
          } else {
            setIsValid(true);
          }
          setIsValidating(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsValid(false);
          setIsValidating(false);
          logout();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, roles, user, logout]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth roles={["admin", "employee"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/app" element={<AdminDashboard />} />
            <Route path="/app/candidates" element={<Candidates />} />
            <Route path="/app/candidates/:id" element={<CandidateDetail />} />
            <Route path="/app/employees" element={<Employees />} />
            <Route path="/app/employees/:id" element={<EmployeeDetail />} />
            <Route path="/app/companies" element={<Companies />} />
            <Route path="/app/companies/:id" element={<CompanyDetail />} />
            <Route path="/app/jobs" element={<Jobs />} />
            <Route path="/app/jobs/:id" element={<JobWorkspace />} />
            <Route path="/app/batches" element={<Batches />} />
            <Route path="/app/batches/:id" element={<BatchDetail />} />
            <Route path="/app/partners" element={<Partners />} />
            <Route path="/app/placements" element={<PlacementGallery />} />
            <Route path="/app/enquiries" element={<Enquiries />} />
            <Route path="/app/pipeline" element={<Pipeline />} />
            <Route path="/app/reports" element={<Reports />} />
            <Route path="/app/activity" element={<ActivityFeed />} />
            <Route path="/app/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<RequireAuth roles={["candidate"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/me" element={<CandidateHome />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
