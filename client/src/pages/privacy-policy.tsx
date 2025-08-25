import SEOHead from "@/components/SEOHead";
import { LEGAL } from "@/constants/legal";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SEOHead
        title="Privacy Policy — Coach Will Tumbles"
        description="How we collect, use, and protect your information."
        canonicalUrl="https://www.coachwilltumbles.com/privacy"
      />
      <div className="container mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Last updated: {new Date(LEGAL.lastUpdatedISO).toLocaleDateString()}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <nav className="md:sticky md:top-24 md:self-start border rounded-lg p-4 text-sm bg-white dark:bg-slate-900 dark:border-slate-800">
            <ul className="space-y-2">
        <li><a href="#overview" className="hover:underline">Overview</a></li>
        <li><a href="#data-we-collect" className="hover:underline">Data We Collect</a></li>
        <li><a href="#how-we-use" className="hover:underline">How We Use Data</a></li>
        <li><a href="#sharing" className="hover:underline">Sharing</a></li>
        <li><a href="#cookies" className="hover:underline">Cookies</a></li>
        <li><a href="#your-rights" className="hover:underline">Your Rights</a></li>
        <li><a href="#contact" className="hover:underline">Contact</a></li>
            </ul>
          </nav>

      <main className="prose prose-slate dark:prose-invert max-w-none">
            <section id="overview">
              <p>
                This Privacy Policy describes how {LEGAL.businessName} ("we", "us") collects, uses, and shares
                information when you use our website and services. By using the site, you agree to this policy.
              </p>
            </section>

            <section id="data-we-collect">
              <h2>Data We Collect</h2>
              <ul>
                <li>Account and contact info: parent name, email, phone.</li>
                <li>Athlete profile info: name, age/DOB, experience, allergies/medical notes.</li>
                <li>Booking details: lesson type, date/time preferences, focus areas.</li>
                <li>Payment metadata (via Stripe) and waiver details.</li>
                <li>Site activity and device info for security and performance.</li>
              </ul>
            </section>

            <section id="how-we-use">
              <h2>How We Use Data</h2>
              <ul>
                <li>Provide booking, coaching, parent portal, and progress features.</li>
                <li>Send confirmations, reminders, and account communications.</li>
                <li>Improve safety, security, and service quality.</li>
                <li>Comply with legal obligations and our Terms.</li>
              </ul>
            </section>

            <section id="sharing">
              <h2>Sharing</h2>
              <p>
                We don’t sell personal information. We may share with service providers (e.g., Stripe for payments,
                Resend for email, Supabase for storage) under strict contracts. We may disclose if required by law.
              </p>
            </section>

            <section id="cookies">
              <h2>Cookies & Similar</h2>
              <p>
                We use essential cookies for session and security. Optional analytics/marketing technologies are
                controlled by your Cookie Settings. You can change or withdraw consent anytime via the footer link.
              </p>
            </section>

            <section id="your-rights">
              <h2>Your Privacy Rights</h2>
              <p>
                Depending on your region, you may have rights to access, correct, delete, or restrict processing of
                your data. To submit a request, use the Privacy Requests page.
              </p>
            </section>

            <section id="contact">
              <h2>Contact Us</h2>
              <p>
                Email: {LEGAL.contactEmail}<br />
                Address: {LEGAL.contactAddress}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
