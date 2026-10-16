import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDefaultResumeSections } from "@/types/resume";

// GET /api/resumes?query=&sort=updated
// Lists the current user's resumes for the dashboard, with optional
// search-by-title and sort.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.trim() || "";
  const sort = searchParams.get("sort") || "updated";

  const resumes = await prisma.resume.findMany({
    where: {
      ownerId: session.user.id,
      ...(query ? { title: { contains: query } } : {}),
    },
    orderBy: sort === "updated" ? { updatedAt: "desc" } : { createdAt: "desc" },
  });

  return NextResponse.json({
    resumes: resumes.map((r: (typeof resumes)[number]) => ({
      id: r.id,
      title: r.title,
      templateId: r.templateId,
      isTailored: r.isTailored,
      updatedAt: r.updatedAt,
      // Rough progress heuristic: fraction of sections that have any content.
      sections: JSON.parse(r.sectionsJson).length,
    })),
  });
}

// POST /api/resumes  { title? }
// Creates a new resume pre-populated with the default MVP section set.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = (body?.title as string) || "Untitled Resume";

  const resume = await prisma.resume.create({
    data: {
      ownerId: session.user.id,
      title,
      sectionsJson: JSON.stringify(createDefaultResumeSections()),
    },
  });

  return NextResponse.json({ resume }, { status: 201 });
}
