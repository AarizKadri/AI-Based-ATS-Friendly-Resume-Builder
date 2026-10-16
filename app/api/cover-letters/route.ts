import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const letters = await prisma.coverLetter.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ letters });
}
