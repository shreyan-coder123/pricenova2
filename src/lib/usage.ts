'use client';

const USAGE_KEY = 'pricenova_usage_v1';
const PRO_TOKEN_KEY = 'pricenova_pro_token';
const MAX_FREE_SEARCHES = 5;

export function getSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  const count = localStorage.getItem(USAGE_KEY);
  return count ? parseInt(count, 10) : 0;
}

export function incrementSearchCount(): number {
  if (typeof window === 'undefined') return 0;
  const current = getSearchCount();
  const next = current + 1;
  localStorage.setItem(USAGE_KEY, next.toString());
  return next;
}

export function isPro(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(PRO_TOKEN_KEY);
  // In a real app, verify token with a backend service
  return !!token;
}

export function setProStatus(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PRO_TOKEN_KEY, token);
}

export function clearProStatus() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PRO_TOKEN_KEY);
}

export function canSearch(): boolean {
  if (isPro()) return true;
  return getSearchCount() < MAX_FREE_SEARCHES;
}

export function getRemainingSearches(): number {
  if (isPro()) return Infinity;
  return Math.max(0, MAX_FREE_SEARCHES - getSearchCount());
}
