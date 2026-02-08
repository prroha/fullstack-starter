// =====================================================
// Layout Components (Organisms)
// =====================================================

// Header
export { Header, HeaderNavLink, HeaderUserMenu } from "./header";
export type { HeaderProps, HeaderNavLinkProps, HeaderUserMenuProps } from "./header";

// App Header (with notifications)
export { AppHeader } from "./app-header";
export type { AppHeaderProps } from "./app-header";

// Footer
export { Footer, SimpleFooter } from "./footer";
export type {
  FooterProps,
  FooterLinkGroup,
  FooterSocialLink,
  SimpleFooterProps,
} from "./footer";

// Page Container
export { PageContainer, MainContainer, ContentContainer } from "./page-container";
export type {
  PageContainerProps,
  MainContainerProps,
  ContentContainerProps,
} from "./page-container";

// Section
export { Section, SectionHeader, CardSection, EmptySection } from "./section";
export type {
  SectionProps,
  SectionHeaderProps,
  CardSectionProps,
  EmptySectionProps,
} from "./section";

// Legal Page
export {
  LegalPage,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalHighlight,
} from "./legal-page";
export type {
  LegalPageProps,
  TableOfContentsItem,
  LegalSectionProps,
  LegalSubsectionProps,
  LegalListProps,
  LegalHighlightProps,
} from "./legal-page";
