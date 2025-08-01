import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function SubscriptionCheckoutDebug() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  
  const clientSecret = searchParams.get('clientSecret');
  const planName = searchParams.get('planName');
  const paymentMethod = searchParams.get('paymentMethod') || 'monthly';
  const amount = parseInt(searchParams.get('amount') || '0');

  console.log('🐛 Debug - URL params:', { clientSecret: !!clientSecret, planName, paymentMethod, amount });
  console.log('🐛 Debug - Location:', location);

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Subscription Checkout</h1>
      <div className="space-y-2">
        <p><strong>Client Secret:</strong> {clientSecret ? 'Present' : 'Missing'}</p>
        <p><strong>Plan Name:</strong> {planName || 'Missing'}</p>
        <p><strong>Payment Method:</strong> {paymentMethod}</p>
        <p><strong>Amount:</strong> {amount}</p>
        <p><strong>Full Location:</strong> {location}</p>
      </div>
      <button 
        onClick={() => setLocation('/subscription-plans')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Back to Plans
      </button>
    </div>
  );
}