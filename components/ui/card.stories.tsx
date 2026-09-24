import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Card>

export const Simple: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Card body content goes here.
        </p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Save Pattern</CardTitle>
        <CardDescription>Export this pattern to your personal library.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This action will add the pattern to your saved items.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
}

export const PatternCardShape: Story = {
  render: () => (
    <Card className="w-80 h-full">
      <CardHeader>
        <div className="mb-2">
          <Badge>Guide</Badge>
        </div>
        <CardTitle className="text-xl">Repository Pattern with EF Core</CardTitle>
        <CardDescription className="line-clamp-3">
          Keep data access behind domain-specific interfaces so services stay
          unit-testable without a database.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">architecture</Badge>
          <Badge variant="secondary" className="text-xs">ef-core</Badge>
          <Badge variant="secondary" className="text-xs">testing</Badge>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <span>142 votes</span>
        <span className="ml-auto">by Alice Chen</span>
      </CardFooter>
    </Card>
  ),
}
