import { HospitalAdminLoginScreen } from "@/components/screens/admin/HospitalAdminLoginScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hospital / Nursing Home Login | Medinex World",
  description: "Sign in to Medinex Hospital & Nursing Home Partner Workspace to manage facility operations, doctors, and patient appointments.",
};

export default function HospitalLoginPage() {
  return <HospitalAdminLoginScreen />;
}
