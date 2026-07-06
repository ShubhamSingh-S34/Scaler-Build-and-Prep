// Grounding source: Scaler_Programs_Consolidated_Brief.md (provided by the team).
// This is the ONLY source of truth for course names, durations, curriculum, and
// outcomes used in course-pitch generation — never fabricate details beyond this.

export const SCALER_COURSE_NAMES = [
  "Scaler Academy / Neovarsity – Master's in Computer Science",
  "Modern Data Science & Machine Learning (DSML)",
  "AI & ML with Agentic AI",
  "DevOps, Cloud & AI Platform Engineering",
] as const;

export type ScalerCourseName = (typeof SCALER_COURSE_NAMES)[number];

// The model occasionally paraphrases a course name slightly instead of copying it
// verbatim. Snap it back to the exact catalog string so downstream code (and
// anything shown to a BDA or lead) never sees an invented program name.
export function normalizeCourseName(raw: string): string {
  const exact = SCALER_COURSE_NAMES.find((name) => name === raw);
  if (exact) return exact;

  const lowerRaw = raw.toLowerCase();
  const fuzzy = SCALER_COURSE_NAMES.find(
    (name) => lowerRaw.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerRaw)
  );
  if (fuzzy) return fuzzy;

  const keywordMatch = SCALER_COURSE_NAMES.find((name) =>
    name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 3)
      .some((word) => lowerRaw.includes(word))
  );
  return keywordMatch ?? SCALER_COURSE_NAMES[0];
}

export const SCALER_PROGRAMS_CATALOG = `# Scaler Programs – Consolidated Course Brief

## 1. Scaler Academy / Neovarsity – Master's in Computer Science
- Duration: 18 months (+ placement support)
- Credential: Master's in Computer Science (via Woolf) + Scaler Certificate
- Eligibility: Bachelor's degree, ~1 year professional experience, non-CS graduates accepted.
- Formats: Beginner, Intermediate and Advanced entry tracks.
- Core curriculum: Programming Fundamentals, DSA, Databases & SQL, High Level Design, GenAI for Software Engineers, Advanced Programming, Low Level Design, Advanced Software Engineering.
- Specialisations: Backend (Advanced Programming, LLD, Backend Engineering, Backend Project) or Full Stack (Full-stack Development, LLD, Capstone Project).
- Electives: Product Management, Data Engineering, Data Analytics, DevOps, Data Science & ML, MLOps, ML System Design.
- Outcomes: Software Engineer, Backend Engineer, Full Stack Engineer, Product-focused Engineer.
- Best suited for: Professionals wanting a CS Master's while becoming interview-ready (DSA/HLD/LLD) — classic "service company to product company" switch.

## 2. Modern Data Science & Machine Learning (DSML)
- Duration: ~20 months
- Audience: Freshers, tech & non-tech professionals. 100% Live.
- Curriculum: Data Analytics (Excel, SQL, Python, Product Analytics, Statistics, AWS Analytics), Machine Learning (Supervised/Unsupervised, Recommendation Systems, Time Series, Deep Learning, NLP, Computer Vision), AI (Generative AI, AI Engineering, Agentic AI, MLOps).
- Portfolio projects with real companies: Swiggy, Netflix, Urban Company, PhonePe, Zepto, Meesho, CRED, Myntra, Bajaj Finserv, Nykaa, Blinkit, Razorpay.
- Outcomes: Data Analyst, Data Scientist, ML Engineer, AI Engineer.
- Best suited for: Career transition into Analytics, DS, ML and AI — including from non-tech backgrounds.

## 3. AI & ML with Agentic AI
- Duration: 12–15 months
- Target: Software professionals with coding experience.
- Core topics: Python, Data Foundations, Math for ML, Machine Learning, Deep Learning, NLP, Computer Vision, MLOps, RAG, AI Engineering, Agentic AI, LLMOps, Fine-tuning, Multi-Agent Systems.
- Electives: Advanced ML, Reinforcement Learning, Big Data, System Design.
- Live projects: Fraud Detection, Customer Churn, Retail Optimisation, Food Delivery Analytics, Recommendation Systems, Music Recognition.
- Outcomes: AI Engineer, ML Engineer, Applied Scientist, MLOps Engineer.
- Best suited for: Existing developers who already code and want to move into production AI/agentic systems specifically (RAG, agents, LLMOps) — not a general dev-to-product-company course.

## 4. DevOps, Cloud & AI Platform Engineering
- Duration: 14–18 months
- Core curriculum: Python, Linux, Shell Scripting, Computer Systems, Docker, Kubernetes, CI/CD, AWS, Infrastructure as Code.
- Electives: Observability, Security, Distributed Systems, MLOps, DataOps, Generative AI, Agentic Systems, AI-assisted DSA.
- Certifications: AWS, CKA reimbursement on successful completion.
- Outcomes: DevOps Engineer, Cloud Engineer, Platform Engineer, SRE, MLOps Engineer.
- Best suited for: Backend engineers and SDEs moving into cloud/platform engineering specifically.

## Quick recommendation logic
- Wants a general SDE / product-company switch, strong on DSA/system design fundamentals: Neovarsity Master's.
- Wants a Data/ML/Analytics career, including non-tech backgrounds: DSML.
- Already a working developer who specifically wants applied AI engineering (RAG, agents, LLMs in production): AI & ML with Agentic AI.
- Specifically interested in cloud/infrastructure/platform work: DevOps, Cloud & AI Platform Engineering.
`;
