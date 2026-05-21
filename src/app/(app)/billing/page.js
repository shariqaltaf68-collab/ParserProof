'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Script from 'next/script';
import {
  Check,
  X,
  Loader2,
  Crown,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      { text: '3 resume generations / month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: false },
      { text: 'JD keyword match analysis', included: false },
      { text: 'Interview prep questions', included: false },
      { text: 'Skill gap analysis', included: false },
    ],
    icon: Sparkles,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹499',
    period: '/month',
    popular: true,
    features: [
      { text: '15 resume generations / month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: true },
      { text: 'JD keyword match analysis', included: true },
      { text: 'Interview prep questions', included: false },
      { text: 'Skill gap analysis', included: false },
    ],
    icon: Zap,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹999',
    period: '/month',
    features: [
      { text: '50 resume generations / month', included: true },
      { text: 'ATS-optimized resume rewrite', included: true },
      { text: 'ATS compatibility score', included: true },
      { text: 'PDF & TXT export', included: true },
      { text: 'Tailored cover letter', included: true },
      { text: 'JD keyword match analysis', included: true },
      { text: 'Interview prep questions', included: true },
      { text: 'Skill gap analysis', included: true },
    ],
    icon: Crown,
  },
];

const PLAN_LIMITS = { free: 3, starter: 15, pro: 50 };

export default function BillingPage() {
  const { data: session, update: updateSession } = useSession();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        }
      } catch {
        // Loading state will persist briefly then show fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  }, []);

  async function handlePlanAction(planId) {
    if (planId === (user?.plan || 'free')) return;
    if (planId === 'free') {
      showToast('To downgrade to Free, please contact guys4929@gmail.com');
      return;
    }

    if (!razorpayLoaded || typeof window.Razorpay === 'undefined') {
      showToast('Payment system is loading. Please wait a moment and try again.', 'error');
      return;
    }

    setPaymentLoading(planId);

    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ResumePilot',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - Monthly`,
        order_id: orderData.orderId,
        prefill: {
          email: session?.user?.email || user?.email || '',
          name: session?.user?.name || user?.name || '',
        },
        theme: {
          color: '#6366f1',
          backdrop_color: 'rgba(0, 0, 0, 0.7)',
        },
        handler: async function (response) {
          // Step 3: Verify payment on server
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || 'Verification failed');
            }

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Step 4: Refresh session to update plan in JWT
              await updateSession();

              // Update local state
              setUser((prev) => ({ ...prev, plan: planId }));

              showToast(
                `🎉 Welcome to ${planId.charAt(0).toUpperCase() + planId.slice(1)}! Your plan has been upgraded successfully.`,
                'success'
              );
            }
          } catch (err) {
            console.error('Verification error:', err);
            showToast(
              'Payment was received but verification failed. Please contact guys4929@gmail.com',
              'error'
            );
          } finally {
            setPaymentLoading(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(null);
          },
          confirm_close: true,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        showToast(
          response.error?.description || 'Payment failed. Please try again.',
          'error'
        );
        setPaymentLoading(null);
      });

      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
      setPaymentLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="loader-page">
          <div className="loader-spinner">
            <Loader2 size={32} />
          </div>
          <p className="loader-page-text">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const currentPlan = user?.plan || 'free';
  const usageCount = user?.usageCount || 0;
  const limit = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.free;
  const usagePercent = Math.min((usageCount / limit) * 100, 100);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  function getPlanButtonProps(planId) {
    if (planId === currentPlan) {
      return { label: 'Current Plan', className: 'btn btn-secondary', disabled: true };
    }
    const planOrder = { free: 0, starter: 1, pro: 2 };
    const isDowngrade = (planOrder[planId] || 0) < (planOrder[currentPlan] || 0);
    if (isDowngrade) {
      return { label: 'Downgrade', className: 'btn btn-secondary', disabled: false };
    }
    return { label: 'Upgrade', className: 'btn btn-primary', disabled: false };
  }

  return (
    <div className="page-content">
      {/* Load Razorpay checkout script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        strategy="lazyOnload"
      />

      <h1 style={{ marginBottom: 'var(--space-8)' }}>Billing</h1>

      {/* Current Plan */}
      <div className="billing-current">
        <div>
          <div className="billing-plan-name" style={{ textTransform: 'capitalize' }}>
            {currentPlan}
          </div>
          <div className="billing-plan-meta">Member since {memberSince}</div>
        </div>
        <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
          {currentPlan}
        </span>
      </div>

      {/* Usage This Month */}
      <div className="usage-meter">
        <div className="usage-meter-header">
          <span className="usage-meter-label">Usage This Month</span>
          <span className="usage-meter-count">
            <strong>{usageCount}</strong> / {limit} generations
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      {/* Available Plans */}
      <h2
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          marginBottom: 'var(--space-6)',
        }}
      >
        Available Plans
      </h2>
      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const btnProps = getPlanButtonProps(plan.id);
          const PlanIcon = plan.icon;
          const isUpgrading = paymentLoading === plan.id;
          return (
            <div
              key={plan.id}
              className={`pricing-card${plan.popular ? ' popular' : ''}`}
            >
              {plan.popular && (
                <div className="pricing-popular-badge">Most Popular</div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <PlanIcon size={20} />
                <span className="pricing-name">{plan.name}</span>
              </div>

              <div className="pricing-price">
                <span className="pricing-amount">{plan.price}</span>
                {plan.period && (
                  <span className="pricing-period">{plan.period}</span>
                )}
              </div>

              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li
                    key={feature.text}
                    className={`pricing-feature${
                      !feature.included ? ' pricing-feature-disabled' : ''
                    }`}
                  >
                    <span className="pricing-feature-icon">
                      {feature.included ? (
                        <Check size={16} />
                      ) : (
                        <X size={16} />
                      )}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={btnProps.className}
                disabled={btnProps.disabled || isUpgrading || (paymentLoading && !isUpgrading)}
                onClick={() => handlePlanAction(plan.id)}
                id={`billing-plan-${plan.id}`}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Processing...
                  </>
                ) : (
                  btnProps.label
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-8)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'hsl(var(--hue-primary) 20% 13%)',
          border: '1px solid hsl(var(--hue-primary) 20% 20%)',
        }}
      >
        <ShieldCheck size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Payments secured by <strong style={{ color: 'var(--color-text-primary)' }}>Razorpay</strong>. 
          We never store your card details.
        </span>
        <CreditCard size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div
            className={`toast ${
              toast.type === 'success'
                ? 'toast-success'
                : toast.type === 'error'
                ? 'toast-error'
                : 'toast-info'
            }`}
          >
            {toast.type === 'success' ? (
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            ) : toast.type === 'error' ? (
              <X size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            ) : (
              <Sparkles
                size={18}
                style={{ color: 'var(--color-accent)', flexShrink: 0 }}
              />
            )}
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              className="toast-dismiss"
              onClick={() => setToast(null)}
              id="billing-toast-dismiss"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
