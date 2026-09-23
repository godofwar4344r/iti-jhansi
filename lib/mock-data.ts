import { Occupation, Role, TestStatus, Subject, Difficulty, AnswerOption, QuestionType } from "@prisma/client";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  occupation: Occupation | null;
  role: Role;
  disabled: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  approvalStatus: string;
  approvalNote: string | null;
  approvedAt: Date | null;
  testsTaken: number;
}

export interface MockActivity {
  id: string;
  action: string;
  detail: string | null;
  ip: string | null;
  createdAt: Date;
  user: { name: string | null; email: string } | null;
}

export interface MockPdf {
  id: string;
  title: string;
  titleHi: string | null;
  description: string | null;
  topic: string;
  occupation: Occupation;
  subject: Subject;
  year: string | null;
  builtIn: boolean;
  fileUrl: string;
  fileSize: number;
  createdAt: Date;
  uploadedBy: { name: string | null; email: string } | null;
  _count: { views: number; bookmarks: number; questions: number };
}

export interface MockQuestion {
  id: string;
  type: QuestionType;
  question: string;
  questionHi: string | null;
  optionA: string;
  optionAHi: string | null;
  optionB: string;
  optionBHi: string | null;
  optionC: string | null;
  optionCHi: string | null;
  optionD: string | null;
  optionDHi: string | null;
  correctAnswer: AnswerOption;
  topic: string;
  subject: Subject;
  difficulty: Difficulty;
  occupation: Occupation;
  explanation: string | null;
  active: boolean;
  createdAt: Date;
  sourcePdf: { title: string } | null;
  sourcePage: number | null;
}

export interface MockRetest {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string;
  adminNote: string | null;
  occupation: Occupation;
  createdAt: Date;
  reviewedAt: Date | null;
  user: { name: string | null; email: string; phone: string | null };
  test: { score: number; totalQuestions: number; percentage: number; submittedAt: Date | null };
}

// In-memory data store for resilient offline and demo operations
const mockUsers: MockUser[] = [
  {
    id: "demo-admin-id",
    name: "Maa Pitambra Admin (प्रशासक)",
    email: "admin@maapitambra.edu",
    phone: "9876543210",
    occupation: Occupation.ELECTRICIAN,
    role: Role.ADMIN,
    disabled: false,
    emailVerified: new Date("2024-01-01"),
    createdAt: new Date("2024-01-01"),
    lastLoginAt: new Date(),
    approvalStatus: "APPROVED",
    approvalNote: "System Administrator",
    approvedAt: new Date("2024-01-01"),
    testsTaken: 12,
  },
  {
    id: "demo-student-id",
    name: "Rahul Sharma (शिक्षार्थी)",
    email: "student@maapitambra.edu",
    phone: "9876543211",
    occupation: Occupation.FITTER,
    role: Role.USER,
    disabled: false,
    emailVerified: new Date("2024-01-10"),
    createdAt: new Date("2024-01-10"),
    lastLoginAt: new Date(),
    approvalStatus: "APPROVED",
    approvalNote: "Auto-approved demo learner",
    approvedAt: new Date("2024-01-10"),
    testsTaken: 5,
  },
  {
    id: "user-2",
    name: "Amit Verma",
    email: "amit.verma@example.com",
    phone: "9876543212",
    occupation: Occupation.ELECTRICIAN,
    role: Role.USER,
    disabled: false,
    emailVerified: new Date("2024-02-01"),
    createdAt: new Date("2024-02-01"),
    lastLoginAt: new Date(Date.now() - 3600000),
    approvalStatus: "APPROVED",
    approvalNote: null,
    approvedAt: new Date("2024-02-01"),
    testsTaken: 8,
  },
  {
    id: "user-3",
    name: "Pooja Singh",
    email: "pooja.singh@example.com",
    phone: "9876543213",
    occupation: Occupation.BASIC_COSMETOLOGY,
    role: Role.USER,
    disabled: false,
    emailVerified: new Date("2024-02-15"),
    createdAt: new Date("2024-02-15"),
    lastLoginAt: new Date(Date.now() - 7200000),
    approvalStatus: "APPROVED",
    approvalNote: null,
    approvedAt: new Date("2024-02-15"),
    testsTaken: 6,
  },
  {
    id: "user-4",
    name: "Vikas Yadav",
    email: "vikas.yadav@example.com",
    phone: "9876543214",
    occupation: Occupation.SOLAR_TECHNICIAN,
    role: Role.USER,
    disabled: false,
    emailVerified: new Date("2024-03-01"),
    createdAt: new Date("2024-03-01"),
    lastLoginAt: new Date(Date.now() - 14400000),
    approvalStatus: "APPROVED",
    approvalNote: null,
    approvedAt: new Date("2024-03-01"),
    testsTaken: 4,
  },
  {
    id: "user-5",
    name: "Priya Patel",
    email: "priya.patel@example.com",
    phone: "9876543215",
    occupation: Occupation.FITTER,
    role: Role.USER,
    disabled: false,
    emailVerified: new Date("2024-03-10"),
    createdAt: new Date("2024-03-10"),
    lastLoginAt: new Date(Date.now() - 28800000),
    approvalStatus: "APPROVED",
    approvalNote: null,
    approvedAt: new Date("2024-03-10"),
    testsTaken: 3,
  },
  {
    id: "user-6",
    name: "Deepak Sahu",
    email: "deepak.sahu@example.com",
    phone: "9876543216",
    occupation: Occupation.ELECTRICIAN,
    role: Role.USER,
    disabled: true,
    emailVerified: new Date("2024-03-15"),
    createdAt: new Date("2024-03-15"),
    lastLoginAt: new Date(Date.now() - 86400000),
    approvalStatus: "APPROVED",
    approvalNote: null,
    approvedAt: new Date("2024-03-15"),
    testsTaken: 1,
  },
];

const mockActivities: MockActivity[] = [
  {
    id: "act-1",
    action: "user.login",
    detail: "Admin signed in to management portal",
    ip: "127.0.0.1",
    createdAt: new Date(),
    user: { name: "Maa Pitambra Admin (प्रशासक)", email: "admin@maapitambra.edu" },
  },
  {
    id: "act-2",
    action: "test.submitted",
    detail: "Passed AITT Fitter Blueprint Mock Assessment with 84%",
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 1800000),
    user: { name: "Rahul Sharma (शिक्षार्थी)", email: "student@maapitambra.edu" },
  },
  {
    id: "act-3",
    action: "pdf.viewed",
    detail: "Viewed NIMI Fitter Theory Module 1",
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 3600000),
    user: { name: "Amit Verma", email: "amit.verma@example.com" },
  },
  {
    id: "act-4",
    action: "user.signup",
    detail: "New learner account registered and auto-approved",
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 7200000),
    user: { name: "Pooja Singh", email: "pooja.singh@example.com" },
  },
  {
    id: "act-5",
    action: "test.started",
    detail: "Started 30-minute timed exam for Solar Technician",
    ip: "127.0.0.1",
    createdAt: new Date(Date.now() - 14400000),
    user: { name: "Vikas Yadav", email: "vikas.yadav@example.com" },
  },
];

const mockPdfs: MockPdf[] = [
  {
    id: "pdf-fitter-1",
    title: "NIMI Fitter Trade Theory 1st Year",
    titleHi: "निमी फ़िटर ट्रेड थ्योरी प्रथम वर्ष",
    description: "Official DGT & NIMI study material covering marking tools, measuring instruments, and hand tools.",
    topic: "Safety & Hand Tools",
    occupation: Occupation.FITTER,
    subject: Subject.TRADE_THEORY,
    year: "1",
    builtIn: true,
    fileUrl: "/sample.pdf",
    fileSize: 4200000,
    createdAt: new Date("2024-01-01"),
    uploadedBy: { name: "Admin", email: "admin@maapitambra.edu" },
    _count: { views: 42, bookmarks: 12, questions: 25 },
  },
  {
    id: "pdf-elec-1",
    title: "NIMI Electrician Trade Theory 1st Year",
    titleHi: "निमी इलेक्ट्रीशियन ट्रेड थ्योरी प्रथम वर्ष",
    description: "Official NIMI modules covering basic electricity, Ohm's law, magnetism, and AC circuits.",
    topic: "Basic Electricity",
    occupation: Occupation.ELECTRICIAN,
    subject: Subject.TRADE_THEORY,
    year: "1",
    builtIn: true,
    fileUrl: "/sample.pdf",
    fileSize: 5100000,
    createdAt: new Date("2024-01-01"),
    uploadedBy: { name: "Admin", email: "admin@maapitambra.edu" },
    _count: { views: 38, bookmarks: 15, questions: 30 },
  },
  {
    id: "pdf-solar-1",
    title: "Solar Technician (Electrical) Module 1",
    titleHi: "सोलर तकनीशियन (इलेक्ट्रिकल) मॉड्यूल 1",
    description: "Photovoltaic cells, panels, solar charge controllers, and inverter installation.",
    topic: "Photovoltaic Systems",
    occupation: Occupation.SOLAR_TECHNICIAN,
    subject: Subject.TRADE_THEORY,
    year: "1",
    builtIn: true,
    fileUrl: "/sample.pdf",
    fileSize: 3800000,
    createdAt: new Date("2024-01-01"),
    uploadedBy: { name: "Admin", email: "admin@maapitambra.edu" },
    _count: { views: 24, bookmarks: 8, questions: 20 },
  },
  {
    id: "pdf-cosmo-1",
    title: "Basic Cosmetology Theory Module",
    titleHi: "बेसिक कॉस्मेटोलॉजी थ्योरी मॉड्यूल",
    description: "Skin care, hair styling, sanitation, sterilization, and salon management.",
    topic: "Skin & Hair Care",
    occupation: Occupation.BASIC_COSMETOLOGY,
    subject: Subject.TRADE_THEORY,
    year: "1",
    builtIn: true,
    fileUrl: "/sample.pdf",
    fileSize: 3400000,
    createdAt: new Date("2024-01-01"),
    uploadedBy: { name: "Admin", email: "admin@maapitambra.edu" },
    _count: { views: 19, bookmarks: 5, questions: 20 },
  },
  {
    id: "pdf-wcs-1",
    title: "Workshop Calculation & Science",
    titleHi: "कार्यशाला गणना एवं विज्ञान",
    description: "Common paper covering units, fractions, speed, velocity, work, power, and energy.",
    topic: "Units & Applied Mathematics",
    occupation: Occupation.FITTER,
    subject: Subject.WORKSHOP_CALCULATION,
    year: "1",
    builtIn: true,
    fileUrl: "/sample.pdf",
    fileSize: 2900000,
    createdAt: new Date("2024-01-01"),
    uploadedBy: { name: "Admin", email: "admin@maapitambra.edu" },
    _count: { views: 56, bookmarks: 22, questions: 25 },
  },
];

const mockQuestions: MockQuestion[] = [
  {
    id: "q-1",
    type: "MCQ" as any,
    question: "Which file is used for filing wood, leather, and soft materials?",
    questionHi: "लकड़ी, चमड़े और नरम सामग्री को रेतने के लिए किस रेती (फ़ाइल) का उपयोग किया जाता है?",
    optionA: "Single cut file",
    optionAHi: "सिंगल कट फ़ाइल",
    optionB: "Rasp cut file",
    optionBHi: "रास्प कट फ़ाइल",
    optionC: "Double cut file",
    optionCHi: "डबल कट फ़ाइल",
    optionD: "Curved cut file",
    optionDHi: "कर्व्ड कट फ़ाइल",
    correctAnswer: AnswerOption.B,
    topic: "Hand Tools",
    subject: Subject.TRADE_THEORY,
    difficulty: Difficulty.EASY,
    occupation: Occupation.FITTER,
    explanation: "Rasp cut files have individual, sharp, triangular teeth suitable for softer materials.",
    active: true,
    createdAt: new Date("2024-01-01"),
    sourcePdf: { title: "NIMI Fitter Trade Theory 1st Year" },
    sourcePage: null,
  },
  {
    id: "q-2",
    type: "MCQ" as any,
    question: "What is the unit of electrical resistance?",
    questionHi: "विद्युत प्रतिरोध की इकाई क्या है?",
    optionA: "Ampere",
    optionAHi: "एम्पीयर",
    optionB: "Volt",
    optionBHi: "वोल्ट",
    optionC: "Ohm",
    optionCHi: "ओम",
    optionD: "Watt",
    optionDHi: "वाट",
    correctAnswer: AnswerOption.C,
    topic: "Basic Electricity",
    subject: Subject.TRADE_THEORY,
    difficulty: Difficulty.EASY,
    occupation: Occupation.ELECTRICIAN,
    explanation: "Ohm is the SI unit of electrical resistance, named after Georg Simon Ohm.",
    active: true,
    createdAt: new Date("2024-01-01"),
    sourcePdf: { title: "NIMI Electrician Trade Theory 1st Year" },
    sourcePage: null,
  },
  {
    id: "q-3",
    type: "MCQ" as any,
    question: "Which device converts direct current (DC) from solar panels into alternating current (AC)?",
    questionHi: "कौन सा उपकरण सोलर पैनल से प्राप्त दिष्ट धारा (DC) को प्रत्यावर्ती धारा (AC) में परिवर्तित करता है?",
    optionA: "Solar Inverter",
    optionAHi: "सोलर इन्वर्टर",
    optionB: "Charge Controller",
    optionBHi: "चार्ज कंट्रोलर",
    optionC: "Transformer",
    optionCHi: "ट्रांसफार्मर",
    optionD: "Rectifier",
    optionDHi: "रेक्टिफायर",
    correctAnswer: AnswerOption.A,
    topic: "Photovoltaic Systems",
    subject: Subject.TRADE_THEORY,
    difficulty: Difficulty.MEDIUM,
    occupation: Occupation.SOLAR_TECHNICIAN,
    explanation: "A solar inverter converts variable DC output of a photovoltaic solar panel into utility frequency AC.",
    active: true,
    createdAt: new Date("2024-01-01"),
    sourcePdf: { title: "Solar Technician (Electrical) Module 1" },
    sourcePage: null,
  },
];

const mockRetests: MockRetest[] = [
  {
    id: "rt-1",
    userId: "demo-student-id",
    status: "APPROVED",
    reason: "Requested additional practice attempt for Trade Theory revision.",
    adminNote: "Unlimited retest granted automatically.",
    occupation: Occupation.FITTER,
    createdAt: new Date(Date.now() - 3600000),
    reviewedAt: new Date(),
    user: { name: "Rahul Sharma (शिक्षार्थी)", email: "student@maapitambra.edu", phone: "9876543211" },
    test: { score: 38, totalQuestions: 50, percentage: 76, submittedAt: new Date(Date.now() - 7200000) },
  },
];

// Helper methods to query and mutate in-memory data
export function getMockUsers(): MockUser[] {
  return [...mockUsers];
}

export function deleteMockUser(id: string): boolean {
  const index = mockUsers.findIndex((u) => u.id === id);
  if (index !== -1) {
    mockUsers.splice(index, 1);
    return true;
  }
  return false;
}

export function updateMockUser(id: string, updates: Partial<MockUser>): MockUser | null {
  const user = mockUsers.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
}

export function setMockUserDisabled(id: string, disabled: boolean): boolean {
  const user = mockUsers.find((u) => u.id === id);
  if (user) {
    user.disabled = disabled;
    return true;
  }
  return false;
}

export function getMockActivities(): MockActivity[] {
  return [...mockActivities];
}

export function getMockPdfs(): MockPdf[] {
  return [...mockPdfs];
}

export function getMockQuestions(): MockQuestion[] {
  return [...mockQuestions];
}

export function getMockRetests(): MockRetest[] {
  return [...mockRetests];
}
