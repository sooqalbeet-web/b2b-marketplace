import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Password123!", 12);

  const cats = [
    ["electronics", "إلكترونيات", "Electronics"],
    ["textiles", "منسوجات وملابس", "Textiles & Apparel"],
    ["machinery", "آلات ومعدات", "Machinery"],
    ["furniture", "أثاث", "Furniture"],
    ["packaging", "تغليف", "Packaging"],
    ["building", "مواد بناء", "Building Materials"],
  ];
  const catRows: Awaited<ReturnType<typeof prisma.category.upsert>>[] = [];
  for (const [slug, nameAr, nameEn] of cats) {
    catRows.push(await prisma.category.upsert({ where: { slug }, update: {}, create: { slug, nameAr, nameEn } }));
  }
  const cat = (slug: string) => catRows.find((c) => c.slug === slug)!;

  await prisma.user.upsert({
    where: { email: "admin@example.com" }, update: {},
    create: { email: "admin@example.com", name: "مدير النظام", passwordHash: hash, role: "ADMIN", emailVerifiedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: "buyer@example.com" }, update: {},
    create: { email: "buyer@example.com", name: "مشترٍ تجريبي", passwordHash: hash, role: "CLIENT", phone: "0790000000", emailVerifiedAt: new Date() },
  });

  const factories = [
    { sku3: "001", email: "factory1@example.com", name: "شركة برايت تك للإلكترونيات", region: "عمّان", cat: "electronics", verification: "VERIFIED" as const,
      description: "مصنّع لشواحن وكابلات وإكسسوارات ذكية بنظام OEM/ODM.", address: "المدينة الصناعية، عمّان",
      product: { name: "شاحن سريع GaN بقدرة 65 واط", sku: "GAN-65", moq: 500, leadTimeDays: 20 } },
    { sku3: "002", email: "factory2@example.com", name: "مجموعة الوادي للنسيج", region: "إربد", cat: "textiles", verification: "VERIFIED" as const,
      description: "أقمشة منسوجة وحياكة وإنتاج ملابس بالجملة.", address: "المنطقة الصناعية، إربد",
      product: { name: "قماش بوبلين قطني (بالمتر)", sku: "CTN-POP", moq: 2000, leadTimeDays: 15, unit: "م" } },
    { sku3: "003", email: "factory3@example.com", name: "مصنع الإتقان للأثاث", region: "الزرقاء", cat: "furniture", verification: "UNVERIFIED" as const,
      description: "أثاث مكاتب وفنادق.", address: "المنطقة الحرة، الزرقاء",
      product: { name: "كرسي مكتب مريح", sku: "CHAIR-E1", moq: 100, leadTimeDays: 30 } },
  ];

  for (const f of factories) {
    const user = await prisma.user.upsert({
      where: { email: f.email }, update: {},
      create: { email: f.email, name: f.name, passwordHash: hash, role: "FACTORY", phone: "0791000000", emailVerifiedAt: new Date() },
    });
    const factory = await prisma.factory.upsert({
      where: { userId: user.id }, update: {},
      create: { userId: user.id, commercialRegNo: `DEMO-${f.sku3}`, taxNo: `10${f.sku3}00`, name: f.name, region: f.region, description: f.description, address: f.address, verification: f.verification },
    });
    await prisma.factoryCategory.upsert({
      where: { factoryId_categoryId: { factoryId: factory.id, categoryId: cat(f.cat).id } },
      update: {}, create: { factoryId: factory.id, categoryId: cat(f.cat).id },
    });
    await prisma.product.upsert({
      where: { factoryId_sku: { factoryId: factory.id, sku: f.product.sku } }, update: {},
      create: { factoryId: factory.id, categoryId: cat(f.cat).id, ...f.product, inventory: { create: { currentQuantity: 1000 } } },
    });
  }
  console.log("Seeded. All demo accounts use password: Password123!");
  console.log("admin@example.com | buyer@example.com | factory1@example.com ... factory3@example.com");
}

main().finally(() => prisma.$disconnect());
