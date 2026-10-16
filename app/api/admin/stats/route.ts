import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userCount, resumeCount, coverLetterCount, jobMatchCount, openFeedback] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.coverLetter.count(),
    prisma.jobMatch.count(),
    prisma.feedback.count({ where: { status: "open" } }),
  ]);

  return NextResponse.json({ userCount, resumeCount, coverLetterCount, jobMatchCount, openFeedback });
}
