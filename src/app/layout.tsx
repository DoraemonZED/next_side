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
  title: {
    default: "AWEI｜数字实验室",
    template: "%s｜AWEI",
  },
  description: "一个关于全栈开发、AI 应用、工程实践与数字创造的个人实验室。",
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
              <div className="site-shell relative flex min-h-screen flex-col">
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
