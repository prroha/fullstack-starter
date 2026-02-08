import { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalHighlight,
} from "@/components/layout";

export const metadata: Metadata = {
  title: "Terms of Service | Fullstack Starter",
  description:
    "Read our Terms of Service to understand the rules and guidelines for using Fullstack Starter.",
  openGraph: {
    title: "Terms of Service | Fullstack Starter",
    description:
      "Read our Terms of Service to understand the rules and guidelines for using Fullstack Starter.",
    type: "website",
  },
};

const tableOfContents = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "use-license", title: "2. Use License" },
  { id: "user-accounts", title: "3. User Accounts" },
  { id: "acceptable-use", title: "4. Acceptable Use" },
  { id: "intellectual-property", title: "5. Intellectual Property" },
  { id: "user-content", title: "6. User Content" },
  { id: "payment-terms", title: "7. Payment Terms" },
  { id: "termination", title: "8. Termination" },
  { id: "disclaimers", title: "9. Disclaimers" },
  { id: "limitation-liability", title: "10. Limitation of Liability" },
  { id: "indemnification", title: "11. Indemnification" },
  { id: "governing-law", title: "12. Governing Law" },
  { id: "changes", title: "13. Changes to Terms" },
  { id: "contact", title: "14. Contact Information" },
];

export default function TermsPage() {
  // Format date for "Last updated"
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={lastUpdated}
      companyName="Your Company"
      contactEmail="legal@example.com"
      tableOfContents={tableOfContents}
    >
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        Welcome to Fullstack Starter. These Terms of Service ("Terms") govern
        your access to and use of our website, products, and services
        ("Services"). Please read these Terms carefully before using our
        Services.
      </p>

      <LegalHighlight type="important">
        By accessing or using our Services, you agree to be bound by these Terms
        and our Privacy Policy. If you do not agree to these Terms, you may not
        access or use the Services.
      </LegalHighlight>

      <LegalSection id="acceptance" title="Acceptance of Terms" number="1">
        <p>
          By creating an account, accessing, or using the Services, you
          acknowledge that you have read, understood, and agree to be bound by
          these Terms. If you are using the Services on behalf of an
          organization, you represent and warrant that you have the authority to
          bind that organization to these Terms.
        </p>
        <p>
          You must be at least 18 years old or the age of majority in your
          jurisdiction to use the Services. If you are under the required age,
          you may not use the Services.
        </p>
      </LegalSection>

      <LegalSection id="use-license" title="Use License" number="2">
        <LegalSubsection title="License Grant">
          <p>
            Subject to these Terms, we grant you a limited, non-exclusive,
            non-transferable, revocable license to access and use the Services
            for your personal or internal business purposes.
          </p>
        </LegalSubsection>

        <LegalSubsection title="License Restrictions">
          <p>You may not:</p>
          <LegalList
            items={[
              "Copy, modify, or distribute the Services or any content without prior written consent",
              "Reverse engineer, decompile, or disassemble any part of the Services",
              "Use the Services for any illegal or unauthorized purpose",
              "Attempt to gain unauthorized access to the Services or related systems",
              "Interfere with or disrupt the integrity or performance of the Services",
              "Use automated systems or software to extract data from the Services",
            ]}
          />
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="user-accounts" title="User Accounts" number="3">
        <LegalSubsection title="Account Creation">
          <p>
            To access certain features of the Services, you must create an
            account. You agree to provide accurate, current, and complete
            information during registration and to update such information to
            keep it accurate, current, and complete.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Account Security">
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities that occur under your
            account. You agree to notify us immediately of any unauthorized use
            of your account or any other breach of security.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Account Termination">
          <p>
            You may delete your account at any time through the account settings
            page. We reserve the right to suspend or terminate your account if
            you violate these Terms or if we reasonably believe that your use of
            the Services poses a security risk.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable Use" number="4">
        <p>
          You agree to use the Services only for lawful purposes and in
          accordance with these Terms. You agree not to:
        </p>
        <LegalList
          items={[
            "Use the Services in any way that violates any applicable law or regulation",
            "Engage in any conduct that is abusive, harassing, threatening, or harmful",
            "Transmit any viruses, malware, or other malicious code",
            "Attempt to probe, scan, or test the vulnerability of our systems",
            "Circumvent any technological measure we use to protect the Services",
            "Collect or harvest any personally identifiable information from other users",
            "Use the Services to send unsolicited communications (spam)",
            "Impersonate any person or entity or misrepresent your affiliation",
          ]}
        />
      </LegalSection>

      <LegalSection
        id="intellectual-property"
        title="Intellectual Property"
        number="5"
      >
        <LegalSubsection title="Our Intellectual Property">
          <p>
            The Services and all content, features, and functionality
            (including but not limited to all information, software, text,
            displays, images, video, audio, and the design and arrangement
            thereof) are owned by us, our licensors, or other providers of such
            material and are protected by copyright, trademark, patent, trade
            secret, and other intellectual property laws.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Trademarks">
          <p>
            Our name, logo, and all related names, logos, product and service
            names, designs, and slogans are our trademarks or those of our
            affiliates or licensors. You may not use such marks without our
            prior written permission.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="user-content" title="User Content" number="6">
        <LegalSubsection title="Ownership">
          <p>
            You retain all rights in any content you submit, post, or display on
            or through the Services ("User Content"). By providing User Content,
            you grant us a worldwide, non-exclusive, royalty-free license to
            use, reproduce, modify, and distribute your User Content in
            connection with operating and providing the Services.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Responsibility">
          <p>
            You are solely responsible for your User Content and the
            consequences of posting it. You represent and warrant that you own
            or have the necessary rights to your User Content and that it does
            not infringe the rights of any third party.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="payment-terms" title="Payment Terms" number="7">
        <LegalSubsection title="Pricing">
          <p>
            Some features of the Services may require payment. We will provide
            you with pricing information before you incur any charges. All fees
            are exclusive of applicable taxes, which you are responsible for
            paying.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Billing">
          <p>
            By providing payment information, you authorize us to charge your
            payment method for all fees incurred. For subscription services,
            billing occurs on a recurring basis until you cancel.
          </p>
        </LegalSubsection>

        <LegalSubsection title="Refunds">
          <p>
            Unless otherwise stated, all fees are non-refundable. If you believe
            you have been charged in error, please contact us within 30 days of
            the charge.
          </p>
        </LegalSubsection>
      </LegalSection>

      <LegalSection id="termination" title="Termination" number="8">
        <p>
          We may terminate or suspend your access to the Services immediately,
          without prior notice or liability, for any reason whatsoever,
          including without limitation if you breach these Terms.
        </p>
        <p>
          Upon termination, your right to use the Services will immediately
          cease. All provisions of these Terms which by their nature should
          survive termination shall survive, including ownership provisions,
          warranty disclaimers, indemnity, and limitations of liability.
        </p>
      </LegalSection>

      <LegalSection id="disclaimers" title="Disclaimers" number="9">
        <LegalHighlight type="warning">
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </LegalHighlight>
        <p>
          We do not warrant that the Services will be uninterrupted, timely,
          secure, or error-free, or that any defects will be corrected. We make
          no warranty regarding the quality, accuracy, timeliness,
          completeness, or reliability of the Services.
        </p>
      </LegalSection>

      <LegalSection
        id="limitation-liability"
        title="Limitation of Liability"
        number="10"
      >
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL WE BE LIABLE
          FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
          EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF
          PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT
          OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SERVICES.
        </p>
        <p>
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING
          OUT OF OR RELATING TO THESE TERMS OR THE SERVICES EXCEED THE AMOUNT
          YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE
          HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" title="Indemnification" number="11">
        <p>
          You agree to defend, indemnify, and hold harmless the Company and its
          officers, directors, employees, contractors, agents, licensors,
          suppliers, successors, and assigns from and against any claims,
          liabilities, damages, judgments, awards, losses, costs, expenses, or
          fees (including reasonable attorneys' fees) arising out of or relating
          to your violation of these Terms or your use of the Services.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing Law" number="12">
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of the State of Delaware, United States, without regard to its
          conflict of law provisions. You agree to submit to the exclusive
          jurisdiction of the courts located in Delaware for the resolution of
          any disputes.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to Terms" number="13">
        <p>
          We reserve the right to modify these Terms at any time. If we make
          material changes, we will notify you by email or by posting a notice
          on our website prior to the changes taking effect. Your continued use
          of the Services after the effective date of the revised Terms
          constitutes your acceptance of the changes.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact Information" number="14">
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="font-medium text-foreground">Your Company Name</p>
          <p>123 Business Street</p>
          <p>City, State 12345</p>
          <p>United States</p>
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:legal@example.com"
              className="text-primary hover:underline"
            >
              legal@example.com
            </a>
          </p>
        </div>
      </LegalSection>
    </LegalPage>
  );
}
