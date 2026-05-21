/**
 * Central plan configuration — single source of truth for all plan data.
 * Import from here instead of defining plan limits in multiple places.
 */

export const PLAN_LIMITS = {
  free: 3,
  starter: 15,
  pro: 50,
};

/** Razorpay pricing — amounts in paise (smallest currency unit) */
export const PLAN_PRICING = {
  starter: { amount: 49900, currency: 'INR', display: '₹499' },
  pro: { amount: 99900, currency: 'INR', display: '₹999' },
};

export const PLAN_FEATURES = {
  free: {
    resumeRewrite: true,
    atsScore: true,
    pdfExport: true,
    coverLetter: false,
    keywordAnalysis: false,
    interviewPrep: false,
    skillGap: false,
    allTones: false,
    priorityProcessing: false,
  },
  starter: {
    resumeRewrite: true,
    atsScore: true,
    pdfExport: true,
    coverLetter: true,
    keywordAnalysis: true,
    interviewPrep: false,
    skillGap: false,
    allTones: true,
    priorityProcessing: false,
  },
  pro: {
    resumeRewrite: true,
    atsScore: true,
    pdfExport: true,
    coverLetter: true,
    keywordAnalysis: true,
    interviewPrep: true,
    skillGap: true,
    allTones: true,
    priorityProcessing: true,
  },
};

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '/month',
    description: 'Get started with core resume optimization',
    features: [
      { text: '3 generations per month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: false },
      { text: 'JD keyword match analysis', included: false },
      { text: 'Interview prep questions', included: false },
      { text: 'Skill gap analysis', included: false },
    ],
    buttonText: 'Get Started Free',
    buttonClass: 'btn btn-secondary',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    period: '/month',
    description: 'Unlock deeper job-description intelligence',
    features: [
      { text: '15 generations per month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: true },
      { text: 'JD keyword match analysis', included: true },
      { text: 'Interview prep questions', included: false },
      { text: 'Skill gap analysis', included: false },
    ],
    buttonText: 'Upgrade to Starter',
    buttonClass: 'btn btn-primary',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    period: '/month',
    description: 'Complete job application intelligence suite',
    features: [
      { text: '50 generations per month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: true },
      { text: 'JD keyword match analysis', included: true },
      { text: 'Interview prep questions', included: true },
      { text: 'Skill gap analysis', included: true },
    ],
    buttonText: 'Upgrade to Pro',
    buttonClass: 'btn btn-primary',
    popular: false,
  },
];

/**
 * Returns the feature flags for a given plan.
 * Falls back to 'free' for unknown plan IDs.
 */
export function getPlanFeatures(planId) {
  return PLAN_FEATURES[planId] || PLAN_FEATURES.free;
}

/**
 * Returns the generation limit for a given plan.
 * Falls back to the free tier limit for unknown plan IDs.
 */
export function getPlanLimit(planId) {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
}
