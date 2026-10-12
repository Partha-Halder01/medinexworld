import { HospitalAdminLoginScreen } from "@/components/screens/admin/HospitalAdminLoginScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital Partner Login | Medinex World",
  description: "Sign in to the Medinex Hospital Partner Workspace to manage your medical facility, doctors, and patient OPD appointments.",
};

export default function HospitalAdminLoginPage() {
  return <HospitalAdminLoginScreen />;
}
