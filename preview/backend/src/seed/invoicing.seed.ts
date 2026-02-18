import { PrismaClient } from "@prisma/client";

export async function seedInvoicing(db: PrismaClient): Promise<void> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: "admin@preview.local" },
  });

  // --- Tax Rates ---
  const salesTax = await db.taxRate.create({
    data: {
      userId: admin.id,
      name: "Sales Tax",
      rate: 8.5,
      isDefault: true,
    },
  });

  const vatTax = await db.taxRate.create({
    data: {
      userId: admin.id,
      name: "VAT",
      rate: 20.0,
      isDefault: false,
    },
  });

  // --- Clients ---
  const client1 = await db.invoicingClient.create({
    data: {
      userId: admin.id,
      name: "Sarah Chen",
      email: "sarah.chen@acmecorp.example",
      phone: "+1-555-0101",
      companyName: "Acme Corporation",
      taxId: "US-EIN-12-3456789",
      billingAddress: {
        line1: "100 Innovation Drive",
        line2: "Suite 400",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
      },
      notes: "Net 30 payment terms preferred",
    },
  });

  const client2 = await db.invoicingClient.create({
    data: {
      userId: admin.id,
      name: "James Wilson",
      email: "james.w@brightideas.example",
      phone: "+1-555-0202",
      companyName: "Bright Ideas LLC",
      billingAddress: {
        line1: "250 Startup Lane",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "US",
      },
    },
  });

  const client3 = await db.invoicingClient.create({
    data: {
      userId: admin.id,
      name: "Emily Martinez",
      email: "emily@martinez-design.example",
      phone: "+1-555-0303",
      companyName: "Martinez Design Studio",
      billingAddress: {
        line1: "78 Creative Ave",
        city: "Portland",
        state: "OR",
        postalCode: "97201",
        country: "US",
      },
      notes: "Prefers email invoices, pays promptly",
    },
  });

  // --- Invoices ---
  // Invoice 1: Paid
  const invoice1 = await db.invoice.create({
    data: {
      userId: admin.id,
      clientId: client1.id,
      invoiceNumber: "INV-0001",
      status: "PAID",
      issueDate: new Date("2026-01-15"),
      dueDate: new Date("2026-02-14"),
      subtotal: 500000,
      taxTotal: 42500,
      discountAmount: 0,
      totalAmount: 542500,
      amountPaid: 542500,
      amountDue: 0,
      currency: "usd",
      notes: "Thank you for your business!",
      terms: "Net 30. Late payments subject to 1.5% monthly interest.",
      items: {
        createMany: {
          data: [
            {
              description: "Website Redesign - Discovery & Strategy",
              quantity: 1,
              unitPrice: 250000,
              totalPrice: 250000,
              taxRateId: salesTax.id,
              sortOrder: 0,
            },
            {
              description: "Website Redesign - UI/UX Design (40 hours)",
              quantity: 40,
              unitPrice: 5000,
              totalPrice: 200000,
              taxRateId: salesTax.id,
              sortOrder: 1,
            },
            {
              description: "Hosting Setup & Configuration",
              quantity: 1,
              unitPrice: 50000,
              totalPrice: 50000,
              taxRateId: salesTax.id,
              sortOrder: 2,
            },
          ],
        },
      },
      payments: {
        create: {
          amount: 542500,
          method: "BANK_TRANSFER",
          reference: "Wire transfer #WT-20260210",
          paidAt: new Date("2026-02-10"),
        },
      },
      activities: {
        createMany: {
          data: [
            { action: "created", details: "Invoice created", actorId: admin.id, createdAt: new Date("2026-01-15") },
            { action: "sent", details: "Invoice sent to sarah.chen@acmecorp.example", actorId: admin.id, createdAt: new Date("2026-01-15") },
            { action: "viewed", details: "Invoice viewed by client", createdAt: new Date("2026-01-16") },
            { action: "payment_recorded", details: "Payment of $5,425.00 recorded via bank transfer", actorId: admin.id, createdAt: new Date("2026-02-10") },
          ],
        },
      },
    },
  });

  // Invoice 2: Sent (pending payment)
  const invoice2 = await db.invoice.create({
    data: {
      userId: admin.id,
      clientId: client2.id,
      invoiceNumber: "INV-0002",
      status: "SENT",
      issueDate: new Date("2026-02-01"),
      dueDate: new Date("2026-03-03"),
      subtotal: 320000,
      taxTotal: 27200,
      discountAmount: 0,
      totalAmount: 347200,
      amountPaid: 0,
      amountDue: 347200,
      currency: "usd",
      notes: "Monthly retainer for February 2026",
      terms: "Net 30",
      items: {
        createMany: {
          data: [
            {
              description: "Monthly Development Retainer - February 2026",
              quantity: 1,
              unitPrice: 250000,
              totalPrice: 250000,
              taxRateId: salesTax.id,
              sortOrder: 0,
            },
            {
              description: "Additional Bug Fix Hours (14 hours)",
              quantity: 14,
              unitPrice: 5000,
              totalPrice: 70000,
              taxRateId: salesTax.id,
              sortOrder: 1,
            },
          ],
        },
      },
      activities: {
        createMany: {
          data: [
            { action: "created", details: "Invoice created", actorId: admin.id, createdAt: new Date("2026-02-01") },
            { action: "sent", details: "Invoice sent to james.w@brightideas.example", actorId: admin.id, createdAt: new Date("2026-02-01") },
          ],
        },
      },
    },
  });

  // Invoice 3: Draft
  const invoice3 = await db.invoice.create({
    data: {
      userId: admin.id,
      clientId: client3.id,
      invoiceNumber: "INV-0003",
      status: "DRAFT",
      issueDate: new Date("2026-02-15"),
      dueDate: new Date("2026-03-17"),
      subtotal: 175000,
      taxTotal: 14875,
      discountAmount: 10000,
      totalAmount: 179875,
      amountPaid: 0,
      amountDue: 179875,
      currency: "usd",
      notes: "Logo and brand identity package",
      items: {
        createMany: {
          data: [
            {
              description: "Brand Identity Package - Logo Design",
              quantity: 1,
              unitPrice: 100000,
              totalPrice: 100000,
              taxRateId: salesTax.id,
              sortOrder: 0,
            },
            {
              description: "Brand Guidelines Document",
              quantity: 1,
              unitPrice: 50000,
              totalPrice: 50000,
              taxRateId: salesTax.id,
              sortOrder: 1,
            },
            {
              description: "Social Media Kit (templates)",
              quantity: 1,
              unitPrice: 25000,
              totalPrice: 25000,
              taxRateId: salesTax.id,
              sortOrder: 2,
            },
          ],
        },
      },
      activities: {
        create: {
          action: "created",
          details: "Invoice created as draft",
          actorId: admin.id,
          createdAt: new Date("2026-02-15"),
        },
      },
    },
  });

  // Invoice 4: Partially paid
  const invoice4 = await db.invoice.create({
    data: {
      userId: admin.id,
      clientId: client1.id,
      invoiceNumber: "INV-0004",
      status: "PARTIALLY_PAID",
      issueDate: new Date("2026-02-05"),
      dueDate: new Date("2026-03-07"),
      subtotal: 800000,
      taxTotal: 68000,
      discountAmount: 0,
      totalAmount: 868000,
      amountPaid: 400000,
      amountDue: 468000,
      currency: "usd",
      notes: "Phase 2 development milestone",
      terms: "Net 30. 50% deposit, 50% on completion.",
      items: {
        createMany: {
          data: [
            {
              description: "Phase 2 - Backend API Development (80 hours)",
              quantity: 80,
              unitPrice: 7500,
              totalPrice: 600000,
              taxRateId: salesTax.id,
              sortOrder: 0,
            },
            {
              description: "Phase 2 - Frontend Integration (20 hours)",
              quantity: 20,
              unitPrice: 7500,
              totalPrice: 150000,
              taxRateId: salesTax.id,
              sortOrder: 1,
            },
            {
              description: "QA Testing & Deployment",
              quantity: 1,
              unitPrice: 50000,
              totalPrice: 50000,
              taxRateId: salesTax.id,
              sortOrder: 2,
            },
          ],
        },
      },
      payments: {
        create: {
          amount: 400000,
          method: "CREDIT_CARD",
          reference: "Stripe pi_3abc123def456",
          paidAt: new Date("2026-02-06"),
        },
      },
      activities: {
        createMany: {
          data: [
            { action: "created", details: "Invoice created", actorId: admin.id, createdAt: new Date("2026-02-05") },
            { action: "sent", details: "Invoice sent to sarah.chen@acmecorp.example", actorId: admin.id, createdAt: new Date("2026-02-05") },
            { action: "payment_recorded", details: "Deposit of $4,000.00 recorded via credit card", actorId: admin.id, createdAt: new Date("2026-02-06") },
          ],
        },
      },
    },
  });

  // --- Recurring Invoice ---
  await db.recurringInvoice.create({
    data: {
      userId: admin.id,
      clientId: client2.id,
      frequency: "MONTHLY",
      status: "ACTIVE",
      startDate: new Date("2026-01-01"),
      nextIssueDate: new Date("2026-03-01"),
      templateItems: [
        {
          description: "Monthly Development Retainer",
          quantity: 1,
          unitPrice: 250000,
          taxRateId: salesTax.id,
        },
      ],
      currency: "usd",
      notes: "Monthly retainer agreement",
      terms: "Net 30",
      occurrences: 2,
    },
  });

  // --- Invoicing Settings ---
  await db.invoicingSettings.create({
    data: {
      userId: admin.id,
      businessName: "Preview Studios",
      businessEmail: "billing@preview.local",
      businessPhone: "+1-555-0100",
      businessAddress: {
        line1: "500 Tech Blvd",
        line2: "Floor 12",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
      },
      invoicePrefix: "INV",
      nextNumber: 5,
      defaultCurrency: "usd",
      defaultDueDays: 30,
      defaultTerms:
        "Net 30. Late payments subject to 1.5% monthly interest.",
      defaultNotes: "Thank you for your business!",
    },
  });
}
