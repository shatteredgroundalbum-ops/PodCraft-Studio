import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import {
  CreditCardIcon,
  CrownIcon,
  CheckIcon,
  DownloadIcon,
  CalendarIcon,
  AlertTriangleIcon,
  PlusIcon,
  TrashIcon,
  ChevronRightIcon } from
'lucide-react';
type Plan = 'Free' | 'Pro' | 'Studio' | 'Enterprise';
const planDetails: Record<
  Plan,
  {
    price: string;
    description: string;
    features: string[];
  }> =
{
  Free: {
    price: '$0',
    description: 'For getting started.',
    features: [
    '1 project',
    'Up to 5 episodes',
    'Basic mastering',
    '2 GB storage']

  },
  Pro: {
    price: '$19',
    description: 'For solo creators.',
    features: [
    'Unlimited projects',
    'Unlimited episodes',
    'Advanced mastering',
    '100 GB storage',
    'AI Producer']

  },
  Studio: {
    price: '$49',
    description: 'For teams and studios.',
    features: [
    'Everything in Pro',
    'Team collaboration',
    'Multi-track recording',
    '1 TB storage',
    'Priority support']

  },
  Enterprise: {
    price: 'Custom',
    description: 'For large organizations.',
    features: [
    'Everything in Studio',
    'Custom integrations',
    'Dedicated success manager',
    'Unlimited storage',
    'SSO & advanced permissions']

  }
};
export function SettingsBilling() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('Pro');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([
  {
    id: 1,
    brand: 'Visa',
    last4: '4242',
    expiry: '08/27',
    isDefault: true
  }]
  );
  const invoices = [
  {
    id: 'INV-2026-005',
    date: 'May 1, 2026',
    amount: '$19.00',
    status: 'Paid'
  },
  {
    id: 'INV-2026-004',
    date: 'Apr 1, 2026',
    amount: '$19.00',
    status: 'Paid'
  },
  {
    id: 'INV-2026-003',
    date: 'Mar 1, 2026',
    amount: '$19.00',
    status: 'Paid'
  },
  {
    id: 'INV-2026-002',
    date: 'Feb 1, 2026',
    amount: '$19.00',
    status: 'Paid'
  }];

  const history = [
  {
    date: 'Jan 12, 2026',
    event: 'Upgraded from Free to Pro'
  },
  {
    date: 'Jan 12, 2026',
    event: 'Free plan activated'
  }];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Billing & Subscriptions
        </h1>
        <p className="text-sm text-gray-500">
          Manage your plan, payment methods, and billing history.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Current Plan */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Current Plan</h2>
                <p className="text-sm text-gray-500">
                  Your active subscription and renewal information.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold">
                <CrownIcon className="w-3 h-3" /> {currentPlan}
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-violet-700 font-medium uppercase tracking-wider mb-1">
                    {planDetails[currentPlan].description}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {planDetails[currentPlan].price}
                    <span className="text-sm text-gray-500 font-normal">
                      {currentPlan === 'Enterprise' ? '' : ' / month'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" /> Renews on June 1, 2026
                  </p>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {planDetails[currentPlan].features.map((f) =>
                  <li key={f} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Plan Management */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-1">Plan Management</h2>
            <p className="text-sm text-gray-500 mb-5">
              Upgrade or downgrade your plan at any time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(planDetails) as Plan[]).map((plan) => {
                const isCurrent = plan === currentPlan;
                return (
                  <div
                    key={plan}
                    className={`rounded-xl border p-4 ${isCurrent ? 'border-violet-600 bg-violet-50/50 ring-1 ring-violet-600' : 'border-gray-200 bg-white'}`}>
                    
                    <h3 className="font-bold text-gray-900 mb-1">{plan}</h3>
                    <p className="text-lg font-bold text-gray-900 mb-3">
                      {planDetails[plan].price}
                      <span className="text-xs text-gray-500 font-normal">
                        {plan === 'Enterprise' ? '' : '/mo'}
                      </span>
                    </p>
                    <button
                      onClick={() => !isCurrent && setCurrentPlan(plan)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
                      
                      {isCurrent ? 'Current Plan' : 'Switch to ' + plan}
                    </button>
                  </div>);

              })}
            </div>
          </section>

          {/* Billing Information */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-1">
              Billing Information
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              The address used on your invoices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Billing name
                </label>
                <input
                  type="text"
                  defaultValue="Studio Creator"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Billing email
                </label>
                <input
                  type="email"
                  defaultValue="billing@podify.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <input
                  type="text"
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Country"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                Save changes
              </button>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Payment Methods
                </h2>
                <p className="text-sm text-gray-500">
                  Manage the cards used to pay for your subscription.
                </p>
              </div>
              <button
                onClick={() =>
                setPaymentMethods((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  brand: 'Card',
                  last4: '0000',
                  expiry: '01/30',
                  isDefault: false
                }]
                )
                }
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50">
                
                <PlusIcon className="w-4 h-4" /> Add Method
              </button>
            </div>
            <div className="space-y-2">
              {paymentMethods.map((pm) =>
              <div
                key={pm.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <CreditCardIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {pm.brand} •••• {pm.last4}
                        {pm.isDefault &&
                      <span className="ml-2 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                            Default
                          </span>
                      }
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {pm.expiry}
                      </p>
                    </div>
                  </div>
                  <button
                  onClick={() =>
                  setPaymentMethods((prev) =>
                  prev.filter((p) => p.id !== pm.id)
                  )
                  }
                  className="text-gray-400 hover:text-red-600 p-1">
                  
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              {paymentMethods.length === 0 &&
              <p className="text-sm text-gray-500 text-center py-6">
                  No payment methods on file.
                </p>
              }
            </div>
          </section>

          {/* Invoices */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-1">Invoices</h2>
            <p className="text-sm text-gray-500 mb-5">
              Download invoices for your records.
            </p>
            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
              {invoices.map((inv) =>
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3">
                
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {inv.id}
                    </p>
                    <p className="text-xs text-gray-500">{inv.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {inv.amount}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {inv.status}
                    </span>
                    <button className="text-gray-400 hover:text-violet-600 p-1">
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Subscription History & Renewal */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 mb-1">
                Renewal Information
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Your subscription renews automatically.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Next renewal</span>
                  <span className="font-semibold text-gray-900">
                    June 1, 2026
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900">$19.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Billing cycle</span>
                  <span className="font-semibold text-gray-900">Monthly</span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold text-gray-900 mb-1">
                Subscription History
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                A log of changes to your plan.
              </p>
              <ul className="space-y-3">
                {history.map((h, i) =>
                <li key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-gray-900 font-medium">{h.event}</p>
                      <p className="text-xs text-gray-500">{h.date}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* Cancellation */}
          <section className="bg-red-50/50 border border-red-100 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-red-700 mb-1">
                    Cancel Subscription
                  </h2>
                  <p className="text-sm text-red-600/80">
                    Cancel your subscription. You'll keep access until the end
                    of the current billing period.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 whitespace-nowrap">
                
                Cancel Plan
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Cancel your subscription?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              You'll keep access to {currentPlan} features until June 1, 2026.
              After that, your account will downgrade to the Free plan.
            </p>
            <div className="flex justify-end gap-3">
              <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              
                Keep my plan
              </button>
              <button
              onClick={() => {
                setShowCancelModal(false);
                setCurrentPlan('Free');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
              
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      }
    </AppLayout>);

}