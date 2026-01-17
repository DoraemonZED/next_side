import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { GlobalUI } from "@/components/GlobalUI";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MySite - 个人中心",
  description: "基于 Next.js, Tailwind, Shadcn 和 Zustand 构建的现代化站点",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 在服务端获取登录状态
  const session = await getSession();
  const initialAuthState = session
    ? { user: session.user, isAuthenticated: true }
    : { user: null, isAuthenticated: false };

  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
        >
          <SmoothScroll>
            <div className="relative flex min-h-screen flex-col">
              <Header initialAuthState={initialAuthState} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <GlobalUI />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
