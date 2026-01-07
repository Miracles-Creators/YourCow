import { redirect } from 'next/navigation';

/**
 * Root page - redirects to default locale
 * Users will always be redirected to /es or /en
 */
export default function RootPage() {
  redirect('/es');
}
