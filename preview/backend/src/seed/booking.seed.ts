import { PrismaClient } from "@prisma/client";

export async function seedBooking(db: PrismaClient): Promise<void> {
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

  // --- Service Categories ---
  const hairCat = await db.serviceCategory.create({
    data: {
      name: "Hair Services",
      slug: "hair-services",
      description: "Haircuts, styling, coloring, and treatments",
      iconName: "scissors",
      displayOrder: 1,
    },
  });
  const wellnessCat = await db.serviceCategory.create({
    data: {
      name: "Wellness",
      slug: "wellness",
      description: "Massage, facials, and relaxation treatments",
      iconName: "heart",
      displayOrder: 2,
    },
  });
  const fitnessCat = await db.serviceCategory.create({
    data: {
      name: "Fitness",
      slug: "fitness",
      description: "Personal training and fitness classes",
      iconName: "dumbbell",
      displayOrder: 3,
    },
  });

  // --- Booking Services ---
  const haircut = await db.bookingService.create({
    data: {
      name: "Classic Haircut",
      slug: "classic-haircut",
      description:
        "Professional haircut including consultation, wash, cut, and style. Suitable for all hair types and lengths.",
      shortDescription: "Consultation, wash, cut, and style",
      price: 4500,
      currency: "usd",
      duration: 45,
      bufferTime: 15,
      capacity: 1,
      status: "ACTIVE",
      isFeatured: true,
      publishedAt: new Date("2026-01-01"),
      categories: { create: { categoryId: hairCat.id } },
    },
  });

  const massage = await db.bookingService.create({
    data: {
      name: "Deep Tissue Massage",
      slug: "deep-tissue-massage",
      description:
        "Therapeutic deep tissue massage targeting chronic muscle tension. Includes hot towel treatment and aromatherapy. 60-minute session.",
      shortDescription: "60-min therapeutic massage with aromatherapy",
      price: 9500,
      currency: "usd",
      duration: 60,
      bufferTime: 15,
      capacity: 1,
      status: "ACTIVE",
      isFeatured: true,
      publishedAt: new Date("2026-01-05"),
      categories: { create: { categoryId: wellnessCat.id } },
    },
  });

  const personalTraining = await db.bookingService.create({
    data: {
      name: "Personal Training Session",
      slug: "personal-training-session",
      description:
        "One-on-one personal training session with a certified trainer. Customized workout plan, form correction, and progress tracking.",
      shortDescription: "1-on-1 certified personal training",
      price: 7500,
      currency: "usd",
      duration: 60,
      bufferTime: 15,
      capacity: 1,
      status: "ACTIVE",
      publishedAt: new Date("2026-01-10"),
      categories: { create: { categoryId: fitnessCat.id } },
    },
  });

  // --- Providers ---
  const provider1 = await db.provider.create({
    data: {
      userId: admin.id,
      bio: "Senior stylist with 12 years of experience in modern cuts and coloring techniques.",
      specialties: ["Hair Styling", "Coloring", "Balayage"],
      isActive: true,
      services: {
        create: { serviceId: haircut.id },
      },
    },
  });

  const provider2 = await db.provider.create({
    data: {
      userId: carol.id,
      bio: "Licensed massage therapist specializing in deep tissue and sports massage. 8 years of practice.",
      specialties: ["Deep Tissue", "Sports Massage", "Swedish"],
      isActive: true,
      services: {
        create: { serviceId: massage.id },
      },
    },
  });

  const provider3 = await db.provider.create({
    data: {
      userId: dave.id,
      bio: "NASM certified personal trainer focused on strength training and functional fitness.",
      specialties: ["Strength Training", "HIIT", "Functional Fitness"],
      isActive: true,
      services: {
        create: { serviceId: personalTraining.id },
      },
    },
  });

  // --- Schedules (weekly recurring) ---
  const weekdays = [1, 2, 3, 4, 5]; // Monday through Friday
  for (const provider of [provider1, provider2, provider3]) {
    for (const day of weekdays) {
      await db.schedule.create({
        data: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          isActive: true,
        },
      });
    }
  }

  // Saturday for provider1 only
  await db.schedule.create({
    data: {
      providerId: provider1.id,
      dayOfWeek: 6,
      startTime: "10:00",
      endTime: "14:00",
      isActive: true,
    },
  });

  // --- Bookings ---
  const bookingDate1 = new Date("2026-02-20");
  const bookingDate2 = new Date("2026-02-22");

  await db.booking.create({
    data: {
      bookingNumber: "BK-PV001",
      userId: alice.id,
      serviceId: haircut.id,
      providerId: provider1.id,
      date: bookingDate1,
      startTime: "10:00",
      endTime: "10:45",
      status: "CONFIRMED",
      totalAmount: 4500,
      currency: "usd",
      notes: "Prefer shorter on the sides",
    },
  });

  await db.booking.create({
    data: {
      bookingNumber: "BK-PV002",
      userId: bob.id,
      serviceId: massage.id,
      providerId: provider2.id,
      date: bookingDate2,
      startTime: "14:00",
      endTime: "15:00",
      status: "PENDING",
      totalAmount: 9500,
      currency: "usd",
      notes: "Focus on lower back area",
    },
  });

  // --- Reviews ---
  await db.bookingReview.createMany({
    data: [
      {
        serviceId: haircut.id,
        providerId: provider1.id,
        userId: alice.id,
        userName: "Alice Johnson",
        rating: 5,
        comment: "Amazing haircut! Exactly what I wanted. Very professional.",
      },
      {
        serviceId: massage.id,
        providerId: provider2.id,
        userId: bob.id,
        userName: "Bob Smith",
        rating: 4,
        comment:
          "Great massage, really helped with my back tension. Will book again.",
      },
    ],
  });
}
