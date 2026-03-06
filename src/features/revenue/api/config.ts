/**
 * API Configuration
 *
 * Revenue MF talks to TWO backend services:
 * - revenue (port 3106): batches, revenue data, coverage, commissions
 * - report-management (port 3107): brands, runs, gaps, manual entries
 *
 * In development: Use Vite proxy (/{svc}-api pattern via @hnc-partners/vite-config)
 * In production: Use full URLs (configured via env vars)
 */

const isDev = import.meta.env.DEV;

/** Revenue API base URL — F30 (imports) + F21 (commissions) endpoints */
export const REVENUE_API_URL = isDev
  ? '/revenue-api'
  : (import.meta.env.VITE_REVENUE_API_URL || 'https://hncms-revenue.scarif-0.duckdns.org');

/** Report Management API base URL — F54 (statements) endpoints */
export const REPORT_MANAGEMENT_API_URL = isDev
  ? '/report-management-api'
  : (import.meta.env.VITE_REPORT_MANAGEMENT_API_URL || 'https://hncms-report-management.scarif-0.duckdns.org');
