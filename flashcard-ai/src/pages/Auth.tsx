export default function Auth() {
  return (
    <div className="space-y-8">
      <section className="saas-surface p-8 md:p-10">
        <p className="saas-kicker">Account</p>
        <h1 className="saas-title mt-3">Authentication</h1>
        <p className="saas-subtitle mt-3 max-w-2xl">
          Optional Firebase authentication will be connected here in a later milestone.
        </p>
      </section>

      <section className="saas-surface p-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Planned Features</h2>
        <p className="mt-2 text-sm text-slate-500">Security and account management modules prepared for future rollout.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="saas-surface-soft p-5">
            <p className="text-sm font-semibold text-slate-900">Email / Password Sign-In</p>
            <p className="mt-1 text-sm text-slate-500">Basic secure auth flow for personal accounts.</p>
          </article>

          <article className="saas-surface-soft p-5">
            <p className="text-sm font-semibold text-slate-900">Session Management</p>
            <p className="mt-1 text-sm text-slate-500">Keep users signed in and protect private data routes.</p>
          </article>
        </div>
      </section>
    </div>
  );
}