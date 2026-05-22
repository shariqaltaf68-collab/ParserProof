/**
 * ParserProof Structured Knowledge Base
 * 
 * Contains verified, grounded documentation on ATS systems, resume optimization rules,
 * approved resume examples, keyword alignment, safe writing guidelines, anti-hallucination policies,
 * ParserProof SaaS feature definitions, and verified pricing lists.
 */

export const KNOWLEDGE_BASE_CHUNKS = [
  // --- ATS OPTIMIZATION RULES ---
  {
    id: "ats_opt_layouts",
    category: "ats_optimization",
    title: "ATS-Safe Layouts, Templates, and Formatting Guidelines",
    keywords: ["layout", "template", "column", "canva", "table", "parsing", "header", "footer", "font", "pdf", "docx"],
    content: `ATS-Safe Formatting Rules:
1. Column Structure: Always use a single-column layout. Multi-column layouts (often created in Canva or visually heavy design tools) are frequently parsed out-of-order by ATS parsers, reading line-by-line horizontally across columns and scrambling experience blocks.
2. Table and Graphic Safety: Never use tables, text boxes, icons, progress bars, graphics, or images. Standard ATS parsers (like RecruitLoop, Taleo, Workday, iCIMS, or Greenhouse) fail to extract text from text boxes or floating shapes, leaving sections completely blank.
3. Headers and Footers: Avoid putting vital contact information (phone, email, portfolio links) in the document's header or footer sections. Many parsers ignore these sections entirely to focus on body text. Put contact information directly at the top of the body text.
4. Fonts: Use standard, web-safe fonts such as Inter, Arial, Calibri, Helvetica, or Georgia. Avoid custom or decorative fonts that do not have clean unicode mappings.
5. File Formats: Standard PDF and DOCX formats are widely accepted. However, PDFs compiled as flattened images are unparseable. The text must be selectable. For best compatibility, a clean single-column PDF or DOCX is required.`
  },
  {
    id: "ats_opt_headings",
    category: "ats_optimization",
    title: "Standard ATS Section Headings and Parsing Hierarchies",
    keywords: ["heading", "section", "experience", "education", "skills", "certifications", "parsing pipeline", "hierarchy"],
    content: `ATS Parsing Heading Rules:
1. Standard Headings: Standard ATS parsers use heuristic keyword matching to split resumes into separate sections. Use simple, standard heading text:
   - Use "Experience", "Professional Experience", "Work Experience", or "Employment History" for jobs.
   - Use "Education" or "Academic History" for degrees.
   - Use "Skills", "Technical Skills", or "Core Competencies" for skills lists.
   - Use "Certifications" or "Credentials" for certifications.
   - Use "Projects" or "Technical Projects" for project lists.
2. Custom Heading Risks: Custom headings like "Where I've Been", "My Journey", "Strengths Matrix", or "Brain Power" fail heuristics, causing the parsing pipeline to miscategorize the text or ignore it completely, leading to an empty profile in the recruiter's system.
3. Hierarchy: Headings should be prominent (e.g., Markdown '##' or Bold uppercase) and followed by chronological blocks.`
  },

  // --- RESUME WRITING GUIDELINES ---
  {
    id: "resume_writing_star",
    category: "resume_writing",
    title: "The STAR Method and Google XYZ Achievement Formula",
    keywords: ["star method", "xyz formula", "bullet point", "achievement", "metric", "quantify", "action verb"],
    content: `STAR & XYZ Writing Formulas:
1. The STAR Method: Every experience and project bullet point should follow a structured framework:
   - Situation: The context or business challenge.
   - Task: The goal or candidate's specific responsibility.
   - Action: The technical actions taken, tools used, and methodologies applied.
   - Result: The business outcome, metric improvement, or qualitative impact.
2. The Google XYZ Formula: Formulate high-impact statements as: "Accomplished [X], as measured by [Y], by doing [Z]".
   - Example: "Optimized SQL database query latency [X] by 35% [Y] by redesigning indexed tables and rewriting inefficient multi-table joins [Z]."
3. Action-Oriented Phrasing: Always start bullet points with strong, active verbs (e.g., "Led", "Engineered", "Designed", "Spearheaded", "Optimized", "Redesigned", "Formulated"). Never use passive phrasing like "Responsible for...", "Helped with...", "Assisted in...", "Worked on...".`
  },
  {
    id: "resume_writing_quantify",
    category: "resume_writing",
    title: "Quantifying Impact Responsibly Without Fake Metrics",
    keywords: ["quantify", "metric", "percentage", "revenue", "scale", "placeholder", "fake numbers", "estimate"],
    content: `Responsible Metrics Quantification:
1. Never Fabricate Numbers: Inventing percentages, dollar figures, or scale numbers is a severe ethical violation. It destroys candidate credibility during recruiter screens and technical interviews.
2. Focus on Actionable Scopes: If the exact percentage is unknown, quantify the scope of the project instead (e.g., "Managed a database containing **40,000+** records", "Maintained an internal application used by **50+** developers", "Processed **150+** customer requests weekly").
3. Use Bracketed Placeholders: When a metric would be highly valuable but isn't provided by the candidate, use a clear bracketed placeholder (e.g., "[quantify: e.g., reduced load time by X%]" or "[add budget/savings]") instead of fabricating a fake number. This prompts the user to insert their real-world achievement safely.`
  },

  // --- APPROVED RESUME EXAMPLES ---
  {
    id: "approved_examples_se",
    category: "resume_writing",
    title: "Approved High-Impact Software Engineering Resume Bullet Examples",
    keywords: ["software engineer", "developer", "sql", "api", "react", "git", "cloud", "aws", "docker", "performance"],
    content: `Approved Software Engineering Bullets (100% Truthful Context Framework):
- "Engineered a responsive single-page administration dashboard using **React** and **Redux**, reducing initial page load time by **22%** and improving modularity."
- "Optimized backend RESTful API endpoints in **Node.js** and **Express**, decreasing database query roundtrips and accelerating average response times from **320ms** to **140ms**."
- "Redesigned database schemas and established proper indexing on high-frequency tables in **PostgreSQL**, resolving query locks and improving write throughput under load."
- "Established automated CI/CD pipelines using **GitHub Actions** and **Docker**, accelerating staging deployment cycles and reducing manual configuration tasks."`
  },
  {
    id: "approved_examples_da",
    category: "resume_writing",
    title: "Approved High-Impact Data Analyst and Business Analyst Examples",
    keywords: ["data analyst", "excel", "python", "power bi", "tableau", "dashboard", "report", "insights", "metrics"],
    content: `Approved Data Analyst Bullets (100% Truthful Context Framework):
- "Developed automated interactive dashboards in **Tableau** to visualize key pipeline metrics, saving business teams **4+** hours of weekly manual reporting."
- "Wrote complex analytical queries in **SQL** to clean, join, and aggregate transactional datasets, identifying **3** operational bottlenecks."
- "Built predictive forecasting models in **Python** using pandas and scikit-learn, yielding quantitative insights that guided supply chain decisions."
- "Refined legacy financial calculation models in **Excel** using advanced formulas and pivot tables, improving model calculation speed and eliminating redundant worksheets."`
  },

  // --- KEYWORD OPTIMIZATION RULES ---
  {
    id: "keyword_opt_rules",
    category: "keyword_optimization",
    title: "ATS Keyword Alignment, Density, and Matching Heuristics",
    keywords: ["keyword density", "stuffing", "exact match", "acronym", "plural", "skills list", "contextual integration"],
    content: `Keyword Integration Best Practices:
1. Contextual Integration: Keywords must be woven naturally into professional experience bullets and project descriptions. Do not simply copy-paste a list of words into a tiny font or hide white text. Modern ATS parsers scan for context, and human recruiters will immediately flag keyword stuffing as spam.
2. Skills Lists: Supplement chronological experience with a dedicated skills section divided into categories (e.g., "Languages", "Frameworks", "Tools", "Methodologies"). This ensures the parsing algorithm registers the term.
3. Exact Match Heuristics: Parsers are increasingly sophisticated, but match rates improve when keywords match the spelling and format in the Job Description (e.g., if the JD lists "React.js", include "React.js" alongside "React"). Use both acronyms and full names (e.g., "Search Engine Optimization (SEO)" or "Continuous Integration / Continuous Deployment (CI/CD)").`
  },

  // --- PARSERPROOF FEATURE EXPLANATIONS ---
  {
    id: "feature_resume_checker",
    category: "parserproof_features",
    title: "ParserProof Automated Resume ATS Checker & Verification Engine",
    keywords: ["resume checker", "ats score", "verification", "pdf upload", "text extraction", "ats audit"],
    content: `How ParserProof's Heuristic Checking Works:
1. Text Extraction: The system safely parses uploaded PDF and TXT files, extracting raw text and verifying if it is selectable, indexable, and free of scrambling.
2. Heuristic Audit: The system scans the extracted text for common parsing structural issues, such as multi-column layouts, tabular formatting, complex icons, non-standard fonts, or missing contact info.
3. Programmatic Verification: An ATS score is computed programmatically by combining keyword match rate (50%), section-header structure (25%), and metric/quantification density (25%). This avoids inflated AI scores and guarantees a highly realistic, recruiter-grade metric.`
  },
  {
    id: "feature_skill_gap",
    category: "parserproof_features",
    title: "ParserProof Skill Gap Analysis and Career Growth Intelligence",
    keywords: ["skill gap", "gap analysis", "career coach", "recommendations", "job requirements", "up-skilling"],
    content: `How ParserProof Skill Gap Analysis Works:
1. Requirements Extraction: The system extracts key technical requirements, required software, core methodologies, and soft skills from the job description.
2. Gap Identification: It compares these requirements with the candidate's existing experience and technical skills to find exact mismatches.
3. Actionable Pathways: Rather than giving generic feedback, it provides blunt, realistic, and highly practical recommendations (e.g., suggest completing a specific project, taking a course, or highlighting transferrable skills) to bridge those gaps honestly.`
  },

  // --- PRICING INFORMATION ---
  {
    id: "pricing_plans",
    category: "pricing_faq",
    title: "ParserProof Software SaaS Pricing Plans and Usage Limits",
    keywords: ["pricing", "plan", "free", "starter", "pro", "limits", "cost", "billing", "upgrade", "rupees", "inr"],
    content: `Verified ParserProof SaaS Plans and Pricing:
1. Free Plan (₹0 / month):
   - Access to standard single-column ATS Resume Parser & Optimizer.
   - Up to 3 resume generation limits per month.
   - Grounded ATS Score analysis & matched keyword checklists.
2. Starter Plan (₹499 / month):
   - Access to full Tailored Cover Letter generator and complete Match Rate analysis.
   - Up to 15 resume optimization generations per month.
   - Full keyword optimization dashboard.
3. Pro Plan (₹999 / month):
   - Access to 8-Question Custom Technical/Behavioral Interview Preparation & Skill Gap Analysis.
   - Up to 50 premium resume optimizations per month.
   - Full support for FAANG and executive-level McKinsey-grade PDF templates.`
  },

  // --- TRUTHFUL REWRITE AND ANTI-HALLUCINATION POLICIES ---
  {
    id: "truthful_rewrite_policy",
    category: "truthful_writing",
    title: "Truthful Rewrite and Strict Anti-Hallucination Guidelines",
    keywords: ["anti-hallucination", "grounding", "truthfulness", "honesty", "fake experience", "exaggeration", "myth"],
    content: `Strict Factual Grounding & Anti-Hallucination Guidelines:
1. Avoid Fake Expertise: ParserProof must never generate fictitious employers, dates, academic degrees, certifications, or professional awards.
2. Grounded Output Heuristics:
   - Do not claim a candidate knows a tool, language, or system if they have never mentioned it or if the target job description is the only place it appears.
   - If the candidate's experience is thin (e.g., fresh graduate), enhance the phrasing of existing projects, internships, and coursework. Never invent corporate experience to "pad" the resume.
   - If evidence is weak or context is missing for a job description requirement, explicitly instruct the user to complete it manually or provide a clear, highlighted placeholder (e.g., "[quantify]" or "[add tool]").
3. Professional Tone: Maintain a practical, direct, blunt, and highly realistic tone. Avoid fake motivational fluff (e.g., "you are a stellar visionary ready to conquer the corporate world") or robotic AI clichés.`
  }
];
