/**
 * TypeScript types for Strapi 5 CMS responses.
 * Mirrors the content type schemas in cms/src/api/ and cms/src/components/.
 */

// ─── Shared components ────────────────────────────────────────────────────

export type CmsTextItem = { text: string };
export type CmsStatItem = { value: string; label: string; icon?: string };
export type CmsKeyValue = { key: string; value: string };

export type CmsFeatureCard = {
  icon: string;
  title: string;
  description: string;
  items?: CmsTextItem[];
};

export type CmsTechGroup = {
  title: string;
  items?: CmsTextItem[];
};

export type CmsApiEndpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  authRequired?: boolean;
  rateLimit?: string;
  queryParams?: CmsKeyValue[];
};

export type CmsQuickNavItem = { title: string; description: string; href: string; icon?: string };
export type CmsSupportItem = { title: string; description: string; href: string; icon?: string };

// ─── Layout components ───────────────────────────────────────────────────

export type CmsNavLink = {
  label: string;
  href: string;
  icon?: string;
  isExternal?: boolean;
};

export type CmsCtaButton = {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
};

export type CmsFooterConfig = {
  copyrightTemplate: string;
  links?: CmsNavLink[];
};

// ─── SEO ─────────────────────────────────────────────────────────────────

export type CmsSeoMetadata = {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: { url: string; alternativeText?: string };
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
};

// ─── Dynamic Zone Section blocks ─────────────────────────────────────────

export type CmsHeroBlock = {
  __component: 'sections.hero';
  heading: string;
  subheading?: string;
  primaryCTA?: CmsCtaButton;
  secondaryCTA?: CmsCtaButton;
  backgroundImage?: { url: string; alternativeText?: string };
};

export type CmsCtaBannerBlock = {
  __component: 'sections.cta-banner';
  heading: string;
  description?: string;
  primaryCTA?: CmsCtaButton;
  secondaryCTA?: CmsCtaButton;
  variant?: 'default' | 'highlighted';
};

export type CmsStatsBarBlock = {
  __component: 'sections.stats-bar';
  stats?: CmsStatItem[];
};

export type CmsFeaturedArticlesBlock = {
  __component: 'sections.featured-articles';
  heading: string;
  subheading?: string;
  viewAllLabel?: string;
  mobileViewAllLabel?: string;
};

export type CmsRichTextBlock = {
  __component: 'sections.rich-text';
  body: string;
};

export type CmsFeatureGridBlock = {
  __component: 'sections.feature-grid';
  heading: string;
  columns?: '2' | '3' | '4';
  features?: CmsFeatureCard[];
};

export type CmsTechStackBlock = {
  __component: 'sections.tech-stack';
  heading: string;
  groups?: CmsTechGroup[];
};

export type CmsMissionBlock = {
  __component: 'sections.mission-block';
  title: string;
  content: string;
};

export type CmsOpenSourceInfoBlock = {
  __component: 'sections.open-source-info';
  title: string;
  description?: string;
  links?: CmsCtaButton[];
};

export type CmsPageHeaderBlock = {
  __component: 'sections.page-header';
  badge?: string;
  title: string;
  subtitle?: string;
};

export type CmsDocSectionBlock = {
  __component: 'sections.doc-section';
  anchorId: string;
  title: string;
  content: string;
};

export type CmsApiReferenceBlock = {
  __component: 'sections.api-reference';
  title: string;
  description?: string;
  baseUrl?: string;
  endpoints?: CmsApiEndpoint[];
  exampleCode?: string;
  swaggerNote?: string;
};

export type CmsQuickNavBlock = {
  __component: 'sections.quick-nav';
  heading: string;
  items?: CmsQuickNavItem[];
};

export type CmsContributingBlock = {
  __component: 'sections.contributing';
  title: string;
  description?: string;
  howToTitle?: string;
  steps?: string;
  guidelinesTitle?: string;
  guidelines?: CmsTextItem[];
  ctaButton?: CmsCtaButton;
};

export type CmsSupportLinksBlock = {
  __component: 'sections.support-links';
  title: string;
  description?: string;
  items?: CmsSupportItem[];
};

export type CmsDynamicZoneBlock =
  | CmsHeroBlock
  | CmsCtaBannerBlock
  | CmsStatsBarBlock
  | CmsFeaturedArticlesBlock
  | CmsRichTextBlock
  | CmsFeatureGridBlock
  | CmsTechStackBlock
  | CmsMissionBlock
  | CmsOpenSourceInfoBlock
  | CmsPageHeaderBlock
  | CmsDocSectionBlock
  | CmsApiReferenceBlock
  | CmsQuickNavBlock
  | CmsContributingBlock
  | CmsSupportLinksBlock;

// ─── Single Types ─────────────────────────────────────────────────────────

export type CmsGlobal = {
  siteName: string;
  siteDescription?: string;
  logo?: { url: string; alternativeText?: string };
  navigation?: CmsNavLink[];
  mobileMenuTitle?: string;
  skipToContentLabel?: string;
  signInLabel?: string;
  signOutLabel?: string;
  userMenuLabel?: string;
  newArticleButtonLabel?: string;
  footer?: CmsFooterConfig;
  defaultSeo?: CmsSeoMetadata;
};

export type CmsHomePage = {
  seo?: CmsSeoMetadata;
  content?: CmsDynamicZoneBlock[];
};

export type CmsAboutPage = {
  seo?: CmsSeoMetadata;
  header?: Omit<CmsPageHeaderBlock, '__component'>;
  content?: CmsDynamicZoneBlock[];
};

export type CmsDocsPage = {
  seo?: CmsSeoMetadata;
  header?: Omit<CmsPageHeaderBlock, '__component'>;
  content?: CmsDynamicZoneBlock[];
};

export type CmsLoginPage = {
  seo?: CmsSeoMetadata;
  cardTitle?: string;
  cardDescription?: string;
  signInButtonLabel?: string;
  signInLoadingLabel?: string;
  footerNotice?: string;
  errorMessages?: Record<string, string>;
};

export type CmsNotFoundPage = {
  errorCode?: string;
  heading?: string;
  message?: string;
  backButton?: CmsCtaButton;
};

export type CmsErrorPage = {
  title?: string;
  description?: string;
  retryButtonLabel?: string;
  homeButtonLabel?: string;
};

export type CmsArticleListingLabels = {
  pageTitle?: string;
  pageDescription?: string;
  searchPlaceholder?: string;
  clearSearchLabel?: string;
  sortByLabel?: string;
  sortOptions?: Array<{ value: string; label: string }>;
  filterSectionHeader?: string;
  clearAllLabel?: string;
  categoryLabel?: string;
  allCategoriesLabel?: string;
  tagsLabel?: string;
  tagModeLabel?: string;
  anyLabel?: string;
  allLabel?: string;
  dateRangeHeader?: string;
  clearDatesLabel?: string;
  fromLabel?: string;
  toLabel?: string;
  activeFiltersLabel?: string;
  filtersButtonLabel?: string;
  filterSheetTitle?: string;
  filterSheetDescription?: string;
  savedSearchesHeader?: string;
  saveCurrentLabel?: string;
  saveDialogTitle?: string;
  saveDialogDescription?: string;
  searchNameLabel?: string;
  searchNamePlaceholder?: string;
  cancelLabel?: string;
  saveLabel?: string;
  recentlyViewedHeader?: string;
  clearLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  emptyFilteredHeading?: string;
  emptyUnfilteredHeading?: string;
  emptyFilteredDescription?: string;
  emptyUnfilteredDescription?: string;
  clearFiltersLabel?: string;
};

export type CmsArticleDetailLabels = {
  breadcrumbAriaLabel?: string;
  voteAriaTemplate?: string;
  votesLabel?: string;
  voteAnnouncementTemplate?: string;
  noContentMessage?: string;
  relatedArticlesTitle?: string;
  noRelatedMessage?: string;
  editLabel?: string;
  deleteLabel?: string;
  deleteDialogTitle?: string;
  deleteDialogDescription?: string;
  cancelLabel?: string;
  deleteConfirmLabel?: string;
  deletingLabel?: string;
};

export type CmsArticleFormLabels = {
  createTitle?: string;
  editTitle?: string;
  titleLabel?: string;
  titlePlaceholder?: string;
  slugPreviewTemplate?: string;
  shortDescLabel?: string;
  shortDescPlaceholder?: string;
  categoryLabel?: string;
  categoryPlaceholder?: string;
  tagsLabel?: string;
  tagPlaceholder?: string;
  addTagLabel?: string;
  tagCountTemplate?: string;
  contentLabel?: string;
  contentPlaceholder?: string;
  authorLabel?: string;
  authorPlaceholder?: string;
  adminSettingsLabel?: string;
  featuredLabel?: string;
  trendingLabel?: string;
  cancelLabel?: string;
  createLabel?: string;
  creatingLabel?: string;
  saveLabel?: string;
  savingLabel?: string;
};
