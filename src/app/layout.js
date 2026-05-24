import './globals.css';
import { Inter, Lora, Outfit, Raleway } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-lora',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-outfit',
});

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-raleway',
});

export const metadata = {
  title: 'ParserProof — ATS Resume Checker & Optimization Platform',
  description:
    'Increase your job interview response rate. Scan your resume against target job description filters, analyze keyword gaps, fix parsing formatting blocks, and optimize your experience bullet points with quantifiable outcomes.',
  keywords: [
    'ATS resume checker',
    'resume keyword optimizer',
    'fresher resume format',
    'resume match score analysis',
    'ATS compatibility checker',
    'job application keyword gap tool',
    'off-campus placement prep',
    'all-india recruiter standard',
  ],
  authors: [{ name: 'ParserProof' }],
  creator: 'ParserProof',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ParserProof',
    title: 'ParserProof — ATS Resume Checker & Optimization Platform',
    description:
      'Increase your job interview response rate. Scan your resume against target job description filters, analyze keyword gaps, and optimize experience descriptions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ParserProof — ATS Resume Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ParserProof — ATS Resume Checker & Optimization Platform',
    description:
      'Increase your job interview response rate. Scan your resume against target filters and optimize your content.',
    images: ['/og-image.png'],
    creator: '@parserproof',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'VDWytLJpLm4cDcGHHuiT9tQlJrfLahoSiT26Qu6zj2c',
  },
  other: {
    google: 'notranslate',
  },
};

import Providers from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} ${outfit.variable} ${raleway.variable} notranslate`} translate="no">
      <body className={`${inter.className} notranslate`} translate="no">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
