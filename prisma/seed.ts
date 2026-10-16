import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEMPLATES } from "../lib/templates";

const prisma = new PrismaClient();

async function main() {
  for (const t of TEMPLATES) {
    await prisma.template.upsert({
      where: { key: t.id },
      update: { name: t.name, description: t.description, audience: t.audience },
      create: { key: t.id, name: t.name, description: t.description, audience: t.audience },
    });
  }
  console.log(`Seeded ${TEMPLATES.length} templates.`);

  const adminEmail = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash("changeme123", 10),
        role: "ADMIN",
      },
    });
    console.log(`Created demo admin: ${adminEmail} / changeme123 — change this password immediately.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
