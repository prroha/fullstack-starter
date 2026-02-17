"use client";

import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Input,
  Button,
  Text,
} from "@/components/ui";
import { AppLink } from "@/components/ui/link";
import { Icon } from "@/components/ui/icon";

// Note: Metadata must be exported from a server component or use generateMetadata
// For client components, set it in the head or use a layout

// FAQ data organized by category
const faqData: FAQCategory[] = [
  {
    category: "Getting Started",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
        />
      </svg>
    ),
    questions: [
      {
        question: "What is Fullstack Starter?",
        answer:
          "Fullstack Starter is a comprehensive template for building modern full-stack applications. It includes a Next.js web app, React Native mobile app, Node.js backend with Express, and a PostgreSQL database with Prisma ORM. Everything is pre-configured with authentication, theming, and best practices.",
      },
      {
        question: "How do I get started with the template?",
        answer:
          "Clone the repository, install dependencies with npm install in each directory (backend, web, mobile), set up your environment variables, run database migrations, and start the development servers. Check the README.md for detailed step-by-step instructions.",
      },
      {
        question: "What technologies are used?",
        answer:
          "The stack includes Next.js 14+ with App Router for web, React Native with Expo for mobile, Node.js with Express and TypeScript for the backend, PostgreSQL with Prisma for the database, and Tailwind CSS for styling. We also use JWT for authentication and follow clean architecture principles.",
      },
    ],
  },
  {
    category: "Account & Billing",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
    questions: [
      {
        question: "How do I create an account?",
        answer:
          "Click the 'Sign Up' or 'Register' button on the login page. Fill in your email address, create a password, and complete the registration form. You will receive a verification email to confirm your account.",
      },
      {
        question: "How do I reset my password?",
        answer:
          "Go to the login page and click 'Forgot Password'. Enter your email address and we will send you a password reset link. Click the link in the email and follow the instructions to create a new password.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can delete your account from the Settings page. Go to Settings > Account > Delete Account. Please note that this action is permanent and will remove all your data from our systems.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers. All payments are processed securely through Stripe.",
      },
    ],
  },
  {
    category: "Features & Usage",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    questions: [
      {
        question: "How do I customize the theme?",
        answer:
          "The app supports light and dark modes by default. Click the theme toggle in the header to switch between modes. For more advanced customization, you can modify the Tailwind configuration and CSS variables in the globals.css file.",
      },
      {
        question: "Is there a mobile app available?",
        answer:
          "Yes! The template includes a React Native mobile app built with Expo. It shares the same backend and design system as the web app, providing a consistent experience across platforms. The mobile app is available for both iOS and Android.",
      },
      {
        question: "How do I deploy my application?",
        answer:
          "The backend can be deployed to any Node.js hosting platform like Railway, Render, or AWS. The web app works great with Vercel or Netlify. For the mobile app, use Expo EAS Build to create production builds for the app stores.",
      },
      {
        question: "Can I use this for commercial projects?",
        answer:
          "Yes, the template is MIT licensed, which means you can use it for personal, commercial, and open-source projects without restrictions. Attribution is appreciated but not required.",
      },
    ],
  },
  {
    category: "Technical Support",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
    questions: [
      {
        question: "Where can I report bugs or issues?",
        answer:
          "You can report bugs by opening an issue on our GitHub repository. Please include detailed steps to reproduce the issue, your environment details, and any relevant error messages or screenshots.",
      },
      {
        question: "How do I contribute to the project?",
        answer:
          "We welcome contributions! Fork the repository, create a feature branch, make your changes, and submit a pull request. Please follow our contribution guidelines and ensure your code passes all tests.",
      },
      {
        question: "Is there documentation available?",
        answer:
          "Yes, comprehensive documentation is available in the docs folder of the repository. It covers installation, configuration, architecture, API reference, and common use cases. We also have inline code comments throughout the codebase.",
      },
      {
        question: "How do I get help with implementation?",
        answer:
          "Join our Discord community for real-time support and discussions. You can also check the GitHub Discussions for common questions and solutions, or reach out via email for specific inquiries.",
      },
    ],
  },
];

interface FAQQuestion {
  question: string;
  answer: string;
}

interface FAQCategory {
  category: string;
  icon: React.ReactNode;
  questions: FAQQuestion[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter questions based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedCategory
        ? faqData.filter((cat) => cat.category === selectedCategory)
        : faqData;
    }

    const query = searchQuery.toLowerCase();
    return faqData
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (q) =>
            q.question.toLowerCase().includes(query) ||
            q.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [searchQuery, selectedCategory]);

  const totalQuestions = faqData.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );
  const filteredQuestions = filteredData.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h1>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto mb-8">
            Find answers to common questions about Fullstack Starter. Can not find
            what you are looking for? Contact our support team.
          </Text>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Icon
                name="Search"
                size="sm"
                color="muted"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <Text variant="caption" color="muted" className="mt-2">
                Showing {filteredQuestions} of {totalQuestions} questions
              </Text>
            )}
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full"
            >
              All Categories
            </Button>
            {faqData.map((category) => (
              <Button
                key={category.category}
                variant={selectedCategory === category.category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.category)}
                className="rounded-full"
              >
                {category.icon}
                {category.category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Icon
                  name="CircleQuestionMark"
                  size="xl"
                  color="muted"
                  className="mx-auto mb-4 h-16 w-16"
                />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No questions found
                </h3>
                <Text color="muted">
                  Try adjusting your search or filter to find what you are looking
                  for.
                </Text>
              </div>
            ) : (
              filteredData.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      {category.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {category.category}
                    </h2>
                  </div>
                  <Accordion type="single" collapsible>
                    {category.questions.map((item, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category.category}-${index}`}
                      >
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>{item.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-8 md:py-12 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Still have questions?
          </h2>
          <Text color="muted" className="mb-6 max-w-xl mx-auto">
            Can not find the answer you are looking for? Our support team is here
            to help.
          </Text>
          <AppLink href="/contact">
            <Button size="lg">Contact Support</Button>
          </AppLink>
        </div>
      </section>
    </div>
  );
}
