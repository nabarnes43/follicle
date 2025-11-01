import Link from 'next/link'

const testPages = [
  {
    name: 'FrequencySelector',
    path: '/test/frequency-selector',
    description: 'Test frequency input with interval, unit, and days selection',
  },
  {
    name: 'ProductSearch',
    path: '/test/product-search',
    description: 'Test product search and selection functionality',
  },
  {
    name: 'RoutineStepCard',
    path: '/test/routine-step-card',
    description: 'Test routine step creation and editing',
  },
  {
    name: 'RoutineCard',
    path: '/test/routine-card',
    description: 'Test routine display and actions',
  },
]

export default function TestDashboard() {
  return (
    <div className="container mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Component Test Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manual testing environment for Follicle components
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testPages.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className="group hover:border-primary hover:bg-accent rounded-lg border p-6 transition-colors"
          >
            <h2 className="group-hover:text-primary mb-2 text-xl font-semibold">
              {page.name}
            </h2>
            <p className="text-muted-foreground text-sm">{page.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
