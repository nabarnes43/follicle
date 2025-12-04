interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="container mx-auto px-4 py-2">
      <h1 className="mb-2 text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
