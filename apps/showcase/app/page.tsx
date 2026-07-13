import { redirect } from 'next/navigation';
import { locales } from '@/i18n/request';

export default function RootPage() {
  redirect(`/${locales[0]}`);
}
