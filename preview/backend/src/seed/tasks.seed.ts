import { PrismaClient } from "@prisma/client";

export async function seedTasks(db: PrismaClient): Promise<void> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: "admin@preview.local" },
  });
  const alice = await db.user.findUniqueOrThrow({
    where: { email: "alice@preview.local" },
  });
  const bob = await db.user.findUniqueOrThrow({
    where: { email: "bob@preview.local" },
  });

  // --- Projects ---
  const project1 = await db.taskProject.create({
    data: {
      userId: admin.id,
      name: "Website Redesign",
      description:
        "Complete overhaul of the company website with new branding, improved UX, and mobile-first design.",
      color: "#3B82F6",
      icon: "globe",
      position: 0,
    },
  });

  const project2 = await db.taskProject.create({
    data: {
      userId: admin.id,
      name: "Mobile App Launch",
      description:
        "Build and launch the iOS and Android mobile app. Target release Q2 2026.",
      color: "#10B981",
      icon: "smartphone",
      position: 1,
    },
  });

  // --- Labels ---
  const bugLabel = await db.taskLabel.create({
    data: { userId: admin.id, name: "Bug", color: "#EF4444" },
  });
  const featureLabel = await db.taskLabel.create({
    data: { userId: admin.id, name: "Feature", color: "#3B82F6" },
  });
  const designLabel = await db.taskLabel.create({
    data: { userId: admin.id, name: "Design", color: "#8B5CF6" },
  });
  const urgentLabel = await db.taskLabel.create({
    data: { userId: admin.id, name: "Urgent", color: "#F59E0B" },
  });
  const docsLabel = await db.taskLabel.create({
    data: { userId: admin.id, name: "Documentation", color: "#6B7280" },
  });

  // --- Tasks for Project 1 (Website Redesign) ---
  const task1 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      assigneeId: alice.id,
      title: "Design new homepage mockup",
      description:
        "Create high-fidelity mockup for the new homepage. Include hero section, features grid, testimonials, and CTA. Follow the updated brand guidelines.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-02-25"),
      position: 0,
      labels: {
        create: [{ labelId: designLabel.id }, { labelId: featureLabel.id }],
      },
    },
  });

  const task2 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      assigneeId: bob.id,
      title: "Implement responsive navigation",
      description:
        "Build the responsive navigation component with hamburger menu for mobile, sticky header on scroll, and mega-menu for desktop.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date("2026-02-28"),
      position: 1,
      labels: {
        create: { labelId: featureLabel.id },
      },
    },
  });

  const task3 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      assigneeId: alice.id,
      title: "Fix broken image lazy loading",
      description:
        "Images below the fold are not lazy loading correctly. They all load on initial page load causing poor LCP scores.",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      position: 2,
      labels: {
        create: { labelId: bugLabel.id },
      },
    },
  });

  const task4 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      title: "Write SEO meta tags for all pages",
      description:
        "Add proper title, description, and Open Graph meta tags for all pages. Use the SEO checklist document as reference.",
      status: "TODO",
      priority: "LOW",
      dueDate: new Date("2026-03-10"),
      position: 3,
      labels: {
        create: { labelId: docsLabel.id },
      },
    },
  });

  const task5 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project1.id,
      assigneeId: alice.id,
      title: "Optimize Core Web Vitals",
      description:
        "Current LCP is 3.2s, target is under 2.5s. Investigate render-blocking resources and optimize image formats.",
      status: "DONE",
      priority: "HIGH",
      position: 4,
      completedAt: new Date("2026-02-12"),
      labels: {
        create: { labelId: urgentLabel.id },
      },
    },
  });

  // --- Tasks for Project 2 (Mobile App) ---
  const task6 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project2.id,
      assigneeId: bob.id,
      title: "Set up Flutter project structure",
      description:
        "Initialize the Flutter project with clean architecture, Riverpod state management, and the API client. Follow the mobile starter template.",
      status: "DONE",
      priority: "HIGH",
      position: 0,
      completedAt: new Date("2026-02-05"),
      labels: {
        create: { labelId: featureLabel.id },
      },
    },
  });

  const task7 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project2.id,
      assigneeId: bob.id,
      title: "Implement authentication flow",
      description:
        "Build login, register, and forgot password screens. Use secure storage for tokens. Support biometric authentication.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-02-22"),
      position: 1,
      labels: {
        create: { labelId: featureLabel.id },
      },
    },
  });

  const task8 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project2.id,
      title: "Design app icon and splash screen",
      description:
        "Create the app icon in all required sizes and the splash screen animation. Must match the new brand identity.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date("2026-03-01"),
      position: 2,
      labels: {
        create: { labelId: designLabel.id },
      },
    },
  });

  const task9 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project2.id,
      title: "Set up CI/CD pipeline for mobile builds",
      description:
        "Configure GitHub Actions to build Android APK and iOS IPA on push to main. Include automated testing and Fastlane for distribution.",
      status: "TODO",
      priority: "MEDIUM",
      position: 3,
    },
  });

  const task10 = await db.task.create({
    data: {
      userId: admin.id,
      projectId: project2.id,
      assigneeId: alice.id,
      title: "Push notification integration",
      description:
        "Integrate Firebase Cloud Messaging for Android and APNs for iOS. Support notification channels and deep linking.",
      status: "TODO",
      priority: "LOW",
      dueDate: new Date("2026-03-15"),
      position: 4,
      labels: {
        create: { labelId: featureLabel.id },
      },
    },
  });

  // --- Comments ---
  await db.taskComment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: alice.id,
        content:
          "Started working on the hero section. Using the new illustration style from the brand update. Will share a draft by EOD.",
      },
      {
        taskId: task1.id,
        userId: admin.id,
        content:
          "Looks great so far! Make sure to include the A/B variant for the CTA button placement we discussed.",
      },
      {
        taskId: task3.id,
        userId: alice.id,
        content:
          "Found the issue - the Intersection Observer threshold was set to 0 instead of 0.1. PR is up for review.",
      },
      {
        taskId: task7.id,
        userId: bob.id,
        content:
          "Login and register screens are done. Working on biometric auth now. Will need to test on physical devices.",
      },
    ],
  });

  // --- Task Settings ---
  await db.taskSettings.create({
    data: {
      userId: admin.id,
      defaultView: "BOARD",
      defaultProjectId: project1.id,
      showCompletedTasks: true,
    },
  });
}
