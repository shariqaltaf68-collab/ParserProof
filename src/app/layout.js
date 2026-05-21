import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'ResumePilot — AI Resume & Cover Letter Builder',
  description:
    'Build ATS-optimized resumes, tailored cover letters, and interview prep in minutes. Upload your resume, paste any job description, and let AI match keywords, boost your ATS score, and generate polished documents ready to send.',
  keywords: [
    'ATS resume builder',
    'resume tailor',
    'cover letter generator',
    'resume keyword matcher',
    'AI resume optimization',
    'ATS score checker',
    'job application tools',
    'interview preparation',
  ],
  authors: [{ name: 'ResumePilot' }],
  creator: 'ResumePilot',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ResumePilot',
    title: 'ResumePilot — AI Resume & Cover Letter Builder',
    description:
      'Build ATS-optimized resumes, tailored cover letters, and interview prep in minutes. Let AI match keywords, boost your ATS score, and generate polished documents.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResumePilot — AI-Powered Resume Optimization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumePilot — AI Resume & Cover Letter Builder',
    description:
      'Build ATS-optimized resumes, tailored cover letters, and interview prep in minutes.',
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
