import { PrismaClient } from "@prisma/client";

export async function seedLms(db: PrismaClient): Promise<void> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: "admin@preview.local" },
  });
  const alice = await db.user.findUniqueOrThrow({
    where: { email: "alice@preview.local" },
  });
  const bob = await db.user.findUniqueOrThrow({
    where: { email: "bob@preview.local" },
  });

  // --- Categories ---
  const webDev = await db.category.create({
    data: {
      name: "Web Development",
      slug: "web-development",
      description: "Frontend and backend web development courses",
      iconName: "code",
      displayOrder: 1,
    },
  });
  const design = await db.category.create({
    data: {
      name: "Design",
      slug: "design",
      description: "UI/UX design and visual arts",
      iconName: "palette",
      displayOrder: 2,
    },
  });
  const dataSci = await db.category.create({
    data: {
      name: "Data Science",
      slug: "data-science",
      description: "Data analysis, ML, and AI fundamentals",
      iconName: "chart-bar",
      displayOrder: 3,
    },
  });

  // --- Courses ---
  const course1 = await db.course.create({
    data: {
      title: "Modern React with TypeScript",
      slug: "modern-react-typescript",
      description:
        "Master React 19 and TypeScript from the ground up. Build real-world applications using hooks, context, server components, and the latest patterns. Includes hands-on projects.",
      shortDescription: "Build production React apps with TypeScript",
      instructorId: admin.id,
      price: 4999,
      compareAtPrice: 7999,
      currency: "usd",
      status: "PUBLISHED",
      level: "intermediate",
      language: "en",
      duration: 720,
      isFeatured: true,
      publishedAt: new Date("2026-01-10"),
      categories: { create: { categoryId: webDev.id } },
    },
  });

  const course2 = await db.course.create({
    data: {
      title: "UI/UX Design Fundamentals",
      slug: "ui-ux-design-fundamentals",
      description:
        "Learn the principles of user interface and user experience design. Covers wireframing, prototyping, usability testing, and design systems. No prior design experience needed.",
      shortDescription: "Learn UI/UX design from scratch",
      instructorId: admin.id,
      price: 3999,
      currency: "usd",
      status: "PUBLISHED",
      level: "beginner",
      language: "en",
      duration: 480,
      isFeatured: true,
      publishedAt: new Date("2026-01-20"),
      categories: { create: { categoryId: design.id } },
    },
  });

  const course3 = await db.course.create({
    data: {
      title: "Python for Data Analysis",
      slug: "python-data-analysis",
      description:
        "Dive into data analysis with Python. Covers NumPy, Pandas, Matplotlib, and Seaborn. Work through real datasets and build interactive dashboards.",
      shortDescription: "Data analysis with Python, Pandas, and visualization",
      instructorId: admin.id,
      price: 5999,
      currency: "usd",
      status: "PUBLISHED",
      level: "beginner",
      language: "en",
      duration: 600,
      publishedAt: new Date("2026-02-01"),
      categories: { create: { categoryId: dataSci.id } },
    },
  });

  // --- Sections & Lessons for Course 1 ---
  const c1s1 = await db.section.create({
    data: {
      courseId: course1.id,
      title: "Getting Started",
      description: "Environment setup and React fundamentals",
      sortOrder: 0,
    },
  });
  const c1s2 = await db.section.create({
    data: {
      courseId: course1.id,
      title: "Components & Hooks",
      description: "Deep dive into React components and hooks",
      sortOrder: 1,
    },
  });
  const c1s3 = await db.section.create({
    data: {
      courseId: course1.id,
      title: "Advanced Patterns",
      description: "Server components, suspense, and performance",
      sortOrder: 2,
    },
  });

  await db.lesson.createMany({
    data: [
      { sectionId: c1s1.id, title: "Course Introduction", type: "VIDEO", duration: 10, sortOrder: 0, isFree: true, contentUrl: "https://example.com/videos/intro.mp4" },
      { sectionId: c1s1.id, title: "Setting Up Your Environment", type: "TEXT", duration: 15, sortOrder: 1, contentText: "## Prerequisites\n\nInstall Node.js 20+ and your preferred code editor..." },
      { sectionId: c1s1.id, title: "Your First React App", type: "VIDEO", duration: 25, sortOrder: 2, contentUrl: "https://example.com/videos/first-app.mp4" },
      { sectionId: c1s2.id, title: "Functional Components", type: "VIDEO", duration: 30, sortOrder: 0, contentUrl: "https://example.com/videos/functional.mp4" },
      { sectionId: c1s2.id, title: "useState and useEffect", type: "VIDEO", duration: 35, sortOrder: 1, contentUrl: "https://example.com/videos/hooks.mp4" },
      { sectionId: c1s2.id, title: "Custom Hooks", type: "VIDEO", duration: 25, sortOrder: 2, contentUrl: "https://example.com/videos/custom-hooks.mp4" },
      { sectionId: c1s3.id, title: "React Server Components", type: "VIDEO", duration: 40, sortOrder: 0, contentUrl: "https://example.com/videos/rsc.mp4" },
      { sectionId: c1s3.id, title: "Suspense and Streaming", type: "VIDEO", duration: 30, sortOrder: 1, contentUrl: "https://example.com/videos/suspense.mp4" },
    ],
  });

  // --- Sections & Lessons for Course 2 ---
  const c2s1 = await db.section.create({
    data: {
      courseId: course2.id,
      title: "Design Principles",
      description: "Core principles of good design",
      sortOrder: 0,
    },
  });
  const c2s2 = await db.section.create({
    data: {
      courseId: course2.id,
      title: "Wireframing & Prototyping",
      description: "From ideas to interactive prototypes",
      sortOrder: 1,
    },
  });

  await db.lesson.createMany({
    data: [
      { sectionId: c2s1.id, title: "What is UX Design?", type: "VIDEO", duration: 15, sortOrder: 0, isFree: true, contentUrl: "https://example.com/videos/ux-intro.mp4" },
      { sectionId: c2s1.id, title: "Visual Hierarchy", type: "VIDEO", duration: 20, sortOrder: 1, contentUrl: "https://example.com/videos/visual-hierarchy.mp4" },
      { sectionId: c2s1.id, title: "Color Theory for UI", type: "VIDEO", duration: 25, sortOrder: 2, contentUrl: "https://example.com/videos/color-theory.mp4" },
      { sectionId: c2s2.id, title: "Low-Fidelity Wireframes", type: "VIDEO", duration: 30, sortOrder: 0, contentUrl: "https://example.com/videos/wireframes.mp4" },
      { sectionId: c2s2.id, title: "Interactive Prototyping", type: "VIDEO", duration: 35, sortOrder: 1, contentUrl: "https://example.com/videos/prototyping.mp4" },
    ],
  });

  // --- Sections & Lessons for Course 3 ---
  const c3s1 = await db.section.create({
    data: {
      courseId: course3.id,
      title: "Python Fundamentals",
      description: "Python basics for data work",
      sortOrder: 0,
    },
  });

  await db.lesson.createMany({
    data: [
      { sectionId: c3s1.id, title: "Python Setup & Jupyter", type: "VIDEO", duration: 15, sortOrder: 0, isFree: true, contentUrl: "https://example.com/videos/python-setup.mp4" },
      { sectionId: c3s1.id, title: "Working with NumPy", type: "VIDEO", duration: 30, sortOrder: 1, contentUrl: "https://example.com/videos/numpy.mp4" },
    ],
  });

  // --- Enrollments ---
  const enrollment1 = await db.enrollment.create({
    data: {
      userId: alice.id,
      courseId: course1.id,
      status: "ACTIVE",
      progress: 37.5,
    },
  });

  const enrollment2 = await db.enrollment.create({
    data: {
      userId: bob.id,
      courseId: course2.id,
      status: "ACTIVE",
      progress: 60.0,
    },
  });

  // --- Progress records for enrollment1 (Alice in React course) ---
  const c1Lessons = await db.lesson.findMany({
    where: { section: { courseId: course1.id } },
    orderBy: [{ section: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  if (c1Lessons.length >= 3) {
    await db.progress.createMany({
      data: [
        {
          enrollmentId: enrollment1.id,
          lessonId: c1Lessons[0].id,
          completed: true,
          timeSpent: 650,
          completedAt: new Date("2026-02-01"),
        },
        {
          enrollmentId: enrollment1.id,
          lessonId: c1Lessons[1].id,
          completed: true,
          timeSpent: 920,
          completedAt: new Date("2026-02-02"),
        },
        {
          enrollmentId: enrollment1.id,
          lessonId: c1Lessons[2].id,
          completed: true,
          timeSpent: 1500,
          completedAt: new Date("2026-02-03"),
        },
      ],
    });
  }

  // --- Reviews ---
  await db.review.createMany({
    data: [
      {
        courseId: course1.id,
        userId: alice.id,
        rating: 5,
        comment:
          "Excellent course! The TypeScript integration examples are practical and well explained.",
      },
      {
        courseId: course2.id,
        userId: bob.id,
        rating: 4,
        comment:
          "Great introduction to design principles. Would love more advanced prototyping content.",
      },
    ],
  });
}
