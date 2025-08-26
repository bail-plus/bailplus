// Utility functions for managing subscription intent across authentication flow

export interface SubscriptionIntent {
  action: 'subscribe';
  priceId: string;
  tier: 'starter';
  timestamp: number;
}

const INTENT_STORAGE_KEY = 'subscriptionIntent';
const CHECKOUT_PENDING_KEY = 'checkoutPending';
const INTENT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export function storeSubscriptionIntent(priceId: string, tier: 'starter') {
  const intent: SubscriptionIntent = {
    action: 'subscribe',
    priceId,
    tier,
    timestamp: Date.now()
  };
  
  localStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent));
  console.log('📝 Stored subscription intent:', intent);
}

export function getSubscriptionIntent(): SubscriptionIntent | null {
  try {
    const stored = localStorage.getItem(INTENT_STORAGE_KEY);
    if (!stored) return null;
    
    const intent: SubscriptionIntent = JSON.parse(stored);
    
    // Check if intent is still valid (not expired)
    if (Date.now() - intent.timestamp > INTENT_TIMEOUT) {
      console.log('⏰ Subscription intent expired, clearing...');
      clearSubscriptionIntent();
      return null;
    }
    
    return intent;
  } catch (error) {
    console.error('❌ Error reading subscription intent:', error);
    clearSubscriptionIntent();
    return null;
  }
}

export function clearSubscriptionIntent() {
  localStorage.removeItem(INTENT_STORAGE_KEY);
  sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
  console.log('🧹 Cleared subscription intent');
}

export function setCheckoutPending() {
  sessionStorage.setItem(CHECKOUT_PENDING_KEY, '1');
}

export function isCheckoutPending(): boolean {
  return sessionStorage.getItem(CHECKOUT_PENDING_KEY) === '1';
}

export function clearCheckoutPending() {
  sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
}

// Get intent from URL params (fallback method)
export function getIntentFromParams(searchParams: URLSearchParams): SubscriptionIntent | null {
  const intent = searchParams.get('intent');
  const priceId = searchParams.get('priceId');
  const tier = searchParams.get('tier') as 'starter';
  
  if (intent === 'subscribe' && priceId && tier) {
    return {
      action: 'subscribe',
      priceId,
      tier,
      timestamp: Date.now()
    };
  }
  
  return null;
}