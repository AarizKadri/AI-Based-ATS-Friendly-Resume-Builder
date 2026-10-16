import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <AdminClient />;
}
