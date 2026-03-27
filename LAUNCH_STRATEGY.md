# ReplyEngine — Launch Strategy & Go-to-Market Plan

---

## Phase 1: Pre-Launch (Weeks 1-2) — Do Now

### Technical Readiness

**Staging Environment:**
- Deploy a second Vercel project (replyengine-staging.vercel.app)
- Create a separate Supabase project for staging with identical schema
- Set up separate Stripe test mode keys
- Use this for all end-to-end testing before touching production

**Smoke Test Checklist (run manually before launch):**
- [ ] New user signup with email confirmation
- [ ] Google Business Profile OAuth connection
- [ ] Reviews pulled and displayed in dashboard
- [ ] AI response generation (all star ratings: 1, 2, 3, 4, 5)
- [ ] One-tap post response to Google
- [ ] Dispute detection flags a suspicious review
- [ ] Recovery outreach creates and sends a sequence
- [ ] Free tier limit enforcement (blocks after 5 responses)
- [ ] Starter plan checkout via Stripe
- [ ] Pro plan checkout via Stripe
- [ ] Plan upgrade (free → starter, starter → pro)
- [ ] Plan downgrade behavior
- [ ] Billing portal (update payment, cancel)
- [ ] Multi-location: add second location, switch between them
- [ ] Analytics page loads with real data
- [ ] Email notifications deliver (check Resend dashboard)
- [ ] Mobile responsive: test every page on phone-width browser

**Google OAuth (START IMMEDIATELY):**
- Submit GBP API access application today
- Configure OAuth consent screen
- Record the video walkthrough
- Submit for sensitive scope verification
- See GOOGLE_OAUTH_GUIDE.md for detailed steps

### Beta Program (5-10 businesses)

**Who to recruit:**
- Your own business (if you have one)
- Friends/family who own businesses with Google reviews
- Local businesses you frequent (coffee shop, barber, dentist, etc.)
- Post in local business Facebook groups or Nextdoor
- Reach out to small business owners in your network

**Beta pitch (copy-paste ready):**
> "Hey [Name], I'm building a tool that helps businesses manage their Google reviews with AI — it writes responses, spots fake reviews, and helps recover unhappy customers. I'm looking for 5 business owners to try it free for a month and give me feedback. Would you be interested? It takes about 5 minutes to set up."

**What you need from beta users:**
- Add them as test users in Google Cloud Console (while OAuth is pending)
- Walk them through the setup on a call (screen share)
- Ask them to use it for 2 weeks minimum
- Schedule a 15-minute feedback call after week 1 and week 2
- Get a testimonial quote if they're happy (use on landing page)

**Beta feedback form (create a simple Google Form):**
1. How easy was it to set up? (1-5)
2. How useful are the AI-generated responses? (1-5)
3. Did you find the dispute detection feature valuable? (1-5)
4. What feature would you most want added?
5. Would you pay $19/mo for this? $39/mo?
6. What almost made you stop using it?
7. Can we use a quote from you on our website?

---

## Phase 2: Launch Prep (Weeks 2-3)

### Domain & Branding

- [ ] Register replyengine.com (or your chosen domain)
- [ ] Set up custom domain on Vercel
- [ ] Set up email on your domain (for Resend sending + business communications)
- [ ] Verify domain with Resend for transactional emails
- [ ] Set up a support email (support@replyengine.com)
- [ ] Create social media accounts: Twitter/X, LinkedIn (minimum)

### Landing Page Optimization

Your landing page is already built. Optimize for conversions:

- [ ] Add beta testimonials/quotes (from Phase 1 beta users)
- [ ] Add a "trusted by X businesses" counter (even if it's 5)
- [ ] Make sure the Free Tool (/free) works perfectly — this is your #1 lead gen
- [ ] Add an email capture for a "Review Management Tips" newsletter
- [ ] Add live chat or a "Book a Demo" calendar link (Calendly free tier)
- [ ] Add a "How It Works" section with 3 simple steps
- [ ] Optimize page speed (run Lighthouse, aim for 90+)

### SEO Foundations

**Target keywords (long-tail, low competition, high intent):**
- "google review response generator" ← your free tool targets this
- "how to respond to negative google reviews"
- "google review management software"
- "ai review response tool"
- "dispute fake google reviews"
- "automated google review replies"
- "how to remove fake google reviews"

**Content to create (blog posts — can be added later):**
- "How to Respond to Every Type of Google Review (With Examples)"
- "How to Dispute a Fake Google Review: Step-by-Step Guide"
- "Why Your Google Rating Is Costing You Customers (And How to Fix It)"
- "The Small Business Owner's Guide to Review Management"
- "What Is a Fairness Score? How Unfair Reviews Hurt Your Business"

**Technical SEO:**
- [ ] Verify sitemap.ts generates all pages correctly
- [ ] Add proper meta descriptions to each marketing page
- [ ] Set up Google Search Console and submit sitemap
- [ ] Add structured data (LocalBusiness schema) to landing page
- [ ] Ensure the /free tool page has its own meta tags optimized for "google review response generator"

### Stripe Production Setup

- [ ] Switch from Stripe test mode to live mode
- [ ] Create live price IDs for Starter ($19/mo) and Pro ($39/mo)
- [ ] Update environment variables with live Stripe keys
- [ ] Test a real $1 checkout and refund it
- [ ] Set up Stripe Tax if needed for your jurisdiction
- [ ] Configure dunning emails in Stripe (for failed payments)

---

## Phase 3: Soft Launch (Week 3-4)

### Launch Day Checklist

- [ ] Google OAuth verification approved
- [ ] All smoke tests passing on production
- [ ] Stripe live mode active and tested
- [ ] Error monitoring set up (Vercel Analytics or Sentry free tier)
- [ ] Support email ready
- [ ] Landing page has testimonials

### Initial User Acquisition (First 50 Users)

**Free tool SEO (ongoing, starts producing results in 4-8 weeks):**
- Your /free page is a free Google review response generator
- People search for this, use it, see the value, then sign up
- This is your long-term growth engine — optimize it ruthlessly

**Direct outreach (fastest results):**
- Identify 100 local businesses with Google reviews
- Send a personalized cold email showing their current rating + fairness score
- Template:

> Subject: Your [Business Name] Google rating could be [X.X] instead of [Y.Y]
>
> Hi [Name],
>
> I noticed [Business Name] has a [Y.Y] rating on Google, but when I ran your reviews through our analysis tool, it looks like [N] of your reviews may be illegitimate — without those, your rating would be [X.X].
>
> I built ReplyEngine to help businesses like yours manage Google reviews with AI. It writes responses in your voice, flags suspicious reviews, and helps you recover unhappy customers.
>
> Would you like to try it free? No credit card needed.
>
> [Link to signup]

- This works because you're giving them personalized value upfront

**Product Hunt launch:**
- Good for initial buzz and backlinks
- Prepare: tagline, description, screenshots, maker comment
- Best to launch on a Tuesday or Wednesday
- Rally your beta users to upvote and comment

**Communities & forums:**
- r/smallbusiness, r/Entrepreneur, r/SaaS on Reddit (provide value, don't spam)
- Local business Facebook groups
- Google Business Profile Help Community (answer questions, mention your tool when relevant)
- Indie Hackers (share your build journey)

**LinkedIn content:**
- Post about your journey building ReplyEngine
- Share insights about review management
- "How fake reviews cost small businesses $X per year" type content
- Tag local business owners you know

### Pricing Strategy Notes

Your current pricing (Free/$19/$39) is solid for launch. A few thoughts:

- **Free tier is critical** — it gets people in the door and using the product. 5 responses/month is enough to see value but not enough to avoid upgrading.
- **$19 Starter is the sweet spot** for single-location businesses. Most of your early customers will be here.
- **$39 Pro** should feel like a no-brainer for anyone managing reviews seriously. Unlimited responses + recovery outreach + analytics is a strong value prop.
- **Future: Enterprise tier** ($99-199/mo) for agencies and multi-location chains once you have multi-location support proven out.
- **Consider annual pricing** at a 20% discount to reduce churn and improve cash flow.

---

## Phase 4: Growth (Month 2+)

### Content Marketing

- Publish 2 blog posts per month targeting your SEO keywords
- Create a "Review Response Templates" free resource (email gate)
- Record short Loom videos showing ReplyEngine in action
- Start a "Small Business Reviews" email newsletter

### Partnerships

- **Review management consultants** — they can white-label or refer clients
- **Local SEO agencies** — reviews are part of their service, ReplyEngine makes it easier
- **POS/booking software** — integrations that trigger review requests after a transaction
- **Business coaching communities** — present at meetups or webinars

### Metrics to Track

From day one, track these weekly:
- New signups (free + paid)
- Free → paid conversion rate (target: 5-10%)
- Monthly recurring revenue (MRR)
- Churn rate (target: <5% monthly)
- AI responses generated (usage = engagement)
- Disputes filed (feature adoption)
- NPS from users (survey quarterly)

### Feature Roadmap (After Launch)

Based on what would make the product stickier and more valuable:

1. **Review request links** — Generate a short link businesses can text/email to customers asking for a review (drives review volume up)
2. **Competitor benchmarking** — Show how their rating/volume compares to local competitors
3. **AI response A/B testing** — Test different response tones and track which ones lead to review updates
4. **Slack/email digest** — Daily or weekly summary of new reviews and actions taken
5. **Team accounts** — Multiple users per business (for agencies)
6. **API access** — Let power users integrate ReplyEngine into their own workflows
7. **Review widgets** — Embeddable widget showing best reviews on their website

---

## Timeline Summary

| Week | Action |
|------|--------|
| Now | Submit Google OAuth + GBP API applications |
| Now | Run testing prompt in Claude Code |
| Week 1 | Recruit 5 beta users, start testing |
| Week 1 | Set up domain, email, social accounts |
| Week 2 | Beta feedback, fix issues, collect testimonials |
| Week 2 | SEO setup, landing page optimization |
| Week 3 | Google OAuth approved (hopefully) |
| Week 3 | Stripe live mode, final smoke tests |
| Week 3-4 | Soft launch, direct outreach to 100 businesses |
| Week 4 | Product Hunt launch |
| Month 2+ | Content marketing, partnerships, iterate on feedback |
