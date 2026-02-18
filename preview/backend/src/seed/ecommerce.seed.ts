import { PrismaClient } from "@prisma/client";

export async function seedEcommerce(db: PrismaClient): Promise<void> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: "admin@preview.local" },
  });
  const alice = await db.user.findUniqueOrThrow({
    where: { email: "alice@preview.local" },
  });
  const bob = await db.user.findUniqueOrThrow({
    where: { email: "bob@preview.local" },
  });
  const carol = await db.user.findUniqueOrThrow({
    where: { email: "carol@preview.local" },
  });
  const dave = await db.user.findUniqueOrThrow({
    where: { email: "dave@preview.local" },
  });
  const eve = await db.user.findUniqueOrThrow({
    where: { email: "eve@preview.local" },
  });

  // --- Categories ---
  const electronics = await db.productCategory.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets, devices, and accessories",
      displayOrder: 1,
    },
  });
  const clothing = await db.productCategory.create({
    data: {
      name: "Clothing",
      slug: "clothing",
      description: "Apparel and fashion items",
      displayOrder: 2,
    },
  });
  const homeGarden = await db.productCategory.create({
    data: {
      name: "Home & Garden",
      slug: "home-garden",
      description: "Furniture, decor, and outdoor items",
      displayOrder: 3,
    },
  });

  // --- Products ---
  const products = await Promise.all([
    db.product.create({
      data: {
        title: "Wireless Bluetooth Headphones",
        slug: "wireless-bluetooth-headphones",
        description:
          "Premium noise-cancelling wireless headphones with 30-hour battery life. Features active noise cancellation, transparency mode, and multipoint connection.",
        shortDescription: "Premium ANC headphones with 30hr battery",
        sellerId: admin.id,
        price: 14999,
        compareAtPrice: 19999,
        currency: "usd",
        status: "ACTIVE",
        sku: "ELEC-HP-001",
        stock: 45,
        isFeatured: true,
        publishedAt: new Date("2026-01-15"),
        categories: { create: { categoryId: electronics.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Smart Watch Pro",
        slug: "smart-watch-pro",
        description:
          "Advanced fitness tracking smartwatch with GPS, heart rate monitoring, blood oxygen sensor, and 7-day battery life. Water resistant to 50m.",
        shortDescription: "GPS fitness smartwatch with 7-day battery",
        sellerId: admin.id,
        price: 29999,
        currency: "usd",
        status: "ACTIVE",
        sku: "ELEC-SW-002",
        stock: 30,
        isFeatured: true,
        publishedAt: new Date("2026-01-20"),
        categories: { create: { categoryId: electronics.id } },
      },
    }),
    db.product.create({
      data: {
        title: "USB-C Charging Hub",
        slug: "usb-c-charging-hub",
        description:
          "7-in-1 USB-C hub with HDMI 4K output, 100W power delivery passthrough, SD card reader, and 3x USB-A 3.0 ports.",
        shortDescription: "7-in-1 USB-C hub with 4K HDMI",
        sellerId: admin.id,
        price: 4999,
        currency: "usd",
        status: "ACTIVE",
        sku: "ELEC-HB-003",
        stock: 120,
        publishedAt: new Date("2026-02-01"),
        categories: { create: { categoryId: electronics.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Classic Denim Jacket",
        slug: "classic-denim-jacket",
        description:
          "Timeless medium-wash denim jacket with brass button closure, two chest pockets, and adjustable side tabs. 100% cotton.",
        shortDescription: "Medium-wash denim jacket, 100% cotton",
        sellerId: admin.id,
        price: 7999,
        compareAtPrice: 9999,
        currency: "usd",
        status: "ACTIVE",
        sku: "CLO-DJ-004",
        stock: 60,
        isFeatured: true,
        publishedAt: new Date("2026-01-10"),
        categories: { create: { categoryId: clothing.id } },
        variants: {
          createMany: {
            data: [
              { name: "Small", sku: "CLO-DJ-004-S", stock: 15, options: { size: "S" }, sortOrder: 0 },
              { name: "Medium", sku: "CLO-DJ-004-M", stock: 20, options: { size: "M" }, sortOrder: 1 },
              { name: "Large", sku: "CLO-DJ-004-L", stock: 15, options: { size: "L" }, sortOrder: 2 },
              { name: "XL", sku: "CLO-DJ-004-XL", stock: 10, options: { size: "XL" }, sortOrder: 3 },
            ],
          },
        },
      },
    }),
    db.product.create({
      data: {
        title: "Merino Wool Sweater",
        slug: "merino-wool-sweater",
        description:
          "Lightweight merino wool crewneck sweater. Naturally temperature-regulating, moisture-wicking, and odor-resistant. Machine washable.",
        shortDescription: "Lightweight merino wool crewneck",
        sellerId: admin.id,
        price: 8999,
        currency: "usd",
        status: "ACTIVE",
        sku: "CLO-SW-005",
        stock: 40,
        publishedAt: new Date("2026-01-25"),
        categories: { create: { categoryId: clothing.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Running Shoes Elite",
        slug: "running-shoes-elite",
        description:
          "High-performance running shoes with carbon fiber plate, responsive foam midsole, and engineered mesh upper. Ideal for race day.",
        shortDescription: "Carbon-plated racing shoes",
        sellerId: admin.id,
        price: 17999,
        compareAtPrice: 21999,
        currency: "usd",
        status: "ACTIVE",
        sku: "CLO-SH-006",
        stock: 25,
        publishedAt: new Date("2026-02-05"),
        categories: { create: { categoryId: clothing.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Ceramic Plant Pot Set",
        slug: "ceramic-plant-pot-set",
        description:
          "Set of 3 minimalist ceramic plant pots with drainage holes and bamboo saucers. Matte finish in white, sage, and terracotta.",
        shortDescription: "Set of 3 matte ceramic pots with saucers",
        sellerId: admin.id,
        price: 3499,
        currency: "usd",
        status: "ACTIVE",
        sku: "HG-PP-007",
        stock: 80,
        publishedAt: new Date("2026-01-18"),
        categories: { create: { categoryId: homeGarden.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Ergonomic Desk Lamp",
        slug: "ergonomic-desk-lamp",
        description:
          "LED desk lamp with 5 brightness levels, 3 color temperatures, USB charging port, and flexible gooseneck. Touch control.",
        shortDescription: "Adjustable LED desk lamp with USB port",
        sellerId: admin.id,
        price: 5999,
        currency: "usd",
        status: "ACTIVE",
        sku: "HG-DL-008",
        stock: 55,
        publishedAt: new Date("2026-02-10"),
        categories: { create: { categoryId: homeGarden.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Bamboo Cutting Board",
        slug: "bamboo-cutting-board",
        description:
          "Large organic bamboo cutting board with juice groove and built-in handles. Naturally antimicrobial and knife-friendly.",
        shortDescription: "Large bamboo cutting board with juice groove",
        sellerId: admin.id,
        price: 2499,
        currency: "usd",
        status: "ACTIVE",
        sku: "HG-CB-009",
        stock: 90,
        publishedAt: new Date("2026-01-28"),
        categories: { create: { categoryId: homeGarden.id } },
      },
    }),
    db.product.create({
      data: {
        title: "Portable Bluetooth Speaker",
        slug: "portable-bluetooth-speaker",
        description:
          "Waterproof portable speaker with 360-degree sound, 12-hour battery, and built-in microphone for hands-free calls.",
        shortDescription: "Waterproof speaker with 12hr battery",
        sellerId: admin.id,
        price: 6999,
        currency: "usd",
        status: "DRAFT",
        sku: "ELEC-SP-010",
        stock: 0,
        categories: { create: { categoryId: electronics.id } },
      },
    }),
  ]);

  // --- Orders ---
  const order1 = await db.ecommerceOrder.create({
    data: {
      orderNumber: "ORD-2026-0001",
      userId: alice.id,
      status: "DELIVERED",
      paymentStatus: "PAID",
      subtotal: 22998,
      shippingCost: 999,
      taxAmount: 1840,
      totalAmount: 25837,
      currency: "usd",
      shippingAddress: {
        line1: "123 Main St",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "US",
      },
      billingAddress: {
        line1: "123 Main St",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "US",
      },
      items: {
        createMany: {
          data: [
            {
              productId: products[0].id,
              productTitle: "Wireless Bluetooth Headphones",
              productSlug: "wireless-bluetooth-headphones",
              quantity: 1,
              unitPrice: 14999,
              totalPrice: 14999,
            },
            {
              productId: products[3].id,
              productTitle: "Classic Denim Jacket",
              productSlug: "classic-denim-jacket",
              variantName: "Medium",
              quantity: 1,
              unitPrice: 7999,
              totalPrice: 7999,
            },
          ],
        },
      },
    },
  });

  const order2 = await db.ecommerceOrder.create({
    data: {
      orderNumber: "ORD-2026-0002",
      userId: bob.id,
      status: "PROCESSING",
      paymentStatus: "PAID",
      subtotal: 35998,
      shippingCost: 0,
      taxAmount: 2880,
      totalAmount: 38878,
      currency: "usd",
      shippingAddress: {
        line1: "456 Oak Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        country: "US",
      },
      items: {
        createMany: {
          data: [
            {
              productId: products[1].id,
              productTitle: "Smart Watch Pro",
              productSlug: "smart-watch-pro",
              quantity: 1,
              unitPrice: 29999,
              totalPrice: 29999,
            },
            {
              productId: products[7].id,
              productTitle: "Ergonomic Desk Lamp",
              productSlug: "ergonomic-desk-lamp",
              quantity: 1,
              unitPrice: 5999,
              totalPrice: 5999,
            },
          ],
        },
      },
    },
  });

  // --- Reviews ---
  await db.productReview.createMany({
    data: [
      {
        productId: products[0].id,
        userId: alice.id,
        userName: "Alice Johnson",
        rating: 5,
        comment:
          "Incredible sound quality and the noise cancellation is top-notch. Battery lasts forever.",
      },
      {
        productId: products[0].id,
        userId: bob.id,
        userName: "Bob Smith",
        rating: 4,
        comment:
          "Great headphones overall. Comfortable for long listening sessions. Wish the case was slimmer.",
      },
      {
        productId: products[1].id,
        userId: carol.id,
        userName: "Carol Williams",
        rating: 5,
        comment:
          "Best fitness watch I have owned. GPS accuracy is excellent and the battery easily lasts a week.",
      },
      {
        productId: products[3].id,
        userId: dave.id,
        userName: "Dave Brown",
        rating: 4,
        comment:
          "Classic style, fits true to size. The denim quality is solid for the price.",
      },
      {
        productId: products[6].id,
        userId: eve.id,
        userName: "Eve Davis",
        rating: 5,
        comment:
          "Beautiful pots! The matte finish looks great and the bamboo saucers are a nice touch.",
      },
    ],
  });
}
