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
    let updatedImprovedResume = project.improvedResume || '';
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
        
        // 1. Update resumeText
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

        // 2. Update improvedResume
        let foundHeaderImp = false;
        for (const rx of skillsHeaders) {
          if (rx.test(updatedImprovedResume)) {
            updatedImprovedResume = updatedImprovedResume.replace(rx, (match) => {
              foundHeaderImp = true;
              if (match.endsWith('\n')) {
                return `${match}${skillsText}, \n`;
              }
              return `${match} ${skillsText}, `;
            });
            break;
          }
        }

        if (!foundHeaderImp && updatedImprovedResume) {
          updatedImprovedResume = `${updatedImprovedResume}\n\nTechnical Skills: ${skillsText}`;
        }

      } else if (action.type === 'REPLACE_SKILLS' && Array.isArray(action.skills)) {
        const newlyAdded = action.skills.map(s => s.toLowerCase().trim());
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

        // 1. Update resumeText (plain text)
        let replacedRaw = false;
        const rawHeaders = [
          /(Technical\s+Skills|Professional\s+Skills|Skills\s+&\s+Tools|Core\s+Competencies|Skills|Expertise)\s*:\s*/i,
          /(Technical\s+Skills|Professional\s+Skills|Skills\s+&\s+Tools|Core\s+Competencies|Skills|Expertise)\s*\n/i
        ];
        
        for (const rx of rawHeaders) {
          if (rx.test(updatedResumeText)) {
            const match = updatedResumeText.match(rx);
            const headerText = match[0];
            const headerIdx = updatedResumeText.indexOf(headerText);
            
            const afterHeader = updatedResumeText.substring(headerIdx + headerText.length);
            const nextSectionMatch = afterHeader.match(/\n\n[A-Z]/);
            
            const skillsText = action.skills.join(', ');
            
            if (nextSectionMatch) {
              const nextSectionIdx = nextSectionMatch.index;
              updatedResumeText = 
                updatedResumeText.substring(0, headerIdx) + 
                headerText + 
                skillsText + 
                afterHeader.substring(nextSectionIdx);
            } else {
              updatedResumeText = 
                updatedResumeText.substring(0, headerIdx) + 
                headerText + 
                skillsText;
            }
            replacedRaw = true;
            break;
          }
        }

        if (!replacedRaw) {
          updatedResumeText = `${updatedResumeText}\n\nTechnical Skills: ${action.skills.join(', ')}`;
        }

        // 2. Update improvedResume (markdown)
        let replacedImp = false;
        const markdownHeaderRx = /## (Technical\s+Skills|Professional\s+Skills|Skills\s+&\s+Tools|Core\s+Competencies|Skills|Expertise)/i;
        
        if (markdownHeaderRx.test(updatedImprovedResume)) {
          const match = updatedImprovedResume.match(markdownHeaderRx);
          const headerText = match[0];
          const headerIdx = updatedImprovedResume.indexOf(headerText);
          
          const afterHeader = updatedImprovedResume.substring(headerIdx + headerText.length);
          const nextHeaderMatch = afterHeader.match(/\n## /);
          
          const skillsContent = '\n\n' + action.skills.map(s => `- ${s}`).join('\n') + '\n';
          
          if (nextHeaderMatch) {
            const nextHeaderIdx = nextHeaderMatch.index;
            updatedImprovedResume = 
              updatedImprovedResume.substring(0, headerIdx) + 
              headerText + 
              skillsContent + 
              afterHeader.substring(nextHeaderIdx);
          } else {
            updatedImprovedResume = 
              updatedImprovedResume.substring(0, headerIdx) + 
              headerText + 
              skillsContent;
          }
          replacedImp = true;
        }

        if (!replacedImp && updatedImprovedResume) {
          updatedImprovedResume = `${updatedImprovedResume}\n\n## Skills\n\n${action.skills.map(s => `- ${s}`).join('\n')}`;
        }

      } else if (action.type === 'REPLACE_TEXT' && action.target && action.replacement) {
        const targetClean = action.target.trim();
        const replacementClean = action.replacement.trim();
        
        // 1. Run replacement on updatedResumeText
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
            console.warn(`[Edit Route] Target text for replacement not found in resumeText: "${targetClean}"`);
          }
        }

        // 2. Run replacement on updatedImprovedResume
        if (updatedImprovedResume) {
          if (updatedImprovedResume.includes(targetClean)) {
            updatedImprovedResume = updatedImprovedResume.replaceAll(targetClean, replacementClean);
          } else {
            const normTarget = targetClean.replace(/\s+/g, ' ');
            const lines = updatedImprovedResume.split('\n');
            let matchedLineIdx = -1;
            
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].replace(/\s+/g, ' ').includes(normTarget)) {
                matchedLineIdx = i;
                break;
              }
            }
            
            if (matchedLineIdx !== -1) {
              lines[matchedLineIdx] = lines[matchedLineIdx].replace(lines[matchedLineIdx], replacementClean);
              updatedImprovedResume = lines.join('\n');
            } else {
              // Soft subset match for markdown formatting differences
              const cleanedTarget = targetClean.replace(/^[\s\-\*\•]+/, '').trim();
              const cleanedReplacement = replacementClean.replace(/^[\s\-\*\•]+/, '').trim();
              if (updatedImprovedResume.includes(cleanedTarget)) {
                updatedImprovedResume = updatedImprovedResume.replaceAll(cleanedTarget, cleanedReplacement);
              } else {
                console.warn(`[Edit Route] Target text for replacement not found in improvedResume: "${targetClean}"`);
              }
            }
          }
        }
      } else if (action.type === 'APPEND_TEXT' && action.text) {
        const textToAppend = action.text.trim();
        
        // 1. Update resumeText
        if (updatedResumeText) {
          updatedResumeText = `${updatedResumeText.trim()}\n\n${textToAppend}`;
        } else {
          updatedResumeText = textToAppend;
        }
        
        // 2. Update improvedResume
        if (updatedImprovedResume) {
          updatedImprovedResume = `${updatedImprovedResume.trim()}\n\n${textToAppend}`;
        } else {
          updatedImprovedResume = textToAppend;
        }
      } else if (action.type === 'UPDATE_FULL_RESUME' && action.improvedResume) {
        const currentLength = updatedImprovedResume ? updatedImprovedResume.length : 0;
        const newLength = action.improvedResume.length;
        
        if (currentLength > 200 && newLength < currentLength * 0.4) {
          console.warn(`[Edit Route] Safety guard triggered: Blocked UPDATE_FULL_RESUME because new length (${newLength}) is suspiciously shorter than original length (${currentLength}).`);
        } else {
          updatedImprovedResume = action.improvedResume;
          if (!updatedResumeText) {
            updatedResumeText = action.improvedResume;
          }
        }
      }
    }

    // 2. Recalculate programmatic ATS score (with a semantic baseline of 75)
    const freshAtsScore = calculateProgrammaticAtsScore(
      updatedImprovedResume || updatedResumeText,
      keywordMatch,
      project.atsScore || 75
    );

    // 3. Save the updated project to the database
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        resumeText: updatedResumeText,
        improvedResume: updatedImprovedResume,
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
        improvedResume: updatedProject.improvedResume,
        atsScore: updatedProject.atsScore,
        keywordMatch: updatedProject.keywordMatch,
      },
    });
  } catch (error) {
    console.error('[Edit API Route] POST error:', error);
    return NextResponse.json({ error: 'Failed to process resume edit action.' }, { status: 500 });
  }
}
