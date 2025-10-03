import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-foreground text-5xl font-bold">Follicle v0.0</h1>

      <div className="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  )
}
