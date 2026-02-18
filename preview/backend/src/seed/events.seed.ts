import { PrismaClient } from "@prisma/client";

export async function seedEvents(db: PrismaClient): Promise<void> {
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
  const techCat = await db.eventCategory.create({
    data: {
      userId: admin.id,
      name: "Technology",
      slug: "technology",
      description: "Tech conferences, hackathons, and meetups",
      color: "#3B82F6",
      sortOrder: 1,
    },
  });

  const workshopCat = await db.eventCategory.create({
    data: {
      userId: admin.id,
      name: "Workshops",
      slug: "workshops",
      description: "Hands-on learning workshops and bootcamps",
      color: "#10B981",
      sortOrder: 2,
    },
  });

  const networkingCat = await db.eventCategory.create({
    data: {
      userId: admin.id,
      name: "Networking",
      slug: "networking",
      description: "Professional networking and social events",
      color: "#8B5CF6",
      sortOrder: 3,
    },
  });

  // --- Venues ---
  const venue1 = await db.eventVenue.create({
    data: {
      userId: admin.id,
      name: "Tech Convention Center",
      address: "800 Convention Blvd",
      city: "San Francisco",
      state: "CA",
      country: "US",
      capacity: 500,
      isVirtual: false,
    },
  });

  const venue2 = await db.eventVenue.create({
    data: {
      userId: admin.id,
      name: "Innovation Hub",
      address: "150 Startup Way",
      city: "Austin",
      state: "TX",
      country: "US",
      capacity: 100,
      isVirtual: false,
    },
  });

  const virtualVenue = await db.eventVenue.create({
    data: {
      userId: admin.id,
      name: "Online via Zoom",
      isVirtual: true,
      meetingUrl: "https://zoom.us/j/preview-meeting",
      capacity: 1000,
    },
  });

  // --- Events ---
  const event1 = await db.event.create({
    data: {
      userId: admin.id,
      categoryId: techCat.id,
      venueId: venue1.id,
      title: "DevOps Summit 2026",
      slug: "devops-summit-2026",
      description:
        "Annual DevOps conference featuring talks on CI/CD, cloud infrastructure, Kubernetes, and site reliability engineering. Two days of keynotes, workshops, and networking.",
      type: "IN_PERSON",
      status: "PUBLISHED",
      startDate: new Date("2026-03-15T09:00:00Z"),
      endDate: new Date("2026-03-16T17:00:00Z"),
      capacity: 300,
      price: 29900,
      currency: "USD",
      isFeatured: true,
    },
  });

  const event2 = await db.event.create({
    data: {
      userId: admin.id,
      categoryId: workshopCat.id,
      venueId: venue2.id,
      title: "React & Next.js Workshop",
      slug: "react-nextjs-workshop",
      description:
        "Hands-on full-day workshop covering React 19, Next.js 15, and modern web development patterns. Bring your laptop and build a complete application from scratch.",
      type: "IN_PERSON",
      status: "PUBLISHED",
      startDate: new Date("2026-03-22T10:00:00Z"),
      endDate: new Date("2026-03-22T17:00:00Z"),
      capacity: 40,
      price: 14900,
      currency: "USD",
      isFeatured: true,
    },
  });

  const event3 = await db.event.create({
    data: {
      userId: admin.id,
      categoryId: networkingCat.id,
      venueId: virtualVenue.id,
      title: "Founders & Funders Virtual Mixer",
      slug: "founders-funders-mixer",
      description:
        "Virtual networking event connecting startup founders with angel investors and VCs. Structured speed-networking rounds followed by open breakout rooms.",
      type: "VIRTUAL",
      status: "PUBLISHED",
      startDate: new Date("2026-04-05T18:00:00Z"),
      endDate: new Date("2026-04-05T20:00:00Z"),
      capacity: 200,
      price: 0,
      currency: "USD",
      isFeatured: false,
    },
  });

  // --- Speakers ---
  await db.eventSpeaker.createMany({
    data: [
      {
        eventId: event1.id,
        userId: admin.id,
        name: "Dr. Alex Rivera",
        email: "alex.rivera@example.com",
        bio: "VP of Platform Engineering at CloudScale. 15 years in distributed systems and SRE.",
        title: "VP of Platform Engineering",
        company: "CloudScale",
        sortOrder: 0,
      },
      {
        eventId: event1.id,
        userId: admin.id,
        name: "Priya Sharma",
        email: "priya.s@example.com",
        bio: "Open-source maintainer and Kubernetes contributor. Author of 'Cloud-Native Patterns'.",
        title: "Principal Engineer",
        company: "KubeWorks",
        sortOrder: 1,
      },
      {
        eventId: event2.id,
        userId: admin.id,
        name: "Jordan Lee",
        email: "jordan.lee@example.com",
        bio: "Senior Developer Advocate at Vercel. React core contributor and educator.",
        title: "Senior Developer Advocate",
        company: "Vercel",
        sortOrder: 0,
      },
    ],
  });

  // --- Registrations (attendees) ---
  await db.eventRegistration.createMany({
    data: [
      {
        eventId: event1.id,
        userId: alice.id,
        status: "CONFIRMED",
        registrationNumber: "REG-2026-0001",
        attendeeName: "Alice Johnson",
        attendeeEmail: "alice@preview.local",
      },
      {
        eventId: event1.id,
        userId: bob.id,
        status: "CONFIRMED",
        registrationNumber: "REG-2026-0002",
        attendeeName: "Bob Smith",
        attendeeEmail: "bob@preview.local",
      },
      {
        eventId: event1.id,
        userId: carol.id,
        status: "PENDING",
        registrationNumber: "REG-2026-0003",
        attendeeName: "Carol Williams",
        attendeeEmail: "carol@preview.local",
      },
      {
        eventId: event2.id,
        userId: dave.id,
        status: "CONFIRMED",
        registrationNumber: "REG-2026-0004",
        attendeeName: "Dave Brown",
        attendeeEmail: "dave@preview.local",
      },
      {
        eventId: event3.id,
        userId: eve.id,
        status: "CONFIRMED",
        registrationNumber: "REG-2026-0005",
        attendeeName: "Eve Davis",
        attendeeEmail: "eve@preview.local",
        notes: "Interested in seed-stage funding discussions",
      },
      {
        eventId: event3.id,
        userId: alice.id,
        status: "WAITLISTED",
        registrationNumber: "REG-2026-0006",
        attendeeName: "Alice Johnson",
        attendeeEmail: "alice@preview.local",
      },
    ],
  });

  // --- Event Settings ---
  await db.eventSettings.create({
    data: {
      userId: admin.id,
      defaultView: "LIST",
      currency: "USD",
      timezone: "America/New_York",
    },
  });
}
