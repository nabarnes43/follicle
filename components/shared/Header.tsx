interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="container mx-auto px-4 pt-4">
      <h1 className="mb-4 text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
