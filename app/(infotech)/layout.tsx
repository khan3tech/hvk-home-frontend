import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/lib/session/session-provider";

export default function InfotechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </SessionProvider>
  );
}
