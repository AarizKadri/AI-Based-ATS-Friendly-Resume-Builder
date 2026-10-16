import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwned(id: string, userId: string) {
  const letter = await prisma.coverLetter.findUnique({ where: { id } });
  if (!letter || letter.ownerId !== userId) return null;
  return letter;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const letter = await loadOwned(params.id, session.user.id);
  if (!letter) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.coverLetter.update({
    where: { id: letter.id },
    data: {
      ...(typeof body.title === "string" ? { title: body.title } : {}),
      ...(typeof body.bodyMarkdown === "string" ? { bodyMarkdown: body.bodyMarkdown } : {}),
      ...(typeof body.tone === "string" ? { tone: body.tone } : {}),
    },
  });
  return NextResponse.json({ letter: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const letter = await loadOwned(params.id, session.user.id);
  if (!letter) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.coverLetter.delete({ where: { id: letter.id } });
  return NextResponse.json({ ok: true });
}
