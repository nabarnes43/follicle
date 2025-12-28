'use client'

import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BackButton } from '@/components/navigation/BackButton'

interface TabConfig {
  value: string
  label: string
  icon: ReactNode
  count: number
  content: ReactNode
}

interface SavedPageLayoutProps {
  title: string
  subtitle: string // Optional subtitle
  tabs: TabConfig[]
  defaultTab?: string
  /** Show back button if coming from profile */
  showBackButton?: boolean
}

export function SavedPageLayout({
  title,
  subtitle,
  tabs,
  defaultTab,
  showBackButton = false,
}: SavedPageLayoutProps) {
  return (
    <div>
      {/* Back Button */}
      {showBackButton && (
        <div className="container mx-auto px-4 pt-4">
          <BackButton />
        </div>
      )}

      {/* Title & Subtitle */}
      <div className="container mx-auto px-4 pt-4">
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground mb-3">{subtitle}</p>}
      </div>

      <Tabs defaultValue={defaultTab || tabs[0].value} className="w-full">
        {/* Tabs */}
        <div className="container mx-auto px-4">
          <TabsList className="">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                <span className="mr-2">{tab.icon}</span>
                {tab.label} ({tab.count})
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
