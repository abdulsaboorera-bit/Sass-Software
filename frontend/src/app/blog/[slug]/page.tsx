import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Tag, ArrowRight } from "lucide-react";

const articles: Record<string, {
  title: string; category: string; date: string; readTime: string;
  excerpt: string; content: string;
}> = {
  "restaurant-pos-benefits": {
    title: "5 Ways a Modern POS System Transforms Restaurant Operations",
    category: "Restaurant", date: "June 10, 2026", readTime: "5 min read",
    excerpt: "From reducing order errors to real-time inventory tracking, discover how a restaurant POS system pays for itself within 30 days.",
    content: `Running a busy restaurant is one of the hardest jobs in business. Orders come in from all directions — dine-in, takeaway, delivery — while your kitchen team scrambles to keep up and your cashier juggles split bills and discounts.

A modern Point of Sale (POS) system changes all of that. Here are 5 concrete ways it transforms your restaurant:

## 1. Eliminate Order Errors Completely

Miscommunication between front-of-house and kitchen is the #1 source of errors in restaurants. With a digital POS connected to a Kitchen Display System (KDS), every order is transmitted instantly and accurately — no more shouting across a busy floor or illegible paper tickets.

**Real impact:** Khan's Family Restaurant reduced order errors by 95% in their first week after deployment.

## 2. Real-Time Inventory Tracking

Without a POS, restaurants typically discover they're out of an ingredient when a customer orders it. With a modern system, every item sold automatically deducts from your inventory. You get:

- Low-stock alerts before you run out
- Automatic purchase order generation for suppliers
- Wastage tracking and cost-of-goods reports

This alone can reduce food costs by 20–30%.

## 3. Faster Table Turnover

Speed is revenue in a restaurant. A digital POS means:

- Waiters take orders on tablets — no trips back to a terminal
- Kitchen starts preparation the moment the order is placed
- Bills are generated in seconds, not minutes

Faster service means more table turns, especially during peak hours.

## 4. Accurate Daily Reporting in Minutes

End-of-day with a spreadsheet can take 2 hours and still contain errors. A POS automatically calculates:

- Total revenue by payment method
- Best-selling items and categories
- Hourly sales trends and peak periods
- Staff performance and shift summaries

In minutes, not hours.

## 5. Better Customer Experience

Customers notice when a restaurant is well-run. With a POS:

- Orders arrive correctly, every time
- Wait times are shorter
- Split bills and custom orders are handled smoothly
- Customer purchase history enables personalized loyalty programs

**The result:** Higher tips, more positive reviews, and repeat customers.

---

## Is a POS System Worth the Investment?

The average restaurant using Orbitrix ERP's Restaurant Management System reports a 32% revenue increase in the first 6 months. The system typically pays for itself within 30 days through reduced waste, faster service, and fewer errors.

Want to see it in action? [Book a free demo](/demo) and we'll show you exactly how it works for your restaurant.`,
  },
  "clinic-paperless-guide": {
    title: "The Complete Guide to Going Paperless in Your Clinic",
    category: "Healthcare", date: "May 28, 2026", readTime: "8 min read",
    excerpt: "Step-by-step guide to transitioning from paper records to a fully digital clinic management system without disrupting patient care.",
    content: `Going paperless is one of the highest-ROI decisions a clinic can make. But the transition can feel daunting — what happens to existing records? Will staff cope with the change? Will patients be affected?

This guide walks you through every step of a smooth, disruption-free transition.

## Step 1: Audit Your Current Processes

Before digitizing, map every paper-based process in your clinic:

- Patient registration forms
- Appointment booking (phone calls, walk-ins)
- Prescription writing
- Lab result filing
- Billing and receipts

This audit reveals which processes need digital equivalents and helps you prioritize the rollout.

## Step 2: Choose the Right System

Not all clinic management systems are equal. Look for:

- **EMR (Electronic Medical Records):** Core to any digital clinic
- **Appointment scheduling:** Online and walk-in booking
- **Prescription builder:** With medicine database integration
- **Billing:** Insurance claim support and payment tracking
- **Reports:** Automated daily, weekly, monthly

Orbitrix ERP's Clinic Management System includes all of these out of the box.

## Step 3: Migrate Existing Records

This is where most clinics get stuck. You don't need to digitize everything at once:

- Start with active patients (those seen in the last 6 months)
- For inactive patients, digitize records only when they visit
- Import appointment history and billing from your existing system or Excel sheets

Orbitrix ERP handles data migration as part of the onboarding process.

## Step 4: Train Your Staff

A system is only as good as its adoption. Run:

- 2-hour training session for reception staff (registration, appointments, billing)
- 1-hour session for doctors (EMR, prescriptions)
- 30-minute session for accounts staff (billing, reports)

Our team handles training in-person or via video call, included in every plan.

## Step 5: Go Live Gradually

Don't flip the switch overnight. A phased rollout works best:

**Week 1:** Digital appointments only. Keep paper as backup.
**Week 2:** Add digital registration. Paper forms as backup.
**Week 3:** Add digital prescriptions and billing.
**Week 4:** Full paperless clinic. Remove paper forms.

By week 4, your staff will be confident and patients will notice the improvement.

## What to Expect After Going Paperless

- Patient check-in time: 5 minutes → under 1 minute
- Prescription errors: Virtually eliminated
- Appointment no-shows: Reduced 60–70% with automated reminders
- End-of-day billing reconciliation: 45 minutes → 5 minutes

**Ready to go paperless?** [Book a free demo](/demo) with our healthcare specialist.`,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: "Article Not Found" };
  return { title: article.title, description: article.excerpt };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d3b3f]">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-4">Article Not Found</h1>
          <Link href="/blog" className="btn-primary">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const contentHtml = article.content
    .split("\n")
    .map((line) => {
      if (line.startsWith("## ")) return `<h2 class="text-slate-900 font-bold text-2xl mt-8 mb-4">${line.slice(3)}</h2>`;
      if (line.startsWith("**") && line.endsWith("**")) return `<p class="text-slate-700 font-semibold my-2">${line.slice(2, -2)}</p>`;
      if (line.startsWith("- ")) return `<li class="text-slate-600 text-base ml-4 list-disc">${line.slice(2)}</li>`;
      if (line.startsWith("---")) return `<hr class="border-slate-200 my-6"/>`;
      if (line.trim() === "") return `<br/>`;
      return `<p class="text-slate-600 text-base leading-relaxed my-2">${line}</p>`;
    })
    .join("");

  return (
    <>
      <section className="relative pt-28 pb-12 bg-[#0d3b3f] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-blue">{article.category}</span>
            <span className="text-slate-400 text-sm flex items-center gap-1"><Clock size={12} /> {article.readTime}</span>
            <span className="text-slate-400 text-sm">{article.date}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-[1.15]">
            {article.title}
          </h1>
          <p className="text-slate-400 text-lg">{article.excerpt}</p>
        </div>
      </section>

      <section className="py-12 section-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-12">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>

          {/* CTA */}
          <div className="mt-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 text-white text-center">
            <h3 className="font-extrabold text-2xl mb-2">Ready to Transform Your Business?</h3>
            <p className="text-blue-100 mb-5">Book a free demo and see the system in action — tailored for your industry.</p>
            <Link href="/demo" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-all">
              Request Free Demo <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
