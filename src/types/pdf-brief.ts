export type PdfBriefContent = {
  headline: string;
  openingLine: string;
  questions: { question: string; answer: string }[];
  whyScalerForYou: string;
  roiReasoning: string;
  coursePitch: {
    courseName: string;
    reason: string;
  };
  coveringMessage: string;
  facts: string[];
  inferred: string[];
  missing: string[];
};
