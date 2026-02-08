import { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalHighlight,
} from "@/components/layout";

export const metadata: Metadata = {
  title: "Privacy Policy | Fullstack Starter",
  description:
    "Learn how we collect, use, and protect your personal information when you use Fullstack Starter.",
  openGraph: {
    title: "Privacy Policy | Fullstack Starter",
    description:
      "Learn how we collect, use, and protect your personal information.",
    type: "website",
  },
};

const tableOfContents = [
  { id: "introduction", title: "1. Introduction" },
  { id: "information-collect", title: "2. Information We Collect" },
  { id: "how-we-use", title: "3. How We Use Your Information" },
  { id: "information-sharing", title: "4. Information Sharing" },
  { id: "data-retention", title: "5. Data Retention" },
  { id: "data-security", title: "6. Data Security" },
  { id: "your-rights", title: "7. Your Rights (GDPR)" },
  { id: "ccpa-rights", title: "8. California Privacy Rights (CCPA)" },
  { id: "cookies", title: "9. Cookies and Tracking" },
  { id: "children-privacy", title: "10. Children's Privacy" },
  { id: "international", title: "11. International Transfers" },
  { id: "third-party", title: "12. Third-Party Links" },
  { id: "changes", title: "13. Changes to This Policy" },
  { id: "contact", title: "14. Contact Us" },
];

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={lastUpdated}
      companyName="Your Company"
      contactEmail="privacy@example.com"
      tableOfContents={tableOfContents}
    >
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Your privacy is important to us. This Privacy Policy explains how Your
        Company ("we," "us," or "our") collects, uses, discloses, and protects
        your information when you use our website and services
        (collectively, the "Services").
      </p>

      <LegalHighlight type="info">
        By using our Services, you agree to the collection and use of
        information in accordance with this policy. We will not use or share
        your information with anyone except as described in this Privacy Policy.
      </LegalHighlight>

      <LegalSection id="introduction" title="Introduction" number="1">
        <p>
          This Privacy Policy applies to all information collected through our
          Services, including our website, mobile applications, and any related
          services, sales, marketing, or events. We are committed to protecting
          your personal information and your right to privacy.
        </p>
        <p>
          If you have any questions or concerns about this policy or our
          practices with regards to your personal information, please contact us
          at{" "}
          <a
            href="mailto:privacy@example.com"
            className="text-primary hover:underline"
          >
            privacy@example.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection
        id="information-collect"
        title="Information We Collect"
        number="2"
      >
        <LegalSubsection title="Information You Provide">
          <p>
            We collect information you provide directly to us, including:
          </p>
          <LegalList
            items={[
              "Account information (name, email address, password)",
              "Profile information (avatar, biography, preferences)",
              "Payment information (processed securely through Stripe)",
              "Communications (support requests, feedback, survey responses)",
              "User-generated content (comments, files you upload)",
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="Information Collected Automatically">
          <p>
            When you access our Services, we automatically collect certain
            information:
          </p>
          <LegalList
            items={[
              "Device information (device type, operating system, browser type)",
              "Log information (IP address, access times, pages viewed)",
              "Location information (country, region based on IP)",
              "Usage information (features used, actions taken)",
              "Cookies and similar technologies (see Cookies section)",
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="Information from Third Parties">
          <p>We may receive information about you from third parties:</p>
          <LegalList
            items={[
              "Social media platforms (if you sign in using social login)",
              "Analytics providers (aggregated usage data)",
              "Payment processors (transaction confirmations)",
              "Marketing partners (with your consent)",
            ]}
          />
        </LegalSubsection>
      </LegalSection>

      <LegalSection
        id="how-we-use"
        title="How We Use Your Information"
        number="3"
      >
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            "Provide, maintain, and improve our Services",
            "Process transactions and send related information",
            "Send you technical notices, updates, and support messages",
            "Respond to your comments, questions, and customer service requests",
            "Communicate with you about products, services, and events",
            "Monitor and analyze trends, usage, and activities",
            "Detect, investigate, and prevent fraudulent transactions and abuse",
            "Personalize and improve your experience",
            "Comply with legal obligations",
          ]}
        />
        <LegalHighlight type="info">
          <strong>Legal Basis for Processing (GDPR):</strong> We process your
          data based on: (a) your consent, (b) performance of a contract, (c)
          legitimate interests, or (d) compliance with legal obligations.
        </LegalHighlight>
      </LegalSection>

      <LegalSection
        id="information-sharing"
        title="Information Sharing"
        number="4"
      >
        <p>
          We do not sell your personal information. We may share your
          information in the following circumstances:
        </p>

        <LegalSubsection title="Service Providers">
          <p>
            We share information with third-party vendors who perform services
            on our behalf, such as payment processing, data analysis, email
            delivery, hosting, customer service, and marketing assistance.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Legal Requirements">
          <p>
            We may disclose your information if required by law, court order, or
            governmental authority, or when we believe disclosure is necessary
            to protect our rights, your safety, or the safety of others.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Business Transfers">
          <p>
            If we are involved in a merger, acquisition, or sale of assets, your
            information may be transferred as part of that transaction. We will
            notify you of any change in ownership or uses of your personal
            information.
          </p>
        </LegalSubsection>

        <LegalSubsection title="With Your Consent">
          <p>
            We may share your information with your consent or at your
            direction.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="data-retention" title="Data Retention" number="5">
        <p>
          We retain your personal information for as long as necessary to
          fulfill the purposes outlined in this Privacy Policy, unless a longer
          retention period is required or permitted by law. When we no longer
          need your information, we will securely delete or anonymize it.
        </p>
        <p>Specific retention periods:</p>
        <LegalList
          items={[
            "Account data: Retained while your account is active, deleted within 30 days of account deletion",
            "Transaction records: Retained for 7 years for tax and legal purposes",
            "Usage logs: Retained for 90 days for security and analytics",
            "Backup data: Retained for 30 days after deletion from production systems",
          ]}
        />
      </LegalSection>

      <LegalSection id="data-security" title="Data Security" number="6">
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal information against unauthorized access,
          alteration, disclosure, or destruction. These measures include:
        </p>
        <LegalList
          items={[
            "Encryption of data in transit (TLS 1.3) and at rest (AES-256)",
            "Regular security assessments and penetration testing",
            "Access controls and authentication mechanisms",
            "Employee training on data protection and security",
            "Incident response procedures",
            "Regular backups with secure off-site storage",
          ]}
        />
        <LegalHighlight type="warning">
          While we strive to protect your personal information, no method of
          transmission over the Internet or electronic storage is 100% secure.
          We cannot guarantee absolute security.
        </LegalHighlight>
      </LegalSection>

      <LegalSection id="your-rights" title="Your Rights (GDPR)" number="7">
        <p>
          If you are a resident of the European Economic Area (EEA), you have
          certain data protection rights under the General Data Protection
          Regulation (GDPR):
        </p>
        <LegalList
          items={[
            "Right to access: Request copies of your personal data",
            "Right to rectification: Request correction of inaccurate data",
            "Right to erasure: Request deletion of your personal data",
            "Right to restrict processing: Request limitation of processing",
            "Right to data portability: Request transfer of your data",
            "Right to object: Object to processing based on legitimate interests",
            "Right to withdraw consent: Withdraw consent at any time",
          ]}
        />
        <p className="mt-4">
          To exercise these rights, please contact us at{" "}
          <a
            href="mailto:privacy@example.com"
            className="text-primary hover:underline"
          >
            privacy@example.com
          </a>
          . We will respond to your request within 30 days. You also have the
          right to lodge a complaint with your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection
        id="ccpa-rights"
        title="California Privacy Rights (CCPA)"
        number="8"
      >
        <p>
          If you are a California resident, you have specific rights under the
          California Consumer Privacy Act (CCPA):
        </p>
        <LegalList
          items={[
            "Right to know: Request disclosure of collected personal information",
            "Right to delete: Request deletion of your personal information",
            "Right to opt-out: Opt-out of the sale of personal information (we do not sell your data)",
            "Right to non-discrimination: Equal service regardless of exercising rights",
          ]}
        />
        <p className="mt-4">
          To exercise your CCPA rights, you may submit a verifiable consumer
          request by emailing{" "}
          <a
            href="mailto:privacy@example.com"
            className="text-primary hover:underline"
          >
            privacy@example.com
          </a>{" "}
          or calling [Your Phone Number]. We will verify your identity before
          processing your request.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies and Tracking" number="9">
        <p>
          We use cookies and similar tracking technologies to collect and store
          information about your interactions with our Services.
        </p>

        <LegalSubsection title="Types of Cookies We Use">
          <LegalList
            items={[
              "Essential cookies: Required for the Services to function properly",
              "Analytics cookies: Help us understand how visitors interact with our Services",
              "Preference cookies: Remember your settings and preferences",
              "Marketing cookies: Used to deliver relevant advertisements (with consent)",
            ]}
          />
        </LegalSubsection>

        <LegalSubsection title="Managing Cookies">
          <p>
            You can control cookies through your browser settings. Most browsers
            allow you to refuse cookies or alert you when cookies are being
            sent. Note that disabling cookies may affect the functionality of
            our Services.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection
        id="children-privacy"
        title="Children's Privacy"
        number="10"
      >
        <p>
          Our Services are not intended for children under 13 years of age (or
          under 16 in the EEA). We do not knowingly collect personal information
          from children. If you are a parent or guardian and believe your child
          has provided us with personal information, please contact us
          immediately. If we discover that we have collected personal
          information from a child without parental consent, we will take steps
          to delete that information.
        </p>
      </LegalSection>

      <LegalSection
        id="international"
        title="International Transfers"
        number="11"
      >
        <p>
          Your information may be transferred to and processed in countries
          other than your country of residence. These countries may have data
          protection laws that are different from those in your country.
        </p>
        <p>
          When we transfer data internationally, we use appropriate safeguards
          such as Standard Contractual Clauses approved by the European
          Commission, or we rely on an adequacy decision by the European
          Commission.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="Third-Party Links" number="12">
        <p>
          Our Services may contain links to third-party websites, plugins, and
          applications. Clicking on those links or enabling those connections
          may allow third parties to collect or share data about you. We do not
          control these third-party websites and are not responsible for their
          privacy practices. We encourage you to read the privacy policy of
          every website you visit.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to This Policy" number="13">
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on this page and
          updating the "Last updated" date. For significant changes, we will
          provide additional notice (such as adding a statement to our homepage
          or sending you an email notification).
        </p>
        <p>
          We encourage you to review this Privacy Policy periodically for any
          changes. Changes to this Privacy Policy are effective when they are
          posted on this page.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Us" number="14">
        <p>
          If you have any questions about this Privacy Policy or our privacy
          practices, please contact our Data Protection Officer:
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium text-foreground">
            Data Protection Officer
          </p>
          <p>Your Company Name</p>
          <p>123 Business Street</p>
          <p>City, State 12345</p>
          <p>United States</p>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:privacy@example.com"
              className="text-primary hover:underline"
            >
              privacy@example.com
            </a>
          </p>
          <p>
            Phone: <a href="tel:+1234567890" className="text-primary hover:underline">+1 (234) 567-890</a>
          </p>
        </div>

        <div className="mt-6">
          <p className="font-medium text-foreground mb-2">
            EU Representative (for GDPR purposes):
          </p>
          <div className="p-4 bg-muted rounded-lg">
            <p>EU Representative Name</p>
            <p>Address in EU Member State</p>
            <p>
              Email:{" "}
              <a
                href="mailto:eu-rep@example.com"
                className="text-primary hover:underline"
              >
                eu-rep@example.com
              </a>
            </p>
          </div>
        </div>
      </LegalSection>
    </LegalPage>
  );
}
