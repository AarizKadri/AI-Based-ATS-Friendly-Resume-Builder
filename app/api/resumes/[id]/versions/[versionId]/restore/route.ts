import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id: params.id } });
  if (!resume || resume.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const version = await prisma.resumeVersion.findUnique({ where: { id: params.versionId } });
  if (!version || version.resumeId !== resume.id) {
    return NextResponse.json({ error: "Version not found." }, { status: 404 });
  }

  const restored = await prisma.resume.update({
    where: { id: resume.id },
    data: { sectionsJson: version.sectionsJson, templateId: version.templateId },
  });

  return NextResponse.json({ resume: restored });
}
