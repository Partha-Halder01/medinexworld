import { DoctorApplyScreen } from "@/components/screens/DoctorApplyScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as a Doctor | Medinex World",
  description: "Join Medinex World as a healthcare provider and start managing your practice digitally.",
};

export default function DoctorApplyPage() {
  return <DoctorApplyScreen />;
}
