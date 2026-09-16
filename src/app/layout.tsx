import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import { GlobalUI } from "@/components/GlobalUI";
import { PullToRefresh } from "@/components/PullToRefresh";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "杨伟｜Agent 全栈工程师",
  description: "杨伟的 Agent 全栈工程师个人简历：Node.js、NestJS、AI Agent、实时通信与多端交付。",
  icons: {
    icon: "/favicon.svg",
  },
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
          defaultTheme="dark"
          enableSystem
        >
          <SmoothScroll>
            <PullToRefresh>
              <div className="relative flex min-h-screen flex-col">
                <Header initialAuthState={initialAuthState} />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </PullToRefresh>
            <GlobalUI />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
