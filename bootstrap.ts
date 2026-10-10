import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/category-list";

// Runs once when the server starts (see src/instrumentation.ts). Safe to run repeatedly.
//  1) makes sure the category list exists;
//  2) if there is no admin yet and ADMIN_EMAIL + ADMIN_PASSWORD are set, creates the first admin.
// After the first admin exists you can delete ADMIN_PASSWORD from the hosting environment variables.
export async function bootstrap() {
  for (const [slug, nameAr, nameEn] of CATEGORIES) {
    await prisma.category.upsert({ where: { slug }, update: { nameAr, nameEn }, create: { slug, nameAr, nameEn } });
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) return;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin.");
    return;
  }
  if (password.length < 12) {
    console.warn("ADMIN_PASSWORD must be at least 12 characters. Admin account not created.");
    return;
  }

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", emailVerifiedAt: new Date() },
    create: {
      email,
      name: "مدير النظام",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`First admin created: ${email}`);
}
