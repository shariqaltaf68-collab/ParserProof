import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'text/plain'];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to upload files.' },
        { status: 401 }
      );
    }

    const rateLimitResult = rateLimit(session.user.id, 30, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file was provided.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or TXT file.' },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 413 }
      );
    }

    let text = '';

    if (file.type === 'text/plain') {
      text = await file.text();
    } else if (file.type === 'application/pdf') {
      // For PDF files, we try to use the fileParser utility
      try {
        const { parseResume } = await import('@/lib/fileParser');
        const buffer = Buffer.from(await file.arrayBuffer());
        const parseResult = await parseResume(buffer, file.type);
        if (parseResult.error) {
          return NextResponse.json(
            { error: parseResult.error },
            { status: 422 }
          );
        }
        text = parseResult.text;
      } catch (parseError) {
        console.error('PDF parsing error:', parseError);
        return NextResponse.json(
          {
            error:
              'Could not extract text from the PDF. Please try pasting your resume text directly.',
          },
          { status: 422 }
        );
      }
    }

    // Basic validation — make sure we got meaningful content
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 50) {
      return NextResponse.json(
        {
          error:
            'Could not extract enough text from the file. Please try pasting your resume text directly.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        text: trimmed,
        filename: file.name,
        size: file.size,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload.' },
      { status: 500 }
    );
  }
}
