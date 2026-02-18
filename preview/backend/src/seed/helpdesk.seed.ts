import { PrismaClient } from "@prisma/client";

export async function seedHelpdesk(db: PrismaClient): Promise<void> {
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
  const technicalCat = await db.helpdeskCategory.create({
    data: {
      userId: admin.id,
      name: "Technical Support",
      description: "Technical issues, bugs, and platform errors",
      color: "#EF4444",
      sortOrder: 1,
    },
  });

  const billingCat = await db.helpdeskCategory.create({
    data: {
      userId: admin.id,
      name: "Billing & Payments",
      description: "Invoices, refunds, and payment-related questions",
      color: "#F59E0B",
      sortOrder: 2,
    },
  });

  // --- Agents ---
  const agent1 = await db.helpdeskAgent.create({
    data: {
      userId: admin.id,
      name: "Preview Admin",
      email: "admin@preview.local",
      role: "ADMIN",
      department: "Engineering",
      isActive: true,
      maxOpenTickets: 50,
      specialties: ["Technical", "Platform"],
    },
  });

  const agent2 = await db.helpdeskAgent.create({
    data: {
      userId: carol.id,
      name: "Carol Williams",
      email: "carol@preview.local",
      role: "AGENT",
      department: "Customer Support",
      isActive: true,
      maxOpenTickets: 25,
      specialties: ["Billing", "General"],
    },
  });

  // --- SLA Policies ---
  await db.slaPolicy.createMany({
    data: [
      {
        userId: admin.id,
        name: "Urgent SLA",
        description: "For urgent/critical issues",
        priority: "URGENT",
        firstResponseMinutes: 30,
        resolutionMinutes: 240,
        businessHoursOnly: false,
        isActive: true,
      },
      {
        userId: admin.id,
        name: "High Priority SLA",
        description: "For high priority tickets",
        priority: "HIGH",
        firstResponseMinutes: 60,
        resolutionMinutes: 480,
        businessHoursOnly: true,
        isActive: true,
      },
      {
        userId: admin.id,
        name: "Standard SLA",
        description: "Default SLA for medium/low tickets",
        priority: "MEDIUM",
        firstResponseMinutes: 240,
        resolutionMinutes: 1440,
        businessHoursOnly: true,
        isActive: true,
      },
    ],
  });

  // --- Tags ---
  const bugTag = await db.ticketTag.create({
    data: { userId: admin.id, name: "Bug", color: "#EF4444" },
  });
  const featureTag = await db.ticketTag.create({
    data: { userId: admin.id, name: "Feature Request", color: "#3B82F6" },
  });
  const refundTag = await db.ticketTag.create({
    data: { userId: admin.id, name: "Refund", color: "#F59E0B" },
  });

  // --- Tickets ---
  const ticket1 = await db.ticket.create({
    data: {
      userId: alice.id,
      ticketNumber: "TKT-1001",
      categoryId: technicalCat.id,
      assignedAgentId: agent1.id,
      subject: "Cannot upload files larger than 10MB",
      description:
        "When I try to upload a PDF file that is 12MB, I get a generic error message. The upload progress bar reaches 100% but then the file disappears. This started happening yesterday.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      firstResponseAt: new Date("2026-02-15T10:30:00Z"),
      tags: {
        create: { tagId: bugTag.id },
      },
      messages: {
        createMany: {
          data: [
            {
              senderId: alice.id,
              senderType: "customer",
              body: "When I try to upload a PDF file that is 12MB, I get a generic error message. The upload progress bar reaches 100% but then the file disappears.",
            },
            {
              senderId: admin.id,
              senderType: "agent",
              body: "Thank you for reporting this. I can confirm we have a 10MB file size limit currently. We are working on increasing this to 50MB. As a workaround, you can compress the PDF or split it into smaller files.",
            },
            {
              senderId: alice.id,
              senderType: "customer",
              body: "Thanks for the quick response. A more descriptive error message would be helpful so users know about the limit upfront.",
            },
          ],
        },
      },
    },
  });

  const ticket2 = await db.ticket.create({
    data: {
      userId: bob.id,
      ticketNumber: "TKT-1002",
      categoryId: billingCat.id,
      assignedAgentId: agent2.id,
      subject: "Duplicate charge on my credit card",
      description:
        "I was charged twice for my monthly subscription on Feb 10th. Transaction amounts are $29.99 each. Please investigate and refund the duplicate charge.",
      status: "WAITING_ON_AGENT",
      priority: "URGENT",
      firstResponseAt: new Date("2026-02-10T14:15:00Z"),
      tags: {
        create: { tagId: refundTag.id },
      },
      messages: {
        createMany: {
          data: [
            {
              senderId: bob.id,
              senderType: "customer",
              body: "I was charged twice for my monthly subscription on Feb 10th. Transaction amounts are $29.99 each.",
            },
            {
              senderId: carol.id,
              senderType: "agent",
              body: "I am sorry about the duplicate charge. I have escalated this to our billing team. Could you provide the last 4 digits of the card used?",
            },
          ],
        },
      },
    },
  });

  const ticket3 = await db.ticket.create({
    data: {
      userId: dave.id,
      ticketNumber: "TKT-1003",
      categoryId: technicalCat.id,
      subject: "Feature request: Dark mode support",
      description:
        "It would be great to have a dark mode option in the dashboard. The current white theme is too bright when working late at night.",
      status: "OPEN",
      priority: "LOW",
      tags: {
        create: { tagId: featureTag.id },
      },
    },
  });

  const ticket4 = await db.ticket.create({
    data: {
      userId: eve.id,
      ticketNumber: "TKT-1004",
      categoryId: technicalCat.id,
      assignedAgentId: agent1.id,
      subject: "Login page shows blank screen on Safari",
      description:
        "The login page loads a blank white screen on Safari 17. Works fine in Chrome and Firefox. macOS Sonoma 14.3.",
      status: "RESOLVED",
      priority: "HIGH",
      firstResponseAt: new Date("2026-02-12T09:00:00Z"),
      resolvedAt: new Date("2026-02-13T16:00:00Z"),
      tags: {
        create: { tagId: bugTag.id },
      },
      messages: {
        createMany: {
          data: [
            {
              senderId: eve.id,
              senderType: "customer",
              body: "Login page is completely blank on Safari 17. Console shows a JavaScript error related to CSS nesting.",
            },
            {
              senderId: admin.id,
              senderType: "agent",
              body: "Thanks for the detailed report. We have identified the CSS compatibility issue and deployed a fix. Could you try clearing your cache and loading the page again?",
            },
            {
              senderId: eve.id,
              senderType: "customer",
              body: "Cleared cache and it works now. Thank you for the quick fix!",
            },
          ],
        },
      },
    },
  });

  const ticket5 = await db.ticket.create({
    data: {
      userId: alice.id,
      ticketNumber: "TKT-1005",
      categoryId: billingCat.id,
      assignedAgentId: agent2.id,
      subject: "Request to upgrade subscription plan",
      description:
        "I would like to upgrade from the Basic plan to the Professional plan. Can you help me understand the prorated charges?",
      status: "CLOSED",
      priority: "MEDIUM",
      firstResponseAt: new Date("2026-02-08T11:00:00Z"),
      resolvedAt: new Date("2026-02-08T15:30:00Z"),
      closedAt: new Date("2026-02-09T10:00:00Z"),
    },
  });

  // --- Knowledge Base Articles ---
  await db.knowledgeBaseArticle.createMany({
    data: [
      {
        userId: admin.id,
        categoryId: technicalCat.id,
        title: "How to Reset Your Password",
        slug: "how-to-reset-password",
        content:
          "## Reset Your Password\n\n1. Click **Forgot Password** on the login page\n2. Enter your registered email address\n3. Check your inbox for the reset link (expires in 1 hour)\n4. Click the link and set a new password\n5. Log in with your new credentials\n\n### Tips\n- Use a strong password with at least 8 characters\n- Include uppercase, lowercase, numbers, and symbols\n- Do not reuse passwords from other sites",
        excerpt: "Step-by-step guide to resetting your account password",
        status: "PUBLISHED",
        tags: ["account", "password", "security"],
        viewCount: 342,
        helpfulCount: 56,
        notHelpfulCount: 3,
        publishedAt: new Date("2026-01-15"),
      },
      {
        userId: admin.id,
        categoryId: billingCat.id,
        title: "Understanding Your Invoice",
        slug: "understanding-your-invoice",
        content:
          "## Invoice Breakdown\n\nYour monthly invoice includes:\n\n- **Subscription Fee**: Base plan cost\n- **Usage Charges**: Any overages beyond plan limits\n- **Taxes**: Applicable sales tax based on your location\n\n### Payment Methods\nWe accept Visa, Mastercard, American Express, and bank transfers.\n\n### Due Date\nInvoices are due within 15 days of issue. Late payments may incur a 1.5% monthly fee.",
        excerpt: "Learn how to read and understand your monthly invoice",
        status: "PUBLISHED",
        tags: ["billing", "invoice", "payment"],
        viewCount: 189,
        helpfulCount: 31,
        notHelpfulCount: 2,
        publishedAt: new Date("2026-01-20"),
      },
      {
        userId: admin.id,
        categoryId: technicalCat.id,
        title: "Supported File Formats and Size Limits",
        slug: "supported-file-formats",
        content:
          "## File Upload Limits\n\n### Supported Formats\n- Documents: PDF, DOCX, XLSX, CSV\n- Images: JPG, PNG, GIF, WebP\n- Archives: ZIP, TAR.GZ\n\n### Size Limits\n- Individual file: 10MB (increasing to 50MB soon)\n- Total upload per request: 25MB\n- Storage per account: 5GB (Basic), 25GB (Pro), Unlimited (Enterprise)",
        excerpt: "Supported file types and upload size restrictions",
        status: "PUBLISHED",
        tags: ["files", "upload", "limits"],
        viewCount: 97,
        helpfulCount: 15,
        notHelpfulCount: 1,
        publishedAt: new Date("2026-02-01"),
      },
    ],
  });

  // --- Canned Responses ---
  await db.cannedResponse.createMany({
    data: [
      {
        userId: admin.id,
        title: "Greeting - First Response",
        content:
          "Hi {customer_name},\n\nThank you for reaching out to our support team. I have received your ticket and will look into this right away.\n\nBest regards,\n{agent_name}",
        shortcut: "/greet",
        isShared: true,
        createdByAgentId: agent1.id,
        usageCount: 45,
      },
      {
        userId: admin.id,
        title: "Ticket Resolution",
        content:
          "Hi {customer_name},\n\nI am happy to let you know that your issue has been resolved. Here is a summary of what was done:\n\n{resolution_details}\n\nPlease let us know if you experience any further issues.\n\nBest regards,\n{agent_name}",
        shortcut: "/resolved",
        isShared: true,
        createdByAgentId: agent1.id,
        usageCount: 32,
      },
    ],
  });

  // --- Helpdesk Settings ---
  await db.helpdeskSettings.create({
    data: {
      userId: admin.id,
      companyName: "Preview Corp",
      supportEmail: "support@preview.local",
      ticketPrefix: "TKT",
      nextTicketNumber: 1006,
      autoAssign: false,
      businessHours: {
        timezone: "America/New_York",
        schedule: [
          { day: 1, start: "09:00", end: "17:00" },
          { day: 2, start: "09:00", end: "17:00" },
          { day: 3, start: "09:00", end: "17:00" },
          { day: 4, start: "09:00", end: "17:00" },
          { day: 5, start: "09:00", end: "17:00" },
        ],
      },
    },
  });
}
