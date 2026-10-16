// Every resume is a list of ResumeSection blocks stored as JSON on the Resume
// row (Resume.sectionsJson). This is what lets us support the full list of
// section types — including arbitrary "custom" sections — without a schema
// migration every time a new section type is added.

export type ResumeSectionType =
  | "contact"
  | "headline"
  | "summary"
  | "education"
  | "experience"
  | "internships"
  | "projects"
  | "technicalSkills"
  | "softSkills"
  | "certifications"
  | "achievements"
  | "awards"
  | "publications"
  | "research"
  | "volunteer"
  | "languages"
  | "interests"
  | "links"
  | "custom";

export interface ResumeSection<T = unknown> {
  id: string;
  type: ResumeSectionType;
  title: string; // display heading, editable (e.g. "Work Experience")
  enabled: boolean; // toggle on/off without deleting data
  order: number;
  content: T;
}

export interface ContactContent {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  photoUrl?: string;
}

export interface SummaryContent {
  text: string;
}

export interface HeadlineContent {
  text: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  highlights: string[];
}
export interface EducationContent {
  entries: EducationEntry[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string; // "" or "Present"
  bullets: string[];
}
export interface ExperienceContent {
  entries: ExperienceEntry[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  link?: string;
  techStack: string[];
  bullets: string[];
}
export interface ProjectsContent {
  entries: ProjectEntry[];
}

export interface SkillsContent {
  skills: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
}
export interface CertificationsContent {
  entries: CertificationEntry[];
}

export interface SimpleListEntry {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}
export interface SimpleListContent {
  entries: SimpleListEntry[];
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}
export interface LanguagesContent {
  entries: LanguageEntry[];
}

export interface LinksContent {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  other?: { label: string; url: string }[];
}

export interface CustomContent {
  entries: SimpleListEntry[];
}

export interface ResumeData {
  sections: ResumeSection[];
}

export const emptyId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// A fresh resume: the minimal MVP section set, in a sensible order.
// Users can add/reorder/remove/toggle any section from here in the builder.
export function createDefaultResumeSections(): ResumeSection[] {
  return [
    {
      id: emptyId(),
      type: "contact",
      title: "Contact",
      enabled: true,
      order: 0,
      content: { fullName: "", email: "", phone: "", location: "" } as ContactContent,
    },
    {
      id: emptyId(),
      type: "headline",
      title: "Professional Headline",
      enabled: true,
      order: 1,
      content: { text: "" } as HeadlineContent,
    },
    {
      id: emptyId(),
      type: "summary",
      title: "Professional Summary",
      enabled: true,
      order: 2,
      content: { text: "" } as SummaryContent,
    },
    {
      id: emptyId(),
      type: "experience",
      title: "Work Experience",
      enabled: true,
      order: 3,
      content: { entries: [] } as ExperienceContent,
    },
    {
      id: emptyId(),
      type: "education",
      title: "Education",
      enabled: true,
      order: 4,
      content: { entries: [] } as EducationContent,
    },
    {
      id: emptyId(),
      type: "projects",
      title: "Projects",
      enabled: true,
      order: 5,
      content: { entries: [] } as ProjectsContent,
    },
    {
      id: emptyId(),
      type: "technicalSkills",
      title: "Technical Skills",
      enabled: true,
      order: 6,
      content: { skills: [] } as SkillsContent,
    },
    {
      id: emptyId(),
      type: "softSkills",
      title: "Soft Skills",
      enabled: false,
      order: 7,
      content: { skills: [] } as SkillsContent,
    },
    {
      id: emptyId(),
      type: "certifications",
      title: "Certifications",
      enabled: false,
      order: 8,
      content: { entries: [] } as CertificationsContent,
    },
    {
      id: emptyId(),
      type: "links",
      title: "Links",
      enabled: true,
      order: 9,
      content: {} as LinksContent,
    },
  ];
}

export const SECTION_LABELS: Record<ResumeSectionType, string> = {
  contact: "Contact",
  headline: "Professional Headline",
  summary: "Professional Summary",
  education: "Education",
  experience: "Work Experience",
  internships: "Internships",
  projects: "Projects",
  technicalSkills: "Technical Skills",
  softSkills: "Soft Skills",
  certifications: "Certifications",
  achievements: "Achievements",
  awards: "Awards",
  publications: "Publications",
  research: "Research Experience",
  volunteer: "Volunteer Experience",
  languages: "Languages",
  interests: "Interests",
  links: "Links",
  custom: "Custom Section",
};
