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
  AlertTriangle,
} from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: [
      { text: '3 optimizations / month', included: true },
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
    price: '₹199',
    period: '/month',
    popular: true,
    features: [
      { text: '15 optimizations / month', included: true },
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
    price: '₹399',
    period: '/month',
    features: [
      { text: '25 optimizations / month', included: true },
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

const PLAN_LIMITS = { free: 3, starter: 15, pro: 25 };

export default function BillingPage() {
  const { data: session, update: updateSession } = useSession();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Refund request state
  const [refundTimeRemaining, setRefundTimeRemaining] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancellingPlan, setCancellingPlan] = useState(false);

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

  useEffect(() => {
    if (!user?.lastUpgradeAt || user?.plan === 'free') {
      setRefundTimeRemaining(0);
      return;
    }
    const upgradeTime = new Date(user.lastUpgradeAt).getTime();
    
    // Set initial value
    const initialElapsed = Date.now() - upgradeTime;
    const initialRemaining = Math.max(0, 60 * 60 * 1000 - initialElapsed);
    setRefundTimeRemaining(initialRemaining);

    if (initialRemaining <= 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - upgradeTime;
      const remaining = Math.max(0, 60 * 60 * 1000 - elapsed);
      setRefundTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.lastUpgradeAt, user?.plan]);

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
  const isRefundableActive = refundTimeRemaining > 0 && (user?.generationsSinceUpgrade || 0) <= 2;

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

  const handleRefundRequest = async () => {
    if (!cancelReason) {
      showToast('Please select a cancellation reason.', 'error');
      return;
    }
    
    const reasonText = cancelReason === 'other' ? `Other: ${customReason}` : cancelReason;
    setCancellingPlan(true);

    try {
      const res = await fetch('/api/payments/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reasonText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit refund request.');
      }

      const data = await res.json();
      
      // Update session and local user state
      await updateSession();
      setUser((prev) => ({ ...prev, plan: 'free', lastUpgradeAt: null }));
      setShowCancelModal(false);
      showToast(data.message || 'Plan cancelled and refund requested successfully!', 'success');
    } catch (err) {
      console.error('Cancel error:', err);
      showToast(err.message || 'Failed to process refund request.', 'error');
    } finally {
      setCancellingPlan(false);
    }
  };

  const formatTime = (ms) => {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
};

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
      <div className="billing-current" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div className="billing-plan-name" style={{ textTransform: 'capitalize' }}>
            {currentPlan}
          </div>
          <div className="billing-plan-meta">Member since {memberSince}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
            {currentPlan}
          </span>
          {currentPlan !== 'free' && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-danger btn-sm"
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                padding: 'var(--space-2) var(--space-4)',
                background: 'hsl(0, 75%, 45%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {isRefundableActive ? 'Cancel & Claim Refund' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      {refundTimeRemaining > 0 && (
        isRefundableActive ? (
          <div
            style={{
              margin: 'var(--space-4) 0',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} />
              <span>
                <strong>1-Hour Refund Window Active!</strong> Cancel within 1 hour for a full refund (used {user?.generationsSinceUpgrade || 0}/2 generations).
              </span>
            </div>
            <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>
              {formatTime(refundTimeRemaining)} remaining
            </div>
          </div>
        ) : (
          <div
            style={{
              margin: 'var(--space-4) 0',
              padding: 'var(--space-3) var(--space-4)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-warning)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} />
              <span>
                <strong>Refund Limit Exceeded:</strong> You optimized {user?.generationsSinceUpgrade || 0} resumes since upgrading (max limit is 2 for refund eligibility). Downgrade is available without a refund.
              </span>
            </div>
            <div style={{ fontWeight: '700', fontFamily: 'monospace' }}>
              {formatTime(refundTimeRemaining)} window active
            </div>
          </div>
        )
      )}

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
      {/* Cancellation Reason & Refund Request Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="modal-title">
                {isRefundableActive ? 'Cancel Subscription & Refund' : 'Cancel Subscription'}
              </div>
              <button
                className="modal-close"
                onClick={() => setShowCancelModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
              {isRefundableActive ? (
                `We're sorry to see you go. Since you have generated only ${user?.generationsSinceUpgrade || 0} resume(s) and are within the 1-hour window, canceling now will instantly downgrade you to the Free plan and request a full refund via Razorpay.`
              ) : refundTimeRemaining > 0 ? (
                `We're sorry to see you go. Canceling your plan will downgrade your account to the Free tier. Note: Because you have generated ${user?.generationsSinceUpgrade || 0} resumes (limit is 2 for refund eligibility), this cancellation does not qualify for a refund.`
              ) : (
                "We're sorry to see you go. Canceling your plan will downgrade your account to the Free tier. Note: Because the 1-hour refund window has expired, this cancellation does not qualify for a refund."
              )}
            </p>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '700', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isRefundableActive ? 'Why are you requesting a refund?' : 'Why are you cancelling your subscription?'}
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="form-select"
                style={{
                  width: '100%',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm)',
                  height: '42px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">-- Select a reason --</option>
                <option value="No accuracy / ATS score was low">Low accuracy / low ATS score match</option>
                <option value="AI predictions were not realistic">AI generated fake details / predictions</option>
                <option value="Fonts, margins, or alignments were not up to the mark">Bad template alignment, fonts or margins</option>
                <option value="Features did not meet my expectations">Features did not meet expectations</option>
                <option value="other">Other reason (explain below)</option>
              </select>
            </div>

            {cancelReason === 'other' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', fontWeight: '700', marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
                  Provide details:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="form-input"
                  rows={3}
                  placeholder="Tell us what we can improve..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancellingPlan}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRefundRequest}
                disabled={cancellingPlan || !cancelReason || (cancelReason === 'other' && !customReason.trim())}
                style={{
                  background: 'hsl(0, 75%, 45%)',
                  borderColor: 'hsl(0, 75%, 40%)',
                }}
              >
                {cancellingPlan ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Cancelling...
                  </>
                ) : (
                  isRefundableActive ? 'Confirm Cancel & Refund' : 'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
