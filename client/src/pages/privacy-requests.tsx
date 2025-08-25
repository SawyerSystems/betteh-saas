import { useState } from "react";
import SEOHead from "@/components/SEOHead";

export default function PrivacyRequests() {
  const [status, setStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch('/api/privacy-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to submit request');
      setStatus('success');
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Something went wrong');
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SEOHead
        title="Privacy Requests — Coach Will Tumbles"
        description="Submit a privacy rights request."
        canonicalUrl="https://www.coachwilltumbles.com/privacy-requests"
        robots="noindex,follow"
      />
      <div className="container mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Privacy Requests</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Use this form to request access, deletion, or update of your data.</p>
        </header>

        <form onSubmit={submit} className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input name="name" required className="mt-1 w-full border rounded px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" name="email" required className="mt-1 w-full border rounded px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input name="phone" className="mt-1 w-full border rounded px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800" />
          </div>
          <div>
            <label className="block text-sm font-medium">Request Type</label>
            <select name="type" required className="mt-1 w-full border rounded px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800">
              <option value="access">Access my data</option>
              <option value="deletion">Delete my data</option>
              <option value="correction">Correct my data</option>
              <option value="optout">Opt-out of marketing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Details</label>
            <textarea name="details" rows={5} className="mt-1 w-full border rounded px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800" placeholder="Provide details to help us process your request" />
          </div>
          <button disabled={status==='submitting'} className="btn-athletic-red text-white px-4 py-2 rounded">
            {status==='submitting' ? 'Submitting…' : 'Submit Request'}
          </button>
          {status==='success' && (
            <p className="text-green-600 dark:text-green-400 text-sm">Request received. Well email you shortly.</p>
          )}
          {status==='error' && (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
