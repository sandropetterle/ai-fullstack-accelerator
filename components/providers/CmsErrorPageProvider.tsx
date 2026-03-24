'use client'

import { createContext, useContext } from 'react'
import type { CmsErrorPage } from '@/lib/cms/types'

type ErrorPageLabels = {
  title: string
  description: string
  retryButtonLabel: string
  homeButtonLabel: string
}

const DEFAULT: ErrorPageLabels = {
  title: 'Something went wrong',
  description: 'We encountered an unexpected error. Please try again.',
  retryButtonLabel: 'Try again',
  homeButtonLabel: 'Go home',
}

const CmsErrorPageContext = createContext<ErrorPageLabels>(DEFAULT)

export function useCmsErrorPage(): ErrorPageLabels {
  return useContext(CmsErrorPageContext)
}

type Props = {
  labels: CmsErrorPage
  children: React.ReactNode
}

export function CmsErrorPageProvider({ labels, children }: Props) {
  const value: ErrorPageLabels = {
    title: labels.title ?? DEFAULT.title,
    description: labels.description ?? DEFAULT.description,
    retryButtonLabel: labels.retryButtonLabel ?? DEFAULT.retryButtonLabel,
    homeButtonLabel: labels.homeButtonLabel ?? DEFAULT.homeButtonLabel,
  }
  return (
    <CmsErrorPageContext.Provider value={value}>
      {children}
    </CmsErrorPageContext.Provider>
  )
}
