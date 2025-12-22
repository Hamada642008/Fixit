import { useState } from "react";
import { CustomerDashboard } from "./CustomerDashboard";
import { TechnicianDashboard } from "./TechnicianDashboard";

interface DashboardProps {
  userProfile: {
    user: any;
    profile: any;
  };
}

export function Dashboard({ userProfile }: DashboardProps) {
  const { profile } = userProfile;

  if (profile.role === "customer") {
    return <CustomerDashboard profile={profile} />;
  } else {
    return <TechnicianDashboard profile={profile} />;
  }
}
