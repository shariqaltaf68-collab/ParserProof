import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'ResumePilot — ATS Resume Checker & Optimization Platform',
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
  ],
  authors: [{ name: 'ResumePilot' }],
  creator: 'ResumePilot',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ResumePilot',
    title: 'ResumePilot — ATS Resume Checker & Optimization Platform',
    description:
      'Increase your job interview response rate. Scan your resume against target job description filters, analyze keyword gaps, and optimize experience descriptions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResumePilot — ATS Resume Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumePilot — ATS Resume Checker & Optimization Platform',
    description:
      'Increase your job interview response rate. Scan your resume against target filters and optimize your content.',
    images: ['/og-image.png'],
    creator: '@resumepilot',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
