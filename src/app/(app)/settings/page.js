'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Save, Lock, Trash2, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setName(data.name || '');
          setEmail(data.email || '');
        }
      } catch {
        // User data will remain empty, form shows blank
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleProfileSave(e) {
    e.preventDefault();
    setIsSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
        setUser((prev) => ({ ...prev, name, email }));
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile.' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ redirect: false });
        router.push('/');
      }
    } catch {
      setIsDeletingAccount(false);
      setShowDeleteAccount(false);
    }
  }

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="loader-page">
          <div className="loader-spinner">
            <Loader2 size={32} />
          </div>
          <p className="loader-page-text">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: 'var(--space-8)' }}>Settings</h1>

      {/* Profile Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Profile</h2>
        <p className="settings-section-subtitle">Manage your personal information</p>

        <form className="settings-form" onSubmit={handleProfileSave}>
          <div className="form-group">
            <label htmlFor="settings-name" className="form-label">Name</label>
            <input
              id="settings-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="settings-email" className="form-label">Email</label>
            <input
              id="settings-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          {profileMessage && (
            <div
              className={profileMessage.type === 'success' ? 'form-hint' : 'form-error'}
              style={profileMessage.type === 'success' ? { color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } : { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              {profileMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {profileMessage.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
              id="settings-save-profile"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="loader-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Change Password</h2>
        <p className="settings-section-subtitle">Update your password</p>

        <form className="settings-form" onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="settings-current-password" className="form-label">Current Password</label>
            <input
              id="settings-current-password"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="settings-new-password" className="form-label">New Password</label>
            <input
              id="settings-new-password"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <span className="form-hint">
              Must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.
            </span>
          </div>

          {passwordMessage && (
            <div
              className={passwordMessage.type === 'success' ? 'form-hint' : 'form-error'}
              style={passwordMessage.type === 'success' ? { color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } : { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              {passwordMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {passwordMessage.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChangingPassword}
              id="settings-update-password"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={16} className="loader-spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="settings-section">
        <h2 className="settings-section-title">Danger Zone</h2>
        <p className="settings-section-subtitle">Irreversible actions</p>

        <div className="settings-danger">
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Delete Account
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Permanently delete your account and all your data. This action cannot be undone.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteAccount(true)}
            id="settings-delete-account"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="modal-overlay" onClick={() => !isDeletingAccount && setShowDeleteAccount(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="modal-header">
              <h2 className="modal-title" id="delete-account-title">Delete your account?</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteAccount(false)}
                disabled={isDeletingAccount}
                id="delete-account-modal-close"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              This will permanently delete your account, all projects, and all data associated with it. This action cannot be reversed.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteAccount(false)}
                disabled={isDeletingAccount}
                id="delete-account-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                id="delete-account-confirm"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 size={16} className="loader-spinner" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
