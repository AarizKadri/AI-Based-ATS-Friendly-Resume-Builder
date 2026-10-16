import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

// POST { isPublic: boolean }
// Turns sharing on/off. On first enable, mints a random slug; toggling off
// keeps the slug so re-enabling doesn't break a previously shared link.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resume = await prisma.resume.findUnique({ where: { id: params.id } });
  if (!resume || resume.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const { isPublic } = await req.json();

  const updated = await prisma.resume.update({
    where: { id: resume.id },
    data: {
      isPublic: Boolean(isPublic),
      shareSlug: resume.shareSlug ?? (isPublic ? uuidv4() : null),
    },
  });

  return NextResponse.json({
    isPublic: updated.isPublic,
    shareUrl: updated.shareSlug ? `/preview/${updated.shareSlug}` : null,
  });
}
