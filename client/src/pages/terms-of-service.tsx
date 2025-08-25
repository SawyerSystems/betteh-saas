import SEOHead from "@/components/SEOHead";
import { LEGAL } from "@/constants/legal";

export default function TermsOfService() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SEOHead
        title="Terms of Service — Coach Will Tumbles"
        description="The rules and expectations for using our services."
        canonicalUrl="{window.location.origin}/terms"
      />
      <div className="container mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Last updated: {new Date(LEGAL.lastUpdatedISO).toLocaleDateString()}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          <nav className="md:sticky md:top-24 md:self-start border rounded-lg p-4 text-sm bg-white dark:bg-slate-900 dark:border-slate-800">
            <ul className="space-y-2">
              <li><a href="#overview" className="hover:underline">Overview</a></li>
              <li><a href="#bookings" className="hover:underline">Bookings & Payments</a></li>
              <li><a href="#safety" className="hover:underline">Safety & Conduct</a></li>
              <li><a href="#waivers" className="hover:underline">Waivers</a></li>
              <li><a href="#privacy" className="hover:underline">Privacy</a></li>
              <li><a href="#changes" className="hover:underline">Changes</a></li>
            </ul>
          </nav>

          <main className="prose prose-slate dark:prose-invert max-w-none">
            <section id="overview">
              <p>
                These Terms govern your access to and use of {LEGAL.businessName}'s website, bookings, and services.
                By using our site or booking, you agree to these Terms.
              </p>
            </section>

            <section id="bookings">
              <h2>Bookings & Payments</h2>
              <ul>
                <li>Reservation fees and session payments are processed securely via Stripe.</li>
                <li>Rescheduling and cancellations may be subject to time-based policies.</li>
                <li>We may refuse or cancel a session for safety or policy reasons.</li>
              </ul>
            </section>

            <section id="safety">
              <h2>Safety & Conduct</h2>
              <p>
                You agree to follow coach instructions, facility rules, and safety protocols. Parents/guardians are
                responsible for athletes' readiness, health disclosures, and behavior.
              </p>
            </section>

            <section id="waivers">
              <h2>Waivers</h2>
              <p>
                Participation requires signing the Waiver & Adventure Agreement. A copy will be emailed and stored for
                records. Photo/video consent is optional and can be changed later.
              </p>
            </section>

            <section id="privacy">
              <h2>Privacy</h2>
              <p>
                Our Privacy Policy explains how we handle personal data and cookies. Where required by law, we will
                request consent for optional cookies and communications.
              </p>
            </section>

            <section id="changes">
              <h2>Changes</h2>
              <p>
                We may update these Terms. Material changes will apply going forward and be reflected by the
                Last Updated date.
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
