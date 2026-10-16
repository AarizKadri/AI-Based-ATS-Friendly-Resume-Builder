import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClassicPreview from "@/components/templates/ClassicPreview";
import { ResumeSection } from "@/types/resume";

export default async function PublicPreviewPage({ params }: { params: { id: string } }) {
  const resume = await prisma.resume.findUnique({ where: { shareSlug: params.id } });
  if (!resume || !resume.isPublic) notFound();

  const sections: ResumeSection[] = JSON.parse(resume.sectionsJson);

  return (
    <main className="min-h-screen bg-ink-50/30 py-10 px-4">
      <div className="max-w-3xl mx-auto mb-4 text-center text-xs text-ink-300">
        Shared read-only view · {resume.title}
      </div>
      <ClassicPreview
        sections={sections}
        accentColor={resume.accentColor}
        fontFamily={resume.fontFamily}
        fontSizePt={resume.fontSizePt}
        readOnly
      />
    </main>
  );
}
