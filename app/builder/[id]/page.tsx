import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import BuilderClient from "./BuilderClient";
import { ResumeSection } from "@/types/resume";

export default async function BuilderPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resume = await prisma.resume.findUnique({ where: { id: params.id } });
  if (!resume || resume.ownerId !== user.id) notFound();

  const sections: ResumeSection[] = JSON.parse(resume.sectionsJson);

  return (
    <BuilderClient
      resumeId={resume.id}
      initialTitle={resume.title}
      initialTemplateId={resume.templateId}
      initialAccentColor={resume.accentColor}
      initialFontFamily={resume.fontFamily}
      initialFontSizePt={resume.fontSizePt}
      initialSections={sections}
      initialIsPublic={resume.isPublic}
    />
  );
}
