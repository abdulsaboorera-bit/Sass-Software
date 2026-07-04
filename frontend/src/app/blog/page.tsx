import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Business Automation & Software Insights",
  description: "Expert articles on restaurant management, clinic digitization, school automation, and business software best practices.",
};

const posts = [
  {
    slug: "restaurant-pos-benefits",
    category: "Restaurant", categoryColor: "text-orange-400", categoryBg: "bg-orange-500/10",
    title: "5 Ways a Modern POS System Transforms Restaurant Operations",
    excerpt: "From reducing order errors to real-time inventory tracking, discover how a restaurant POS system pays for itself within 30 days.",
    readTime: "5 min read", date: "June 10, 2026",
    gradient: "from-orange-500/20 to-red-500/10",
  },
  {
    slug: "clinic-paperless-guide",
    category: "Healthcare", categoryColor: "text-emerald-400", categoryBg: "bg-emerald-500/10",
    title: "The Complete Guide to Going Paperless in Your Clinic",
    excerpt: "Step-by-step guide to transitioning from paper records to a fully digital clinic management system without disrupting patient care.",
    readTime: "8 min read", date: "May 28, 2026",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
  {
    slug: "school-fee-automation",
    category: "Education", categoryColor: "text-purple-400", categoryBg: "bg-purple-500/10",
    title: "How School Fee Automation Increased Collection Rates by 40%",
    excerpt: "Manual fee collection is a thing of the past. Discover how automated challans and payment reminders transformed Horizon Academy.",
    readTime: "6 min read", date: "May 15, 2026",
    gradient: "from-purple-500/20 to-pink-500/10",
  },
  {
    slug: "inventory-management-bookshop",
    category: "Retail", categoryColor: "text-blue-400", categoryBg: "bg-blue-500/10",
    title: "Inventory Management Best Practices for Book Shops in 2026",
    excerpt: "Learn how smart reorder points, barcode scanning, and supplier integration can reduce inventory costs by up to 35%.",
    readTime: "7 min read", date: "May 5, 2026",
    gradient: "from-blue-500/20 to-indigo-500/10",
  },
  {
    slug: "digital-transformation-sme",
    category: "Business", categoryColor: "text-cyan-400", categoryBg: "bg-cyan-500/10",
    title: "Digital Transformation for Pakistani SMEs: Where to Start",
    excerpt: "A practical roadmap for small and medium businesses looking to adopt management software without breaking the bank.",
    readTime: "10 min read", date: "April 22, 2026",
    gradient: "from-cyan-500/20 to-blue-500/10",
  },
  {
    slug: "cloud-vs-local-software",
    category: "Technology", categoryColor: "text-yellow-400", categoryBg: "bg-yellow-500/10",
    title: "Cloud-Based vs. Local Software: Which is Right for Your Business?",
    excerpt: "Breaking down the pros and cons of cloud and on-premise software so you can make the right decision for your specific business needs.",
    readTime: "6 min read", date: "April 10, 2026",
    gradient: "from-yellow-500/20 to-orange-500/10",
  },
  {
    slug: "multi-branch-management",
    category: "Business", categoryColor: "text-cyan-400", categoryBg: "bg-cyan-500/10",
    title: "Managing Multiple Business Locations with a Single System",
    excerpt: "How restaurant chains, clinic networks, and school systems use centralized management software to scale without chaos.",
    readTime: "5 min read", date: "March 28, 2026",
    gradient: "from-slate-500/20 to-blue-500/10",
  },
  {
    slug: "data-security-smb",
    category: "Technology", categoryColor: "text-yellow-400", categoryBg: "bg-yellow-500/10",
    title: "Data Security for Small Businesses: What You Need to Know",
    excerpt: "Patient records, student data, financial information — how Orbitrix ERP protects your most sensitive business data.",
    readTime: "7 min read", date: "March 15, 2026",
    gradient: "from-slate-600/20 to-purple-500/10",
  },
  {
    slug: "roi-management-software",
    category: "Business", categoryColor: "text-cyan-400", categoryBg: "bg-cyan-500/10",
    title: "Calculating ROI of Management Software for Your Business",
    excerpt: "A simple framework to calculate the return on investment when implementing business management software — with real examples.",
    readTime: "8 min read", date: "March 5, 2026",
    gradient: "from-green-500/20 to-cyan-500/10",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = posts;

  return (
    <>
      <section className="relative pt-28 pb-16 bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="badge badge-blue mx-auto mb-5">Orbitrix ERP Blog</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-[1.1]">
            Insights on <span className="gradient-text">Business Automation</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Expert articles, guides, and industry insights to help you run a more
            efficient, profitable business.
          </p>
        </div>
      </section>

      <section className="py-16 section-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Featured post */}
          <div className="mb-12">
            <div className={`bg-gradient-to-br ${featured.gradient} border border-slate-200 rounded-3xl p-8 md:p-12 card-hover`}>
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`badge text-[11px] ${featured.categoryBg} ${featured.categoryColor} border-transparent`}>
                    <Tag size={10} /> {featured.category}
                  </span>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Clock size={11} /> {featured.readTime}
                  </span>
                  <span className="text-slate-400 text-xs">{featured.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4 leading-snug">
                  {featured.title}
                </h2>
                <p className="text-slate-600 text-base leading-relaxed mb-6">{featured.excerpt}</p>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all text-sm"
                >
                  Read Article <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Rest of posts */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-hover group"
              >
                <div className={`h-32 bg-gradient-to-br ${post.gradient}`} />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge text-[10px] ${post.categoryBg} ${post.categoryColor} border-transparent`}>
                      {post.category}
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock size={10} /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">{post.date}</span>
                    <span className="text-blue-500 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 bg-[#0f172a]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">Get Articles in Your Inbox</h2>
          <p className="text-slate-400 mb-6">Monthly insights on business automation and software. No spam, ever.</p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button type="submit" className="btn-primary py-3 px-5 text-sm">
              Subscribe <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
