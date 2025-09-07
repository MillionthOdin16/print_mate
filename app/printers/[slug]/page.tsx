import PrinterPageClient from './printer-page-client';

export async function generateStaticParams() {
  return [];
}

interface PrinterPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function PrinterPage(props: PrinterPageProps) {
  return <PrinterPageClient {...props} />;
}