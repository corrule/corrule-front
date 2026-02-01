/**
 * Work Experience Constants
 * Pre-populated lists of Azerbaijani companies and job titles
 */

// Azerbaijani Banks
export const AZERBAIJANI_BANKS = [
  "Kapital Bank",
  "Pasha Bank",
  "AccessBank",
  "Unibank",
  "Apricot Bank",
  "Xalq Bank",
  "Crescent Bank",
  "Bank Respublika",
  "TuranBank",
  "Azərbaycan Beynəlxalq Bankı (AIBL)",
];

// Azerbaijani Telecom Operators
export const TELECOM_OPERATORS = [
  "Azercell",
  "Bakcell",
  "Nar",
  "Zain",
];

// Azerbaijani Prominent Companies
export const PROMINENT_COMPANIES = [
  "SOCAR",
  "PASHA Holding",
  "Azpetrol",
  "AzerGold",
  "Azərkimya",
  "Azərbaycan Dəmiryolları",
  "Baku Steel",
  "State Oil Company (SOCAR)",
  "Azərbaycan Qazı",
];

// Technology & IT Companies
export const TECH_COMPANIES = [
  "Azərbaycan Teknologiya Universiteti",
  "Code Academy",
  "Technostars",
  "Datachain",
  "Softline Azerbaijan",
  "Microsoft Azerbaijan",
  "IBM Azerbaijan",
  "Google Azerbaijan",
  "Amazon Azerbaijan",
];

// Government & Public Institutions
export const PUBLIC_INSTITUTIONS = [
  "State Tax Service",
  "Ministry of Digital Development and Transport",
  "Ministry of Defense",
  "Ministry of Interior",
  "Baku City Council",
  "Central Bank of Azerbaijan",
];

// International Companies in Azerbaijan
export const INTERNATIONAL_COMPANIES = [
  "BP Azerbaijan",
  "Chevron",
  "Halliburton",
  "Baker Hughes",
  "Schlumberger",
];

// Combined list of all companies (excluding Custom)
export const ALL_COMPANIES = [
  ...AZERBAIJANI_BANKS,
  ...TELECOM_OPERATORS,
  ...PROMINENT_COMPANIES,
  ...TECH_COMPANIES,
  ...PUBLIC_INSTITUTIONS,
  ...INTERNATIONAL_COMPANIES,
];

// Remove duplicates and sort
export const COMPANIES = Array.from(new Set(ALL_COMPANIES)).sort();

// Common Job Titles
export const COMMON_JOB_TITLES = [
  // Engineering
  "Software Engineer",
  "Senior Software Engineer",
  "Lead Software Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile Developer",
  "DevOps Engineer",
  "Cloud Architect",
  "Systems Engineer",
  "Network Engineer",
  "Database Administrator",
  "QA Engineer",
  "Security Engineer",
  "Machine Learning Engineer",
  "Data Scientist",

  // Management & Leadership
  "Engineering Manager",
  "Technical Lead",
  "Project Manager",
  "Product Manager",
  "Director of Engineering",
  "CTO",
  "VP Engineering",
  "CEO",
  "CFO",

  // Analysis & Research
  "SOC Analyst",
  "Business Analyst",
  "Data Analyst",
  "Security Analyst",
  "Research Engineer",
  "Threat Analyst",

  // Operations & Support
  "IT Support",
  "System Administrator",
  "Infrastructure Engineer",
  "Operations Manager",
  "Support Engineer",
  "Technical Support Specialist",

  // Finance & Business
  "Accountant",
  "Financial Analyst",
  "Business Analyst",
  "Consultant",
  "Business Development Manager",

  // HR & Administration
  "Human Resources Manager",
  "HR Specialist",
  "Recruiter",
  "Administrative Assistant",

  // Other
  "Intern",
  "Associate",
  "Specialist",
  "Coordinator",
  "Technician",
];

// Sort job titles alphabetically
export const JOB_TITLES = COMMON_JOB_TITLES.sort();

/**
 * Type definitions for work experience
 */
export interface WorkExperienceEntry {
  _id?: string;
  company: {
    name: string;
    isCustom: boolean;
  };
  job: {
    title: string;
    isCustom: boolean;
  };
  startDate: Date | string;
  endDate: Date | string | null;
  isCurrent: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface WorkExperienceFormData {
  company: string;
  companyIsCustom: boolean;
  customCompany: string;
  job: string;
  jobIsCustom: boolean;
  customJob: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
