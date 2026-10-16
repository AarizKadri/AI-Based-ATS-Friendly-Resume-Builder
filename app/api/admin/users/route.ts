import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { resumes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// PUT { userId, role } — promote/demote admin access.
export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { role } });
  return NextResponse.json({ user: { id: updated.id, role: updated.role } });
}
