/**
 * CMS query functions — one per Single Type.
 * Each wraps fetchStrapi with appropriate ISR revalidation and a fallback.
 * Falls back to empty/default values when Strapi is unavailable (build time safety).
 */

import { CmsUnavailableError, fetchStrapi } from './client';
import type {
  CmsAboutPage,
  CmsDocsPage,
  CmsErrorPage,
  CmsGlobal,
  CmsHomePage,
  CmsLoginPage,
  CmsNotFoundPage,
  CmsArticleDetailLabels,
  CmsArticleFormLabels,
  CmsArticleListingLabels,
} from './types';

/** Revalidation intervals in seconds */
const TTL = {
  GLOBAL: 600,       // 10 min — rarely changes (nav, footer)
  PAGE: 300,         // 5 min — marketing content
  LABELS: 3600,      // 1 hour — UI labels almost never change
  STATIC: 3600,      // 1 hour — login, error, 404
} as const;

/**
 * Strapi 5 populate presets.
 * Strapi 5 does NOT support `populate=deep` without a plugin.
 * - `*` populates 1 level (flat single types, labels)
 * - Bracket notation populates specific nested fields
 */
const POPULATE = {
  /** 1-level populate — flat content types & labels */
  FLAT: { populate: '*' } as Record<string, string>,
  /** Global: navigation (flat) + footer → links (2 levels) */
  GLOBAL: {
    'populate[navigation]': '*',
    'populate[footer][populate][links]': '*',
  } as Record<string, string>,
  /** Pages with Dynamic Zone `content` field — 2-level populate */
  DYNAMIC_ZONE: {
    'populate[content][populate]': '*',
    // Populate seo with explicit scalar fields only — wildcard (*) fails because
    // ogImage is a Media relation that requires separate populate syntax.
    'populate[seo][fields][0]': 'title',
    'populate[seo][fields][1]': 'description',
    'populate[seo][fields][2]': 'keywords',
    'populate[seo][fields][3]': 'ogTitle',
    'populate[seo][fields][4]': 'ogDescription',
  } as Record<string, string>,
  /** Pages with DZ `content` field + `header` component */
  DYNAMIC_ZONE_WITH_HEADER: {
    'populate[content][populate]': '*',
    'populate[header]': '*',
    // Populate seo with explicit scalar fields only — wildcard (*) fails because
    // ogImage is a Media relation that requires separate populate syntax.
    'populate[seo][fields][0]': 'title',
    'populate[seo][fields][1]': 'description',
    'populate[seo][fields][2]': 'keywords',
    'populate[seo][fields][3]': 'ogTitle',
    'populate[seo][fields][4]': 'ogDescription',
  } as Record<string, string>,
} as const;

async function safeFetch<T>(
  path: string,
  revalidate: number,
  fallback: T,
  params: Record<string, string> = POPULATE.FLAT,
): Promise<T> {
  try {
    return await fetchStrapi<T>(path, revalidate, params);
  } catch (err) {
    if (err instanceof CmsUnavailableError) {
      // Expected during build when CMS isn't running — use fallback
      return fallback;
    }
    throw err;
  }
}

// ─── Global ───────────────────────────────────────────────────────────────

const GLOBAL_FALLBACK: CmsGlobal = {
  siteName: 'AI Fullstack Accelerator',
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles' },
    { label: 'About', href: '/about' },
  ],
  mobileMenuTitle: 'Menu',
  skipToContentLabel: 'Skip to main content',
  signInLabel: 'Sign In',
  signOutLabel: 'Sign Out',
  userMenuLabel: 'User menu',
  newArticleButtonLabel: '+ New Article',
  footer: {
    copyrightTemplate: '© {year} AI Fullstack Accelerator. All rights reserved.',
    links: [
      { label: 'GitHub', href: 'https://github.com', isExternal: true },
      { label: 'Documentation', href: '/docs' },
    ],
  },
};

export async function getGlobal(): Promise<CmsGlobal> {
  return safeFetch<CmsGlobal>('/global', TTL.GLOBAL, GLOBAL_FALLBACK, POPULATE.GLOBAL);
}

// ─── Pages ────────────────────────────────────────────────────────────────

export async function getHomePage(): Promise<CmsHomePage> {
  return safeFetch<CmsHomePage>('/home-page', TTL.PAGE, {}, POPULATE.DYNAMIC_ZONE);
}

export async function getAboutPage(): Promise<CmsAboutPage> {
  return safeFetch<CmsAboutPage>('/about-page', TTL.PAGE, {}, POPULATE.DYNAMIC_ZONE_WITH_HEADER);
}

export async function getDocsPage(): Promise<CmsDocsPage> {
  return safeFetch<CmsDocsPage>('/docs-page', TTL.PAGE, {}, POPULATE.DYNAMIC_ZONE_WITH_HEADER);
}

export async function getLoginPage(): Promise<CmsLoginPage> {
  return safeFetch<CmsLoginPage>('/login-page', TTL.STATIC, {
    cardTitle: 'Sign in',
    cardDescription: 'Access the AI Fullstack Accelerator',
    signInButtonLabel: 'Continue with Microsoft',
    signInLoadingLabel: 'Redirecting...',
    footerNotice: 'Sign-in is managed securely by Microsoft Entra. Only authorized users may access this application.',
    errorMessages: {
      OAuthSignin: 'Could not start the sign-in flow. Please try again.',
      OAuthCallback: 'Sign-in failed during callback. Please try again.',
      AccessDenied: 'Access denied. You may not have permission to access this application.',
      Default: 'An unexpected error occurred during sign-in. Please try again.',
    },
  });
}

export async function getNotFoundPage(): Promise<CmsNotFoundPage> {
  return safeFetch<CmsNotFoundPage>('/not-found-page', TTL.STATIC, {
    errorCode: '404',
    heading: 'Page Not Found',
    message: 'The page you are looking for does not exist or has been moved.',
    backButton: { label: 'Back to Home', href: '/', variant: 'primary' },
  });
}

export async function getErrorPage(): Promise<CmsErrorPage> {
  return safeFetch<CmsErrorPage>('/error-page', TTL.STATIC, {
    title: 'Something went wrong',
    description: 'We encountered an unexpected error. Please try again.',
    retryButtonLabel: 'Try again',
    homeButtonLabel: 'Go home',
  });
}

// ─── UI Labels ────────────────────────────────────────────────────────────

export async function getArticleListingLabels(): Promise<CmsArticleListingLabels> {
  return safeFetch<CmsArticleListingLabels>('/article-listing-labels', TTL.LABELS, {
    pageTitle: 'Browse Articles',
    searchPlaceholder: 'Search articles...',
    sortByLabel: 'Sort by:',
    sortOptions: [
      { value: 'recent', label: 'Most Recent' },
      { value: 'votes', label: 'Most Voted' },
      { value: 'alphabetical', label: 'Alphabetical' },
    ],
    filterSectionHeader: 'Filters',
    clearAllLabel: 'Clear all',
    categoryLabel: 'Category',
    allCategoriesLabel: 'All Categories',
    tagsLabel: 'Tags',
    tagModeLabel: 'Match:',
    anyLabel: 'Any',
    allLabel: 'All',
    dateRangeHeader: 'Date Range',
    clearDatesLabel: 'Clear dates',
    fromLabel: 'From',
    toLabel: 'To',
    activeFiltersLabel: 'Active Filters',
    filtersButtonLabel: 'Filters',
    filterSheetTitle: 'Filter Articles',
    filterSheetDescription: 'Refine your search by category and tags',
    savedSearchesHeader: 'Saved Searches',
    saveCurrentLabel: 'Save current',
    saveDialogTitle: 'Save Search',
    saveDialogDescription: 'Give this search a name to quickly access it later.',
    searchNameLabel: 'Search name',
    searchNamePlaceholder: 'e.g. Tutorials with React',
    cancelLabel: 'Cancel',
    saveLabel: 'Save',
    recentlyViewedHeader: 'Recently Viewed',
    clearLabel: 'Clear',
    previousLabel: 'Previous',
    nextLabel: 'Next',
    emptyFilteredHeading: 'No articles found',
    emptyUnfilteredHeading: 'No articles available',
    emptyFilteredDescription: "Try adjusting your filters or search query to find what you're looking for.",
    emptyUnfilteredDescription: 'There are no articles yet. Check back later.',
    clearFiltersLabel: 'Clear all filters',
  });
}

export async function getArticleDetailLabels(): Promise<CmsArticleDetailLabels> {
  return safeFetch<CmsArticleDetailLabels>('/article-detail-labels', TTL.LABELS, {
    breadcrumbAriaLabel: 'Breadcrumb',
    voteAriaTemplate: 'Vote for this article. {count} votes',
    votesLabel: 'votes',
    voteAnnouncementTemplate: 'Voted! {count} total votes',
    noContentMessage: 'No content available for this article.',
    relatedArticlesTitle: 'Related Articles',
    noRelatedMessage: 'No related articles found',
    editLabel: 'Edit',
    deleteLabel: 'Delete',
    deleteDialogTitle: 'Delete Article?',
    deleteDialogDescription: 'This action cannot be undone. The article will be permanently removed.',
    cancelLabel: 'Cancel',
    deleteConfirmLabel: 'Delete',
    deletingLabel: 'Deleting...',
  });
}

export async function getArticleFormLabels(): Promise<CmsArticleFormLabels> {
  return safeFetch<CmsArticleFormLabels>('/article-form-labels', TTL.LABELS, {
    createTitle: 'New Article',
    editTitle: 'Edit Article',
    titleLabel: 'Title *',
    titlePlaceholder: 'e.g. Getting Started with React Server Components',
    slugPreviewTemplate: 'Slug preview: {slug}',
    shortDescLabel: 'Short Description *',
    shortDescPlaceholder: 'A brief summary of the article (shown in listings)',
    categoryLabel: 'Category *',
    categoryPlaceholder: 'Select a category',
    tagsLabel: 'Tags',
    tagPlaceholder: 'Add a tag and press Enter',
    addTagLabel: 'Add',
    tagCountTemplate: '{count}/{max} tags',
    contentLabel: 'Full Content (Markdown)',
    contentPlaceholder: 'Write the full article content in Markdown...',
    authorLabel: 'Author',
    authorPlaceholder: 'Your name (optional)',
    adminSettingsLabel: 'Admin Settings',
    featuredLabel: 'Featured article',
    trendingLabel: 'Trending article',
    cancelLabel: 'Cancel',
    createLabel: 'Create Article',
    creatingLabel: 'Creating...',
    saveLabel: 'Save Changes',
    savingLabel: 'Saving...',
  });
}
