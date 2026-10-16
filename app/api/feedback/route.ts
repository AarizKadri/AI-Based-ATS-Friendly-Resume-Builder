import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST { type, message } — "Report a problem" / "User feedback form".
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const { type, message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: user?.id ?? null,
      type: type && ["bug", "feedback", "feature_request"].includes(type) ? type : "feedback",
      message,
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

// GET — admin-only list, powers "Manage reported issues".
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ items });
}
