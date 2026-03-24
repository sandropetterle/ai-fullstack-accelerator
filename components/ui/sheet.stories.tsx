import type { Meta, StoryObj } from '@storybook/react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'
import { Button } from './button'
import { SlidersHorizontal } from 'lucide-react'

const meta: Meta = {
  title: 'UI/Sheet',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const FilterSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-label="Filter panel">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow down patterns by category, tags, and date.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Filter options would appear here.</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
}

export const MobileNav: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">Menu</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-3">
          <a href="/patterns" className="text-sm font-medium hover:text-primary">Patterns</a>
          <a href="/about" className="text-sm font-medium hover:text-primary">About</a>
          <a href="/docs" className="text-sm font-medium hover:text-primary">Docs</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
}

export const BottomSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Bottom Sheet</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Actions</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1">Cancel</Button>
          <Button className="flex-1">Confirm</Button>
        </div>
      </SheetContent>
    </Sheet>
  ),
}
