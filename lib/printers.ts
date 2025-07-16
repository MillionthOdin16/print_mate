export async function getPrinters() {
  const res = await fetch('/api/printers');
  return await res.json();
}

export async function addPrinter(printerData: {
  slug: string;
  name: string;
  model: string;
  ip: string;
  password: string;
  serial: string;
}) {
  const res = await fetch('/api/printers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(printerData)
  });
  return await res.json();
}

export async function removePrinter(slug: string) {
  const res = await fetch('/api/printers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug })
  });
  return await res.json();
}