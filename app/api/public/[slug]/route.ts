import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/:slug — no auth required. Used by the /preview/:slug page
// to render a shared resume read-only.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const resume = await prisma.resume.findUnique({ where: { shareSlug: params.slug } });

  if (!resume || !resume.isPublic) {
    return NextResponse.json({ error: "This resume link is not available." }, { status: 404 });
  }

  return NextResponse.json({
    title: resume.title,
    accentColor: resume.accentColor,
    fontFamily: resume.fontFamily,
    fontSizePt: resume.fontSizePt,
    sections: JSON.parse(resume.sectionsJson),
  });
}
