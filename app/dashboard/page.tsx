import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resumes = await prisma.resume.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <DashboardClient
      userName={user.name || "there"}
      initialResumes={resumes.map((r: (typeof resumes)[number]) => ({
        id: r.id,
        title: r.title,
        templateId: r.templateId,
        isTailored: r.isTailored,
        updatedAt: r.updatedAt.toISOString(),
        sectionCount: JSON.parse(r.sectionsJson).length,
      }))}
    />
  );
}
