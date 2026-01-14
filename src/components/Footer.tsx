export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2026 MySite. All rights reserved. Built with Next.js & Tailwind.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <a href="#" className="hover:underline">隐私政策</a>
            <a href="#" className="hover:underline">服务条款</a>
            <a href="#" className="hover:underline">联系我们</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
