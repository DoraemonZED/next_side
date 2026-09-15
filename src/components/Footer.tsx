export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="site-footer__copy text-center md:text-left">
            © 2026 AWEI / DIGITAL LAB
          </p>
          <div className="site-footer__links flex items-center space-x-5">
            <a href="#">隐私政策</a>
            <a href="#">服务条款</a>
            <a href="mailto:2433255732@qq.com">联系我</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
