"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { contactSchema, type ContactFormData } from "@/lib/validations";
import { toast } from "sonner";
import {
  Form,
  FormFieldInput,
  FormFieldTextarea,
  useZodForm,
} from "@/components/forms";
import { Button, Text } from "@/components/ui";
import { Icon } from "@/components/ui/icon";

export default function ContactPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useZodForm({
    schema: contactSchema,
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      const response = await api.submitContact(data);
      if (response.success) {
        setIsSuccess(true);
        form.reset();
        toast.success("Message sent successfully!");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "CONTACT_RATE_LIMIT_EXCEEDED") {
          toast.error(
            "Too many submissions. Please wait a few minutes before trying again."
          );
        } else if (error.code === "VALIDATION_ERROR" && error.details) {
          // Handle validation errors from the server
          if (Array.isArray(error.details)) {
            for (const detail of error.details as Array<{
              path: string[];
              message: string;
            }>) {
              const field = detail.path?.[0] as keyof ContactFormData;
              if (field) {
                form.setError(field, { message: detail.message });
              }
            }
          }
        } else {
          toast.error(error.message || "Failed to send message. Please try again.");
        }
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-10 md:py-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success mb-6">
              <Icon name="Check" size="xl" className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Message Sent!
            </h1>
            <Text size="lg" color="muted" className="max-w-2xl mx-auto mb-8">
              Thank you for reaching out. We have received your message and will
              get back to you as soon as possible.
            </Text>
            <Button size="lg" onClick={() => setIsSuccess(false)}>
              Send Another Message
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const messageValue = form.watch("message") || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Contact Us
          </h1>
          <Text size="lg" color="muted" className="max-w-2xl mx-auto">
            Have a question or feedback? We would love to hear from you. Fill out
            the form below and we will get back to you as soon as possible.
          </Text>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Form form={form} onSubmit={onSubmit} className="space-y-4">
              <FormFieldInput
                control={form.control}
                name="name"
                label="Name"
                required
                placeholder="John Doe"
              />

              <FormFieldInput
                control={form.control}
                name="email"
                label="Email"
                required
                type="email"
                placeholder="john@example.com"
              />

              <FormFieldInput
                control={form.control}
                name="subject"
                label="Subject"
                required
                placeholder="How can we help?"
              />

              <div>
                <FormFieldTextarea
                  control={form.control}
                  name="message"
                  label="Message"
                  required
                  placeholder="Tell us more about your inquiry..."
                  textareaProps={{ rows: 6 }}
                />
                <Text variant="caption" color="muted" className="mt-1">
                  {messageValue.length}/5000 characters
                </Text>
              </div>

              <Button
                type="submit"
                isLoading={form.formState.isSubmitting}
                className="w-full"
              >
                Send Message
              </Button>
            </Form>

            {/* Additional Contact Info */}
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
                Other Ways to Reach Us
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <Icon name="Mail" size="lg" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    Email
                  </h3>
                  <a
                    href="mailto:hello@example.com"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    hello@example.com
                  </a>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                    <Icon name="Clock" size="lg" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    Response Time
                  </h3>
                  <Text variant="caption" color="muted">
                    Within 24-48 hours
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
