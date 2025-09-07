import FilePageClient from './file-page-client';

export async function generateStaticParams() {
  return [];
}

export default function FilePage() {
  return <FilePageClient />;
}