export interface Contact {
  email?: string;
  phone?: string;
  wechat?: string;
  city?: string;
}

export interface Basics {
  name: string;
  gender?: string;
  birth?: string;
  yearsOfExperience?: string;
  title?: string;
  degree?: string;
  graduation?: string;
  school?: string;
  major?: string;
  educationSummary?: string;
  location?: string;
  github?: string;
  website?: string;
  contact?: Contact;
}

export interface ContributionGroup {
  title: string;
  items: string[];
}

export interface Project {
  name: string;
  description?: string;
  techStack?: string;
  /** 项目开始时间 */
  startDate?: string;
  /** 项目结束时间 */
  endDate?: string;
  /**
   * Raw markdown block for contributions (preferred).
   * Keeps author formatting like **bold**, lists, etc.
   */
  contributionsMarkdown?: string;
  contributions: ContributionGroup[];
}

export interface Experience {
  company: string;
  position: string;
  start: string;
  end: string;
  responsibilities?: string;
  projects: Project[];
}

export interface Education {
  school: string;
  major: string;
  degree: string;
  graduation?: string;
  nature?: string;
}

export interface Resume {
  basics: Basics;
  coreAbilities: string[];
  experiences: Experience[];
  education: Education[];
}

export type ExperienceStyle = "standard" | "compact" | "impact";

export interface TypographySettings {
  bodySize: number;
  headingSize: number;
  nameSize: number;
  lineHeight: number;
  fontFamily: string;
  experienceStyle: ExperienceStyle;
  /**
   * Word-like spacing between content blocks (paragraphs / list items), in px.
   * Use ONE value to avoid element-specific special cases.
   */
  contentGapPx: number;
  pagePaddingTopMm: number;
  pagePaddingBottomMm: number;
  pagePaddingLeftMm: number;
  pagePaddingRightMm: number;
}
