/**
 * What the public site says when nothing has been published: the website's
 * copy as it was hardcoded before the CMS, copied verbatim from lib/content.ts,
 * lib/site.ts, the page metadata in app/(site)/** and the inline copy in
 * components/** (hero, sections, final CTA, footer). JSX whitespace is
 * collapsed and entities decoded exactly as React renders them.
 *
 * tests/cms.test.ts checks these against lib/content.ts and lib/site.ts and
 * validates every section against its own schema. Don't edit these to change
 * the live site; publish from the admin instead.
 *
 * Type-only imports, so Node's test runner can load this file directly.
 */
import type {
  ContactContent,
  ContactFormContent,
  HomepageContent,
  HowItWorksContent,
  SectionContent,
  SectionKey,
  SeoContent,
  ServicesContent,
  TeamContent,
} from "./schema";

const homepage: HomepageContent = {
  hero: {
    eyebrow: "Hackathon partner for colleges",
    headline: ["Bring a national-level", "hackathon to", "your campus."],
    lead: "Dev Syndicate helps colleges plan, promote, manage and execute professional hackathons with industry judges, mentors, technology partners and student communities.",
    primaryCta: { label: "Conduct a Hackathon", href: "/contact" },
    secondaryCta: { label: "See How It Works", href: "/how-it-works" },
  },
  trust: {
    line: "Built for colleges that want more than another campus event.",
    points: [
      "Industry-connected",
      "End-to-end execution",
      "Student-first participation",
      "Professional evaluation",
      "Scalable event formats",
    ],
  },
  sections: {
    problem: {
      label: "The problem",
      heading: "Running a great hackathon is harder than it looks.",
      description:
        "The idea is simple. The work behind it isn't — and it usually lands on a few faculty members who already have full-time jobs.",
    },
    whatWeDo: {
      label: "The partnership",
      heading: "One partner. The entire hackathon.",
      description:
        "We handle the work behind the hackathon so your college can focus on the students. Eight stages, one team accountable for all of them.",
    },
    why: {
      label: "Why Dev Syndicate",
      heading: "Not just another college event.",
      description:
        "A hackathon run well puts your institution in front of students, companies and other campuses. That only happens when it's designed for it.",
    },
    formats: {
      label: "Formats",
      heading: "What can we build together?",
      description:
        "Five starting points. Each one is shaped around your objective, audience and calendar before anything is fixed.",
    },
    ecosystem: {
      label: "The ecosystem",
      heading: "Connect students with the people building technology.",
      description:
        "A hackathon is only as good as the people around the builders. We bring the right people into the room, and make sure each one has a defined role.",
    },
    howItWorks: {
      label: "How it works",
      heading: "From conversation to hackathon.",
      description:
        "Five steps, starting with a short conversation about what your college wants to achieve. You always know what happens next, and who is doing it.",
    },
    responsibilities: {
      label: "Who does what",
      heading: "You bring the campus. We handle the execution.",
      description:
        "The division of work is agreed up front, so nobody on your side is surprised by what lands on their desk.",
    },
    experience: {
      label: "The experience",
      heading: "Built for the people doing the building.",
      description:
        "Students remember how an event felt to take part in. We design every step of the participant journey — from the first time they hear about it to the certificate in their inbox.",
    },
    outcomes: {
      label: "Outcomes",
      heading: "Built around measurable outcomes.",
      description:
        "Every hackathon ends with a report your institution can use. These are the numbers it covers — counted, not estimated.",
    },
    expectations: {
      label: "Working with us",
      heading: "What institutions can expect.",
      description: "",
    },
    faq: {
      label: "FAQ",
      heading: "Questions colleges ask us.",
    },
  },
  faq: {
    items: [
      {
        q: "How much does a hackathon cost?",
        a: "There is no fixed package, because no two hackathons are the same size. Cost depends on scale and duration, expected participant count, the event format, how much industry involvement you want, marketing requirements, the judges and mentors involved, and venue and logistics. Tell us what you have in mind and we'll put together a proposal with a clear scope.",
      },
      {
        q: "Can you organise a national-level hackathon?",
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
    ],
  },
  finalCta: {
    title: "Let's build something worth putting your campus behind.",
    body: "Tell us what you have in mind. We'll understand your requirements, recommend an event structure and get back to you for a quick discussion.",
  },
  footer: {
    tagline: "Building better hackathons. Connecting campuses with industry.",
  },
};

const services: ServicesContent = {
  hero: {
    eyebrow: "Services",
    title: "Everything a hackathon needs. One team accountable for it.",
    lead: "Eight stages from first idea to final report. Take the whole thing, or tell us which parts your college already has covered.",
    primaryCta: { label: "Conduct a Hackathon", href: "/contact" },
    secondaryCta: { label: "See How It Works", href: "/how-it-works" },
  },
  stagesIntro: {
    label: "What we handle",
    heading: "The full lifecycle, stage by stage.",
    description:
      "Each stage comes with defined deliverables, so you can see exactly what you're getting before the event begins.",
  },
  phaseIntros: {
    Plan: "Shape the event and make it worth showing up for.",
    "Build-up": "Fill it with the right participants, mentors and judges.",
    Live: "Run it smoothly, on the ground or online.",
    After: "Turn the event into something your institution can use.",
  },
  stages: [
    {
      n: "01",
      title: "Strategy",
      phase: "Plan",
      body: "We start with what your institution wants out of the event — then shape the theme, tracks, scale and format around it.",
      deliverables: ["Event objectives", "Format & scale", "Themes & tracks", "Master timeline"],
      visible: true,
    },
    {
      n: "02",
      title: "Branding",
      phase: "Plan",
      body: "A name, identity and event page that make the hackathon look like a serious technology event — with your college front and centre.",
      deliverables: ["Event identity", "Event website", "Social & print assets", "Certificate design"],
      visible: true,
    },
    {
      n: "03",
      title: "Marketing",
      phase: "Plan",
      body: "Outreach built to bring in serious builders: student communities, other campuses and developer networks — not just registration counts.",
      deliverables: ["Outreach plan", "Campaign content", "Community & campus outreach", "Partner promotion"],
      visible: true,
    },
    {
      n: "04",
      title: "Registrations",
      phase: "Build-up",
      body: "Registration, team formation, screening and every participant email in between, handled on a proper platform.",
      deliverables: ["Registration flow", "Team formation", "Shortlisting", "Participant communication"],
      visible: true,
    },
    {
      n: "05",
      title: "Mentors & Judges",
      phase: "Build-up",
      body: "We bring in engineers, founders and technology professionals to guide teams and evaluate their work, subject to availability.",
      deliverables: ["Mentor panel", "Judging panel", "Briefing & scheduling", "Problem statements"],
      visible: true,
    },
    {
      n: "06",
      title: "Evaluation",
      phase: "Build-up",
      body: "Rubrics, judging rounds and scoring designed before the event starts, so results are consistent and defensible.",
      deliverables: ["Judging criteria", "Round structure", "Scoring system", "Result review"],
      visible: true,
    },
    {
      n: "07",
      title: "Event Execution",
      phase: "Live",
      body: "On the day — or across the days — we run the schedule: check-in, mentoring rounds, submissions, presentations and results.",
      deliverables: ["Run-of-show", "On-ground / online ops", "Submission desk", "Results & prizes"],
      visible: true,
    },
    {
      n: "08",
      title: "Post-event Reporting",
      phase: "After",
      body: "A clear report on participation, projects and engagement, plus certificates for every participant — so the event keeps paying off.",
      deliverables: ["Event report", "Participation insights", "Certificates", "Project showcase"],
      visible: true,
    },
  ],
  formats: [
    {
      code: "CAMPUS",
      title: "Campus Hackathon",
      summary: "For a single college or institution.",
      scope: "Your students, your departments",
      goodFor: "Building an innovation culture on campus and giving students their first serious build experience.",
      visible: true,
    },
    {
      code: "NATIONAL",
      title: "National Hackathon",
      summary: "Open participation across colleges.",
      scope: "Students from campuses across India",
      goodFor: "Institutional visibility, a stronger applicant pool and putting your campus on the national tech map.",
      visible: true,
    },
    {
      code: "INDUSTRY",
      title: "Industry Challenge",
      summary: "A company brings a real-world problem for students to solve.",
      scope: "A partner company and selected participants",
      goodFor: "Industry interaction, placement conversations and problem statements that matter outside the classroom.",
      visible: true,
    },
    {
      code: "INNOVATION",
      title: "Innovation Challenge",
      summary: "Focused on emerging technologies and problem solving.",
      scope: "Theme-led — AI, sustainability, health, fintech and more",
      goodFor: "Innovation and incubation cells looking for early ideas worth taking further.",
      visible: true,
    },
    {
      code: "CUSTOM",
      title: "Custom Format",
      summary: "Designed around your institution's specific objective.",
      scope: "Whatever the objective needs",
      goodFor: "Department events, ideathons, multi-stage challenges or anything that doesn't fit a template.",
      visible: true,
    },
  ],
  partners: {
    label: "For companies",
    heading: "Put your team in front of students who build.",
    description:
      "Technology companies, startups and professionals can take part in the hackathons we run. Tell us how you'd like to be involved.",
    cta: { label: "Partner With Us", href: "/contact?type=sponsorship#enquiry" },
    options: [
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
    ],
  },
};

const howItWorks: HowItWorksContent = {
  hero: {
    eyebrow: "How it works",
    title: "From conversation to hackathon.",
    lead: "A clear process, an agreed scope and a written split of responsibilities — so everyone on your side knows exactly what's expected of them, and what isn't.",
    facts: [
      { label: "Process", value: "5 steps" },
      { label: "Your contact", value: "One, throughout" },
      { label: "Formats", value: "Online · Offline · Hybrid" },
      { label: "Ends with", value: "A post-event report" },
    ],
  },
  stepsIntro: {
    label: "The process",
    heading: "Five steps. Both sides know their part.",
    description:
      "Each step lists what we need from your college and what you get from us. Most of the work sits on our side.",
  },
  steps: [
    {
      title: "Tell us what you want to build",
      body: "Your college shares its objectives, audience, scale and preferred theme.",
      fromYou: "Objectives, rough dates, expected scale, a point of contact.",
      fromUs: "A first conversation and honest questions about what will work.",
    },
    {
      title: "We design the format",
      body: "We recommend the event structure, timeline and engagement model.",
      fromYou: "Feedback on the recommendation and internal approvals.",
      fromUs: "A proposed format, timeline, responsibilities and scope.",
    },
    {
      title: "We build the ecosystem",
      body: "Marketing, participants, judges, mentors, sponsors and operational infrastructure.",
      fromYou: "Venue and infrastructure confirmation, on-campus communication.",
      fromUs: "Branding, outreach, registrations, mentor and judge panels.",
    },
    {
      title: "We run the hackathon",
      body: "Registration, submissions, evaluation, communication and event operations.",
      fromYou: "Faculty coordination and access on the day.",
      fromUs: "The run-of-show, participant support, judging and results.",
    },
    {
      title: "You get the outcome",
      body: "Projects, participation insights, engagement metrics and a professional post-event report.",
      fromYou: "Nothing more — the report comes to you.",
      fromUs: "Report, certificates and a project showcase you can use.",
    },
  ],
  afterContact: {
    label: "Getting started",
    heading: "What happens after you get in touch.",
    description: "No commitment until you've seen a proposal and taken it through your internal approvals.",
    cta: { label: "Plan Your Hackathon", href: "/contact" },
    steps: [
      { title: "You send a request", body: "A short form about your institution, objectives and the event you have in mind." },
      { title: "We review it", body: "We read through the details and prepare questions before we talk." },
      { title: "A quick call", body: "We discuss goals, audience, dates and constraints — and what's realistic." },
      { title: "A written proposal", body: "Format, timeline, scope, responsibilities and cost, so you can take it for approval." },
    ],
  },
  timing: {
    label: "Timing",
    heading: "How early to start.",
    description:
      "Our recommended planning windows. Shorter timelines can sometimes work — share your dates and we'll tell you honestly what's feasible.",
    windows: [
      {
        label: "Campus hackathon",
        weeks: "6–8",
        body: "Enough time for branding, campus outreach, registrations and a mentor panel.",
      },
      {
        label: "National or industry-led",
        weeks: "10–12",
        body: "Room for wider outreach, industry judges, sponsors and multi-stage screening.",
      },
    ],
  },
};

const team: TeamContent = {
  label: "The team",
  heading: "Meet the people behind Dev Syndicate.",
  lead: "Dev Syndicate is led by its founder and co-founder. You'll know who you're working with from the first conversation.",
  members: [
    {
      name: "Shiven Kumar",
      role: "Founder",
      bio: "",
      linkedin: "https://www.linkedin.com/in/shiven-kumar-1549b327a/",
      visible: true,
      primaryContact: false,
    },
    {
      name: "Ashutosh Sharma",
      role: "Co-founder",
      bio: "",
      linkedin: "https://www.linkedin.com/in/ashutoshsharma1309/",
      visible: true,
      primaryContact: true,
    },
  ],
};

const contact: ContactContent = {
  email: "dsdevsyndicate@gmail.com",
  phone: { display: "+91 95073 64491", e164: "+919507364491" },
  primaryContact: {
    name: "Ashutosh Sharma",
    role: "Co-founder",
    phone: { display: "+91 99042 60348", e164: "+919904260348" },
    linkedin: "https://www.linkedin.com/in/ashutoshsharma1309/",
  },
  location: { city: "Bengaluru", region: "Karnataka", country: "India" },
  visibility: { showCompanyPhone: true, showPrimaryContactLinkedin: true },
};

const contactForm: ContactFormContent = {
  enabled: true,
  notificationRecipient: "",
  confirmationMessage:
    "Thank you. Your enquiry has reached the Dev Syndicate team. We'll review the details and get in touch to arrange a conversation.",
  enabledEnquiryTypes: ["campus", "national", "industry", "sponsorship", "general"],
  privacyHref: "/privacy",
};

const seo: SeoContent = {
  pages: {
    "/": {
      title: "Dev Syndicate | College Hackathons & Innovation Events",
      description:
        "Dev Syndicate helps colleges plan, promote and conduct professional hackathons, connecting student communities with mentors, judges and industry opportunities.",
      ogTitle: "",
      ogDescription: "",
    },
    "/about": {
      title: "About Dev Syndicate | Hackathon Partner for Colleges",
      description:
        "Meet Dev Syndicate, a Bengaluru-based hackathon partner for colleges led by Shiven Kumar and Ashutosh Sharma — why we exist, how we work and who we work with.",
      ogTitle: "",
      ogDescription: "",
    },
    "/how-it-works": {
      title: "How Hackathon Planning Works",
      description:
        "How a hackathon partnership with Dev Syndicate works — from the first conversation to the post-event report, and exactly what your college and our team each handle.",
      ogTitle: "",
      ogDescription: "",
    },
    "/services": {
      title: "Hackathon Management Services for Colleges",
      description:
        "End-to-end hackathon management for colleges: strategy, branding, outreach, registrations, mentors and judges, evaluation, execution and post-event reporting.",
      ogTitle: "",
      ogDescription: "",
    },
    "/contact": {
      title: "Contact Us to Plan a College Hackathon",
      description:
        "Planning a hackathon for your college? Send Dev Syndicate an enquiry, call Ashutosh Sharma on +91 99042 60348 or email the team to arrange a conversation.",
      ogTitle: "",
      ogDescription: "",
    },
    "/privacy": {
      title: "Privacy Policy",
      description: "How Dev Syndicate collects, uses and protects the information you share through this website.",
      ogTitle: "",
      ogDescription: "",
    },
    "/terms": {
      title: "Terms and Conditions",
      description: "The terms that apply when you use the Dev Syndicate website.",
      ogTitle: "",
      ogDescription: "",
    },
  },
};

export const DEFAULTS: { readonly [K in SectionKey]: SectionContent<K> } = {
  homepage,
  services,
  howItWorks,
  team,
  contact,
  contactForm,
  seo,
};

/** A fresh, mutable copy of a section's defaults (callers may edit the result). */
export function defaultsFor<K extends SectionKey>(key: K): SectionContent<K> {
  return structuredClone(DEFAULTS[key]);
}
