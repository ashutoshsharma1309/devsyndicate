/**
 * Shared marketing copy. Kept in one place so the homepage, /services and
 * /how-it-works stay consistent. Nothing here makes numeric or client claims.
 */

export const trustPoints = [
  "Industry-connected",
  "End-to-end execution",
  "Student-first participation",
  "Professional evaluation",
  "Scalable event formats",
] as const;

export const problems = [
  {
    title: "Student outreach",
    body: "Getting meaningful participation beyond the students who already show up for everything on campus.",
  },
  {
    title: "Industry access",
    body: "Finding credible judges, mentors and technology partners — and coordinating their time around yours.",
  },
  {
    title: "Operations",
    body: "Registrations, team formation, submissions, evaluation and a steady stream of participant questions, all at once.",
  },
  {
    title: "Event quality",
    body: "Making the event feel like a professional technology event rather than something put together the week before.",
  },
] as const;

export type Phase = "Plan" | "Build-up" | "Live" | "After";

export const lifecycle: {
  n: string;
  title: string;
  phase: Phase;
  body: string;
  deliverables: string[];
}[] = [
  {
    n: "01",
    title: "Strategy",
    phase: "Plan",
    body: "We start with what your institution wants out of the event — then shape the theme, tracks, scale and format around it.",
    deliverables: ["Event objectives", "Format & scale", "Themes & tracks", "Master timeline"],
  },
  {
    n: "02",
    title: "Branding",
    phase: "Plan",
    body: "A name, identity and event page that make the hackathon look like a serious technology event — with your college front and centre.",
    deliverables: ["Event identity", "Event website", "Social & print assets", "Certificate design"],
  },
  {
    n: "03",
    title: "Marketing",
    phase: "Plan",
    body: "Outreach built to bring in serious builders: student communities, other campuses and developer networks — not just registration counts.",
    deliverables: ["Outreach plan", "Campaign content", "Community & campus outreach", "Partner promotion"],
  },
  {
    n: "04",
    title: "Registrations",
    phase: "Build-up",
    body: "Registration, team formation, screening and every participant email in between, handled on a proper platform.",
    deliverables: ["Registration flow", "Team formation", "Shortlisting", "Participant communication"],
  },
  {
    n: "05",
    title: "Mentors & Judges",
    phase: "Build-up",
    body: "We bring in engineers, founders and technology professionals to guide teams and evaluate their work, subject to availability.",
    deliverables: ["Mentor panel", "Judging panel", "Briefing & scheduling", "Problem statements"],
  },
  {
    n: "06",
    title: "Evaluation",
    phase: "Build-up",
    body: "Rubrics, judging rounds and scoring designed before the event starts, so results are consistent and defensible.",
    deliverables: ["Judging criteria", "Round structure", "Scoring system", "Result review"],
  },
  {
    n: "07",
    title: "Event Execution",
    phase: "Live",
    body: "On the day — or across the days — we run the schedule: check-in, mentoring rounds, submissions, presentations and results.",
    deliverables: ["Run-of-show", "On-ground / online ops", "Submission desk", "Results & prizes"],
  },
  {
    n: "08",
    title: "Post-event Reporting",
    phase: "After",
    body: "A clear report on participation, projects and engagement, plus certificates for every participant — so the event keeps paying off.",
    deliverables: ["Event report", "Participation insights", "Certificates", "Project showcase"],
  },
];

export const differentiators = [
  {
    title: "Industry-connected",
    body: "We bring professionals, founders, engineers and technology leaders into the room — as mentors, judges and problem-setters.",
  },
  {
    title: "Designed for participation",
    body: "Marketing and outreach designed to attract serious builders, not just to push up registration numbers.",
  },
  {
    title: "End-to-end execution",
    body: "One team carries the operational load from the first planning call to the final evaluation and report.",
  },
  {
    title: "Built around outcomes",
    body: "The aim is meaningful projects, real student engagement, industry interaction and visibility for your institution.",
  },
  {
    title: "Flexible formats",
    body: "Department-level, campus-wide, national or a corporate challenge — the structure follows your objective.",
  },
] as const;

export const formats = [
  {
    code: "CAMPUS",
    title: "Campus Hackathon",
    summary: "For a single college or institution.",
    scope: "Your students, your departments",
    goodFor: "Building an innovation culture on campus and giving students their first serious build experience.",
  },
  {
    code: "NATIONAL",
    title: "National Hackathon",
    summary: "Open participation across colleges.",
    scope: "Students from campuses across India",
    goodFor: "Institutional visibility, a stronger applicant pool and putting your campus on the national tech map.",
  },
  {
    code: "INDUSTRY",
    title: "Industry Challenge",
    summary: "A company brings a real-world problem for students to solve.",
    scope: "A partner company and selected participants",
    goodFor: "Industry interaction, placement conversations and problem statements that matter outside the classroom.",
  },
  {
    code: "INNOVATION",
    title: "Innovation Challenge",
    summary: "Focused on emerging technologies and problem solving.",
    scope: "Theme-led — AI, sustainability, health, fintech and more",
    goodFor: "Innovation and incubation cells looking for early ideas worth taking further.",
  },
  {
    code: "CUSTOM",
    title: "Custom Format",
    summary: "Designed around your institution's specific objective.",
    scope: "Whatever the objective needs",
    goodFor: "Department events, ideathons, multi-stage challenges or anything that doesn't fit a template.",
  },
] as const;

export const ecosystem = [
  { label: "Colleges", body: "Host the event and set the objective." },
  { label: "Students", body: "Form teams and build working projects." },
  { label: "Mentors", body: "Unblock teams while they build." },
  { label: "Judges", body: "Evaluate work against clear criteria." },
  { label: "Technology companies", body: "Bring problems, tools and opportunities." },
  { label: "Innovation", body: "Projects worth taking beyond the weekend." },
] as const;

export const process = [
  {
    n: "01",
    title: "Tell us what you want to build",
    body: "Your college shares its objectives, audience, scale and preferred theme.",
    fromYou: "Objectives, rough dates, expected scale, a point of contact.",
    fromUs: "A first conversation and honest questions about what will work.",
  },
  {
    n: "02",
    title: "We design the format",
    body: "We recommend the event structure, timeline and engagement model.",
    fromYou: "Feedback on the recommendation and internal approvals.",
    fromUs: "A proposed format, timeline, responsibilities and scope.",
  },
  {
    n: "03",
    title: "We build the ecosystem",
    body: "Marketing, participants, judges, mentors, sponsors and operational infrastructure.",
    fromYou: "Venue and infrastructure confirmation, on-campus communication.",
    fromUs: "Branding, outreach, registrations, mentor and judge panels.",
  },
  {
    n: "04",
    title: "We run the hackathon",
    body: "Registration, submissions, evaluation, communication and event operations.",
    fromYou: "Faculty coordination and access on the day.",
    fromUs: "The run-of-show, participant support, judging and results.",
  },
  {
    n: "05",
    title: "You get the outcome",
    body: "Projects, participation insights, engagement metrics and a professional post-event report.",
    fromYou: "Nothing more — the report comes to you.",
    fromUs: "Report, certificates and a project showcase you can use.",
  },
] as const;

/** /services — stage detail grouped by phase. Uses `lifecycle` above for the stages themselves. */
export const phaseIntros: Record<Phase, string> = {
  Plan: "Shape the event and make it worth showing up for.",
  "Build-up": "Fill it with the right participants, mentors and judges.",
  Live: "Run it smoothly, on the ground or online.",
  After: "Turn the event into something your institution can use.",
};

/** /services — what partner companies can contribute. No named partners until they are real. */
export const partnerOptions = [
  {
    title: "Bring a problem statement",
    body: "Set a real challenge from your product or industry and see how students approach it.",
  },
  {
    title: "Mentor or judge",
    body: "Engineers and leaders from your team guide builders and evaluate the work.",
  },
  {
    title: "Sponsor the event",
    body: "Support prizes, tools, credits or the event itself, with visibility agreed up front.",
  },
  {
    title: "Meet builders",
    body: "Interact with motivated students who have just shipped something under pressure.",
  },
] as const;

/** /about */
export const principles = [
  {
    title: "Credibility over hype",
    body: "We don't inflate numbers, invent partners or promise what we can't deliver. Your institution's name is on the event; we treat it that way.",
  },
  {
    title: "Builders first",
    body: "Every decision — format, outreach, mentoring, judging — is judged by whether it helps students build something real.",
  },
  {
    title: "Responsibilities in writing",
    body: "What your college handles and what we handle is agreed before any work starts. No surprises on either side.",
  },
  {
    title: "Industry in the room",
    body: "A hackathon matters more when the people evaluating the work are the people building technology for a living.",
  },
] as const;

export const audiences = [
  {
    label: "Primary",
    title: "Colleges & institutions",
    body: "Management, deans, placement and training cells, innovation and incubation cells, department heads and student affairs teams.",
  },
  {
    label: "Partners",
    title: "Companies & professionals",
    body: "Technology companies, startups, engineers and founders who want to mentor, judge, sponsor or set a challenge.",
  },
  {
    label: "Participants",
    title: "Students & communities",
    body: "Student developers, designers and builders — and the campus communities they belong to.",
  },
] as const;

export const responsibilities = {
  college: [
    "Venue",
    "Institutional coordination",
    "Faculty point of contact",
    "Internal approvals",
    "On-campus communication",
    "Required infrastructure",
  ],
  devSyndicate: [
    "Event strategy",
    "Branding",
    "Marketing",
    "Registration",
    "Participant outreach",
    "Judges",
    "Mentors",
    "Evaluation",
    "Technology platform",
    "Event coordination",
    "Post-event reporting",
  ],
} as const;

export const journey = [
  { key: "discover", label: "Discover" },
  { key: "register", label: "Register" },
  { key: "build", label: "Build" },
  { key: "mentor", label: "Mentor" },
  { key: "submit", label: "Submit" },
  { key: "present", label: "Present" },
  { key: "win", label: "Win" },
] as const;

/**
 * Metrics every post-event report covers. `value` stays null until there is a
 * verified, cumulative number to publish — never fill these with estimates.
 * When a value is set, the homepage animates it in automatically.
 */
export const outcomeMetrics: { label: string; detail: string; value: number | null; suffix?: string }[] = [
  { label: "Participants", detail: "Registered, shortlisted and active on the day.", value: null },
  { label: "Colleges reached", detail: "Campuses represented among participants.", value: null },
  { label: "Projects submitted", detail: "Complete submissions that reached judging.", value: null },
  { label: "Industry mentors", detail: "Professionals who mentored teams.", value: null },
  { label: "Judges", detail: "Evaluators across judging rounds.", value: null },
  { label: "Sponsors", detail: "Companies supporting the event.", value: null },
  { label: "Hours of engagement", detail: "Build, mentoring and presentation time.", value: null },
];

export const expectations = [
  {
    title: "Clear communication",
    body: "One point of contact on our side, with regular status updates through planning and the event itself.",
  },
  {
    title: "Structured execution",
    body: "An agreed timeline, a defined scope and a run-of-show everyone can see before the event starts.",
  },
  {
    title: "Professional event management",
    body: "The event looks and runs like a serious technology event, because it is planned like one.",
  },
  {
    title: "Transparent coordination",
    body: "Responsibilities are written down early: what your college handles, and what we handle.",
  },
  {
    title: "Post-event reporting",
    body: "A report on participation, projects and engagement that your institution can actually use.",
  },
] as const;

export const faqs = [
  {
    q: "How much does a hackathon cost?",
    a: "There is no fixed package, because no two hackathons are the same size. Cost depends on scale and duration, expected participant count, the event format, how much industry involvement you want, marketing requirements, the judges and mentors involved, and venue and logistics. Tell us what you have in mind and we'll put together a proposal with a clear scope.",
  },
  {
    q: "Can you organize a national-level hackathon?",
    a: "Yes. National formats open participation to students across colleges, and we handle the outreach, registrations, screening and evaluation that come with that scale.",
  },
  {
    q: "Can you handle marketing?",
    a: "Yes. Branding, the event page, campaign content and outreach to student communities and other campuses are part of what we do.",
  },
  {
    q: "Can you arrange judges and mentors?",
    a: "Yes, subject to availability and the event's requirements. We bring in engineers, founders and technology professionals suited to your theme, and brief them before the event.",
  },
  {
    q: "Can our college provide the venue?",
    a: "Yes — for on-campus events the college usually provides the venue and infrastructure, and we plan the event around it.",
  },
  {
    q: "Can companies sponsor the event?",
    a: "Yes. Sponsorship can be built into the event model, whether that's a company bringing a problem statement, supporting prizes or providing tools and credits.",
  },
  {
    q: "Can the hackathon be completely online?",
    a: "Yes. The event structure — registration, mentoring, submissions, presentations and judging — can be designed entirely around online participation. Hybrid formats are possible too.",
  },
  {
    q: "How early should we contact you?",
    a: "For a campus hackathon, we suggest starting the conversation at least 6–8 weeks before your preferred dates. For a national-level event with industry judges and sponsors, 10–12 weeks gives everyone room. Shorter timelines can sometimes work — share your dates and we'll tell you honestly what's feasible.",
  },
] as const;
