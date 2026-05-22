// scripts/generate-seo-pages.js
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, '../src/app/(app)/seo/seo-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const pagesDir = path.resolve(__dirname, '../src/app/(app)');

config.pages.forEach(page => {
  const slug = page.slug; // e.g., "resume-software-engineer-fresher"
  const pageDir = path.join(pagesDir, slug);
  if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
  const filePath = path.join(pageDir, 'page.tsx');
  const content = `import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: '${page.title}',
  description: '${page.description}',
  openGraph: {
    title: '${page.title}',
    description: '${page.description}',
    url: 'https://www.resumepilot.com/${slug}',
    images: [{ url: '/og/${slug}.png', alt: '${page.h1}' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '${page.title}',
    description: '${page.description}',
    images: ['/og/${slug}.png'],
  },
};

export default function ${page.h1.replace(/\s+/g, '')}Page() {
  const ctaUrl = '/ats-resume-checker?role=${slug}';
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">${page.h1}</h1>
      <p className="mb-4">${page.description}</p>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Tips for ${page.h1}</h2>
        <ul className="list-disc pl-5 space-y-1">
          ${page.tips.map(t => `<li>${t}</li>`).join('\n')}
        </ul>
      </section>
      ${page.mistakes && page.mistakes.length ? `
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Common Mistakes</h2>
        <ul className="list-disc pl-5 space-y-1">
          ${page.mistakes.map(m => `<li>${m}</li>`).join('\n')}
        </ul>
      </section>` : ''}
      <Link href={ctaUrl} className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
        Get My Free ATS Score
      </Link>
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Frequently Asked Questions</h2>
        ${page.faqs && page.faqs.length ? page.faqs.map((f, i) => `
        <details class="bg-gray-50 p-3 rounded mb-2" key={${i}}>
          <summary class="font-medium cursor-pointer">${f.q}</summary>
          <p>${f.a}</p>
        </details>`).join('\n') : ''}
      </section>
    </main>
  );
}
`;
  fs.writeFileSync(filePath, content.trimStart(), 'utf-8');
});

console.log('SEO pages generated successfully.');
