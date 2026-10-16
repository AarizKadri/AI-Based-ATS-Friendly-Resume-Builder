import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedResume(id: string, userId: string) {
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.ownerId !== userId) return null;
  return resume;
}

// GET: list saved snapshots (for the version-compare / restore UI).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await loadOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId: resume.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ versions });
}

// POST { label }: snapshot the resume's current state as a named version.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await loadOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const label = (body?.label as string) || `Snapshot ${new Date().toLocaleString()}`;

  const version = await prisma.resumeVersion.create({
    data: {
      resumeId: resume.id,
      label,
      sectionsJson: resume.sectionsJson,
      templateId: resume.templateId,
    },
  });

  return NextResponse.json({ version }, { status: 201 });
}
