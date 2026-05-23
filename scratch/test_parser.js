const formatMessageText = (text) => {
  if (!text) return '';

  // Clear raw LaTeX delimiters that standard markdown engines fail to render
  let cleaned = text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1') // $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1') // \[...\]
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1') // \(...\)
    .replace(/\\text\{([\s\S]*?)\}/g, '$1') // \text{...}
    .replace(/\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/g, '$1 / $2'); // \frac{...}{...}

  // Capture standard weight layouts and wrap in custom formula boxes
  const equationRegex = /(\*\*Score\*\*|\*\*ATS Score Breakdown\*\*|\*\*STAR Formula\*\*|\*\*Equation\*\*|\*\*Weight Breakdown\*\*)\s*=\s*([^.\n]+)/gi;
  if (equationRegex.test(cleaned)) {
    cleaned = cleaned.replace(equationRegex, (match, title, formula) => {
      return `\n\n<div class="math-formula-box">
        <div class="math-formula-title">📋 VERIFIED FORMULA MODEL</div>
        <div class="math-formula-body">${title} = ${formula}</div>
      </div>\n\n`;
    });
  }

  // Phase 5 client-side Markdown rendering engine
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong class="markdown-strong">$1</strong>');
  cleaned = cleaned.replace(/`([^`]+)`/g, '<code class="markdown-code">$1</code>');

  const lines = cleaned.split('\n');
  let htmlOutput = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === '') {
      if (inList) {
        htmlOutput.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      htmlOutput.push(`<h5 class="markdown-h5">${line.substring(4)}</h5>`);
    } else if (line.startsWith('## ')) {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      htmlOutput.push(`<h4 class="markdown-h4">${line.substring(3)}</h4>`);
    } else if (line.startsWith('# ')) {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      htmlOutput.push(`<h3 class="markdown-h3">${line.substring(2)}</h3>`);
    } else if (line.includes('<div class="math-formula-box">') || line.includes('math-formula-title') || line.includes('math-formula-body') || line.includes('</div>')) {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      htmlOutput.push(line);
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      if (!inList) {
        htmlOutput.push('<ul class="markdown-ul">');
        inList = true;
      }
      htmlOutput.push(`<li class="markdown-li">${line.substring(2).trim()}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      const match = line.match(/^(\d+)\.\s(.*)/);
      htmlOutput.push(`<div class="markdown-ol-item"><span class="markdown-ol-num">${match[1]}.</span><span class="markdown-ol-text">${match[2]}</span></div>`);
    } else {
      if (inList) { htmlOutput.push('</ul>'); inList = false; }
      htmlOutput.push(`<p class="markdown-p">${line}</p>`);
    }
  }

  if (inList) {
    htmlOutput.push('</ul>');
  }

  return htmlOutput.join('\n');
};

const sampleText = `## STAR-Bullet Optimizer - How to turn any raw bullet into a recruiter ready, ATS friendly line

### 1. The STAR template (keep it tight)
...
**S**ituation / Task - brief context (1-2 words + what needed)
**A**ction - what you actually did (focus on tools, methods, keywords)
**R**esult - measurable impact (percent, time, cost, safety, quality). Use a placeholder if you don't have a number.

| **Length** | 1-2 sentences, ~30-45 words | Keeps ATS readability high. |`;

console.log("=== OUTPUT ===");
console.log(formatMessageText(sampleText));
