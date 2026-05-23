import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculateProgrammaticAtsScore } from '@/lib/ai';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { actions } = body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json({ error: 'No edit actions provided.' }, { status: 400 });
    }

    // 1. Fetch the active project
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    let updatedResumeText = project.resumeText;
    let keywordMatch = { matched: [], missing: [] };
    try {
      if (project.keywordMatch) {
        keywordMatch = JSON.parse(project.keywordMatch);
      }
    } catch (e) {
      console.error('Error parsing project keywordMatch:', e);
    }

    // Process actions
    for (const action of actions) {
      if (action.type === 'APPEND_SKILLS' && Array.isArray(action.skills)) {
        const skillsText = action.skills.join(', ');
        const newlyAdded = action.skills.map(s => s.toLowerCase().trim());
        
        // Smart keyword matcher: if the newly added skill matches one of our missing keywords,
        // we move it from 'missing' to 'matched'!
        const missing = keywordMatch.missing || [];
        const matched = keywordMatch.matched || [];
        const stillMissing = [];
        
        for (const item of missing) {
          if (newlyAdded.some(skill => skill.includes(item.toLowerCase().trim()) || item.toLowerCase().trim().includes(skill))) {
            if (!matched.includes(item)) {
              matched.push(item);
            }
          } else {
            stillMissing.push(item);
          }
        }
        keywordMatch.missing = stillMissing;
        keywordMatch.matched = matched;

        // Try to insert skills in a clean Skills section
        const skillsHeaders = [
          /(Technical\s+Skills|Professional\s+Skills|Skills\s+&\s+Tools|Core\s+Competencies|Skills|Expertise)\s*:/i,
          /(Technical\s+Skills|Professional\s+Skills|Skills\s+&\s+Tools|Core\s+Competencies|Skills|Expertise)\s*\n/i
        ];
        
        let foundHeader = false;
        for (const rx of skillsHeaders) {
          if (rx.test(updatedResumeText)) {
            updatedResumeText = updatedResumeText.replace(rx, (match) => {
              foundHeader = true;
              if (match.endsWith('\n')) {
                return `${match}${skillsText}, \n`;
              }
              return `${match} ${skillsText}, `;
            });
            break;
          }
        }

        if (!foundHeader) {
          updatedResumeText = `${updatedResumeText}\n\nTechnical Skills: ${skillsText}`;
        }

      } else if (action.type === 'REPLACE_TEXT' && action.target && action.replacement) {
        const targetClean = action.target.trim();
        const replacementClean = action.replacement.trim();
        
        if (updatedResumeText.includes(targetClean)) {
          updatedResumeText = updatedResumeText.replaceAll(targetClean, replacementClean);
        } else {
          // If strict match fails, try normalized whitespace lines
          const normTarget = targetClean.replace(/\s+/g, ' ');
          const lines = updatedResumeText.split('\n');
          let matchedLineIdx = -1;
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].replace(/\s+/g, ' ').includes(normTarget)) {
              matchedLineIdx = i;
              break;
            }
          }
          
          if (matchedLineIdx !== -1) {
            lines[matchedLineIdx] = lines[matchedLineIdx].replace(lines[matchedLineIdx], replacementClean);
            updatedResumeText = lines.join('\n');
          } else {
            console.warn(`[Edit Route] Target text for replacement not found in resume: "${targetClean}"`);
          }
        }
      }
    }

    // 2. Recalculate programmatic ATS score (with a semantic baseline of 75)
    const freshAtsScore = calculateProgrammaticAtsScore(
      updatedResumeText,
      keywordMatch,
      project.ragConfidence || 75
    );

    // 3. Save the updated project to the database
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        resumeText: updatedResumeText,
        atsScore: freshAtsScore,
        keywordMatch: JSON.stringify(keywordMatch),
      },
    });

    // 4. Log the edit audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'resume_ai_edit',
        details: JSON.stringify({
          projectId: id,
          actionsCount: actions.length,
          previousScore: project.atsScore,
          newScore: freshAtsScore,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: updatedProject.id,
        resumeText: updatedProject.resumeText,
        atsScore: updatedProject.atsScore,
        keywordMatch: updatedProject.keywordMatch,
      },
    });
  } catch (error) {
    console.error('[Edit API Route] POST error:', error);
    return NextResponse.json({ error: 'Failed to process resume edit action.' }, { status: 500 });
  }
}
