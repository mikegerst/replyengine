# Google OAuth & Business Profile API — Verification Guide

This is a step-by-step guide to getting your ReplyEngine app approved for production use of the Google Business Profile API and Google OAuth. **Start this immediately** — the process can take 2-6 weeks total.

---

## Overview: Two Separate Approvals Needed

You need TWO things approved before real users can connect their Google Business Profile:

1. **Google Business Profile API Access** — permission to use the GBP API at all
2. **OAuth Consent Screen Verification** — permission to show your OAuth screen to any Google user (not just test users)

These can run in parallel. Start both at the same time.

---

## Part 1: Google Business Profile API Access

### Step 1 — Prerequisites

Before applying, make sure you have:

- [ ] A Google Cloud project (you should already have one from development)
- [ ] A Google Business Profile for your own business (even a simple one works — Google wants to see you understand the product)
- [ ] Your business website live and accessible (your Vercel deployment)
- [ ] A business email on your domain (e.g., mike@replyengine.com, NOT a gmail address)

### Step 2 — Apply for API Access

1. Go to: **https://support.google.com/business/contact/api_default**
2. Select **"Application for Basic API Access"** from the dropdown
3. Fill in:
   - **Your Google Cloud project number** (find in Google Cloud Console > Dashboard)
   - **Business use case**: Explain clearly — "ReplyEngine is a SaaS platform that helps small business owners manage and respond to their Google reviews using AI. We need API access to pull reviews, post owner responses, and help businesses dispute illegitimate reviews."
   - **Company website**: Your live Vercel URL
   - **Business email**: Use your domain email
4. Submit and wait for email confirmation

### Step 3 — Check Your Approval Status

- Go to Google Cloud Console > APIs & Services > Quotas
- Look for Business Profile APIs
- If quota shows **0 QPM** → not yet approved
- If quota shows **300 QPM** → approved

### Step 4 — Enable the Required APIs

Once approved, enable ALL of these in your Google Cloud project (APIs & Services > Library):

- [ ] My Business Account Management API
- [ ] My Business Lodging API
- [ ] My Business Place Actions API
- [ ] My Business Notifications API
- [ ] My Business Verifications API
- [ ] My Business Business Information API
- [ ] My Business Q&A API
- [ ] My Business Business Calls API

**Timeline**: Typically 1-3 weeks. Google reviews applications manually.

---

## Part 2: OAuth Consent Screen Verification

### Step 1 — Configure Your OAuth Consent Screen

Go to: Google Cloud Console > APIs & Services > OAuth consent screen

Fill in:
- **App name**: ReplyEngine
- **User support email**: support@replyengine.com (or your email)
- **App logo**: Upload your logo (must be under 1MB)
- **Application home page**: https://replyengine.com (your Vercel URL)
- **Application privacy policy link**: https://replyengine.com/privacy
- **Application terms of service link**: https://replyengine.com/terms
- **Authorized domains**: replyengine.com (or your actual domain)
- **Developer contact information**: Your email

### Step 2 — Configure Scopes

Add only the scopes you actually use. For ReplyEngine, you likely need:

- `https://www.googleapis.com/auth/business.manage` — Read/write access to business info and reviews

This is a **sensitive scope**, which means you'll need the sensitive scope verification (not just brand verification).

### Step 3 — Prepare Your Privacy Policy

Your privacy policy page (already at /privacy) MUST include these specific items for Google's review:

- [ ] How you access Google user data (pulling reviews via API)
- [ ] How you use that data (AI-generated responses, dispute detection, analytics)
- [ ] How you store that data (Supabase database, encrypted tokens)
- [ ] How you share that data (you don't share it with third parties — state this explicitly)
- [ ] How users can request deletion of their data
- [ ] How users can revoke access to their Google account

**Review your /privacy page and update it if any of these are missing.**

### Step 4 — Record the Video Walkthrough

Google requires an **unlisted YouTube video** showing exactly how your app uses Google data. Here's what to include:

**Video script/flow:**

1. **Show the landing page** — briefly show what ReplyEngine does
2. **Show the signup/login flow** — demonstrate creating an account
3. **Trigger the OAuth flow** — click "Connect Google Business Profile"
4. **Show the consent screen** — the Google OAuth dialog must display:
   - Your app name "ReplyEngine"
   - The scopes being requested
   - Your privacy policy link
5. **Show the browser URL bar** — prove it's your actual OAuth client ID in the redirect
6. **Show what happens after consent** — reviews being pulled, displayed in the dashboard
7. **Demonstrate each scope's usage**:
   - Reading reviews (show them in the UI)
   - Posting a response (show the one-tap post flow)
   - Any other data access
8. **Total video length**: 3-5 minutes is ideal

**Recording tips:**
- Record in English
- Use a clean browser profile (no personal bookmarks visible)
- Make sure your test business has some real-looking sample data
- Upload to YouTube as **Unlisted** (not Private — Google needs to access it)

### Step 5 — Submit for Verification

1. Go to: Google Cloud Console > APIs & Services > OAuth consent screen
2. Click **"Publish App"** (moves from Testing to In Production)
3. Google will prompt you to submit for verification
4. Provide:
   - The YouTube video link
   - Written justification for each scope
   - Your privacy policy URL
   - Your terms of service URL
5. Submit

### Step 6 — Respond to Google's Feedback

Google's trust and safety team will review your submission. Common feedback:

- **"Privacy policy doesn't mention Google data"** — Update your /privacy page with the specific items from Step 3
- **"Video doesn't show all scopes"** — Re-record showing each scope in use
- **"Scope not justified"** — Explain why you need each scope in your written justification
- **"Homepage doesn't match"** — Make sure your OAuth consent screen homepage URL matches your actual deployed site

**Timeline**: Sensitive scope verification typically takes 3-5 business days after submission, but can take longer if they request changes.

---

## Part 3: While You Wait — What You CAN Do

Even before verification completes, you can:

1. **Add up to 100 test users** in your OAuth consent screen settings. These users can go through the full OAuth flow and use your app normally.

2. **Beta test with real businesses** — Add 5-10 business owners as test users and get real feedback. This is actually ideal because:
   - You get real-world testing before public launch
   - Beta feedback helps you fix issues before they affect paying customers
   - You can collect testimonials for your marketing

3. **Set up your staging environment** — Deploy a separate Vercel project for staging with its own Supabase instance

4. **Prepare all marketing materials** — landing page copy, email sequences, content

---

## Part 4: After Approval

Once both approvals come through:

1. **Verify quotas**: Check that your GBP API quota is 300 QPM
2. **Test the full flow**: New signup → OAuth → reviews pulled → AI response → post to Google
3. **Remove the test user restriction**: Your app is now open to all Google users
4. **Monitor**: Watch for errors in your Google Cloud Console error reporting

---

## Common Gotchas

- **Don't request more scopes than you use** — Google will reject or delay apps that request unnecessary permissions
- **Your privacy policy must be on the SAME domain** as your app's homepage in the OAuth consent screen
- **The video must be Unlisted, not Private** — Google reviewers need to watch it
- **Use a business domain email** for all communications — Gmail addresses look less legitimate
- **Restricted scopes require annual re-verification** — Mark your calendar if you use any restricted scopes
- **If your GBP API application is denied**, you can reapply with a stronger use case. Make sure your website clearly shows you're a legitimate SaaS product.

---

## Quick Reference Links

- GBP API Access Form: https://support.google.com/business/contact/api_default
- OAuth Consent Screen: Google Cloud Console > APIs & Services > OAuth consent screen
- API Library: Google Cloud Console > APIs & Services > Library
- Quota Check: Google Cloud Console > APIs & Services > Quotas
