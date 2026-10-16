import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/resumes/:id/duplicate
// Powers both plain "duplicate" and "create a tailored version for this job"
// from the dashboard/builder — pass { asTailored: true, jobDescriptionId }
// to mark the copy as a tailored variant that stays linked to its parent.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const original = await prisma.resume.findUnique({ where: { id: params.id } });
  if (!original || original.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const asTailored = Boolean(body?.asTailored);
  const jobDescriptionId = body?.jobDescriptionId as string | undefined;

  const copy = await prisma.resume.create({
    data: {
      ownerId: session.user.id,
      title: asTailored ? `${original.title} (Tailored)` : `${original.title} (Copy)`,
      templateId: original.templateId,
      accentColor: original.accentColor,
      fontFamily: original.fontFamily,
      fontSizePt: original.fontSizePt,
      sectionsJson: original.sectionsJson,
      isTailored: asTailored,
      parentResumeId: original.id,
      jobDescriptionId: jobDescriptionId ?? null,
    },
  });

  return NextResponse.json({ resume: copy }, { status: 201 });
}
