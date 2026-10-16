import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedResume(id: string, userId: string) {
  const resume = await prisma.resume.findUnique({ where: { id } });
  if (!resume || resume.ownerId !== userId) return null;
  return resume;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await loadOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  // Touch lastOpenedAt for "recently opened" sorting on the dashboard.
  await prisma.resume.update({ where: { id: resume.id }, data: { lastOpenedAt: new Date() } });

  return NextResponse.json({ resume });
}

// PUT: full or partial update. Used for autosave, manual save, template
// switching, and rename — the builder debounces calls to this route.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await loadOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.templateId === "string") data.templateId = body.templateId;
  if (typeof body.accentColor === "string") data.accentColor = body.accentColor;
  if (typeof body.fontFamily === "string") data.fontFamily = body.fontFamily;
  if (typeof body.fontSizePt === "number") data.fontSizePt = body.fontSizePt;
  if (Array.isArray(body.sections)) data.sectionsJson = JSON.stringify(body.sections);
  if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;

  const updated = await prisma.resume.update({ where: { id: resume.id }, data });
  return NextResponse.json({ resume: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await loadOwnedResume(params.id, session.user.id);
  if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });

  await prisma.resume.delete({ where: { id: resume.id } });
  return NextResponse.json({ ok: true });
}
