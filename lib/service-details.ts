/**
 * Content for the service detail pages (/services/<id>). Ids match `SERVICES` in lib/constants.ts.
 * Wording is deliberately general: no statistics, partner names or job guarantees. HVK should review it
 * and add specifics (course lists, batch dates, fees) as they are confirmed.
 */
export interface ServiceDetail {
  id: string;
  tagline: string;
  /** Gradient used by the poster, as [from, to] CSS colours. */
  accent: [string, string];
  /** Three short words shown as chips on the poster. */
  badges: [string, string, string];
  /** A few sentences shown on the service card under the one-line description. */
  cardSummary: string;
  /** Sample certificate shown on the page (training only). Programmes are the names offered in the preview. */
  certificate?: { programmes: string[] };
  /** One-line summary shown in search results and when the page is shared. */
  metaDescription: string;
  overview: string[];
  highlights: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  audience: string[];
  outcomes: string[];
  /** Optional topic groups (for example the learning tracks). */
  topics?: { title: string; items: string[] }[];
  faqs: { q: string; a: string }[];
  /** Photo from public/images and its description. */
  photo: { src: string; alt: string };
}

export const SERVICE_DETAILS: ServiceDetail[] = [
  {
    id: "training-certification",
    certificate: { programmes: ["Full-Stack Web Development", "Python Programming", "Data Science with Python"] },
    cardSummary: "Learn web development, Python and data science through short video lessons, practise with exercises, then prove your skills in a proctored online exam. Pass it and receive an HVK completion certificate.",
    tagline: "Job-ready skills taught by practitioners, proven with an online assessment and a certificate.",
    accent: ["#1d4ed8", "#0ea5e9"],
    badges: ["Hands-on", "Assessed online", "Certificate"],
    metaDescription: "Industry-focused training programmes from HVK Tech, with hands-on practice, an online assessment and a completion certificate.",
    overview: [
      "Technology changes quickly, and employers now look for people who can build, test and ship real work, not only recall theory. Our training programmes teach the tools teams use today, and every concept is followed by practice you do yourself.",
      "Each programme ends with an assessment on the HVK platform. Candidates who meet the pass criteria receive an HVK completion certificate they can add to a résumé or LinkedIn profile, alongside the projects they built.",
    ],
    highlights: [
      { title: "Learn by building", text: "Short video lessons, followed by exercises and mini-projects, so each topic ends with something that works." },
      { title: "Current tools and practices", text: "Modern frameworks, Git and GitHub workflows, and using AI coding assistants responsibly to work faster without skipping the fundamentals." },
      { title: "Learn at your own pace", text: "Lessons are available on demand. Watch in order, jump to the topic you need, or skip what you already know." },
      { title: "Online, timed assessment", text: "A proctored online exam checks what you actually learned. Results are published to your account." },
      { title: "Completion certificate", text: "Issued by HVK Tech when you meet the pass criteria, to show the skills you demonstrated." },
      { title: "Trainer support", text: "Ask questions and get feedback from trainers who have worked on real projects." },
    ],
    topics: [
      { title: "Web development", items: ["HTML5 and semantic markup", "JavaScript fundamentals to advanced", "React and Next.js", "Node.js and APIs"] },
      { title: "Programming and data", items: ["Python 3 for beginners", "Data analysis with Python", "Data science foundations", "SQL and databases"] },
      { title: "Working in a modern team", items: ["Git and GitHub", "AI-assisted development", "Testing and debugging", "Cloud and deployment basics"] },
    ],
    steps: [
      { title: "Register", text: "Create your free account and complete your profile." },
      { title: "Learn", text: "Watch the lessons in the learning section in any order, at your own pace." },
      { title: "Practise", text: "Build the exercises and projects that go with each topic." },
      { title: "Assess", text: "Take the online exam when you are ready." },
      { title: "Certify", text: "Receive your result and certificate once you meet the pass criteria." },
    ],
    audience: ["Students and fresh graduates", "Career switchers moving into technology", "Working professionals who want to upskill", "Colleges that want a ready curriculum for their students"],
    outcomes: ["Practical skills you can show in an interview", "Portfolio projects on GitHub", "A score from a proctored assessment", "An HVK completion certificate"],
    faqs: [
      { q: "Do I need any experience?", a: "No. The beginner tracks start from the basics. If you already know a topic you can skip ahead and use the exam to check your level." },
      { q: "How is the assessment held?", a: "Online, on the HVK platform, with a fixed duration and question set. Your answers are saved as you go, and the exam screen uses monitoring to keep it fair." },
      { q: "What do I get at the end?", a: "Your exam result and, if you meet the pass criteria, an HVK completion certificate. Share it together with your projects, since employers value the work behind it." },
      { q: "Can I study alongside college or a job?", a: "Yes. Lessons are on demand, so you can fit them around your schedule." },
    ],
    photo: { src: "/images/about/team-2.jpg", alt: "A trainer explaining code on a screen to a learner" },
  },
  {
    id: "internship-programs",
    cardSummary: "Join a small team on a live project, work with Git and pull requests, and get regular code reviews from a mentor. You finish with a reviewed project, a project report and a completion letter.",
    tagline: "Work on live projects with mentor reviews, and graduate with experience you can talk about.",
    accent: ["#6d28d9", "#2563eb"],
    badges: ["Live projects", "Mentored", "Real workflow"],
    metaDescription: "HVK Tech internship programmes: real-world projects, mentor code reviews and a team workflow, ending with a project report.",
    overview: [
      "Most entry-level roles ask for experience that classroom learning alone does not give. Our internships put you on a real project, with a team workflow, deadlines and reviews, so you learn how software is planned, built and delivered.",
      "You are paired with a mentor who reviews your work, answers your questions and helps you improve week by week. Duration and timing are agreed per batch; ask us for the current schedule.",
    ],
    highlights: [
      { title: "Live project work", text: "Build features for a real brief, not toy exercises, and see your work used." },
      { title: "Mentor reviews", text: "Regular code reviews and feedback from an experienced developer." },
      { title: "Team workflow", text: "Tasks on a board, Git branches, pull requests and stand-ups, the way product teams work." },
      { title: "Modern stack", text: "Projects use current web and data tools, with room to try AI-assisted development under guidance." },
      { title: "Project report and letter", text: "A written summary of what you built and your role, for your résumé and interviews." },
      { title: "Flexible format", text: "Online batches that fit around college or work." },
    ],
    steps: [
      { title: "Apply", text: "Register and tell us your interests and current skills." },
      { title: "Skill check", text: "A short assessment places you in the right project and level." },
      { title: "Kick-off", text: "Meet your mentor and team, and agree goals for the internship." },
      { title: "Build", text: "Work in short cycles with regular reviews and demos." },
      { title: "Present", text: "Show your project, receive feedback and your completion documents." },
    ],
    audience: ["Final-year and pre-final-year students", "Recent graduates building a first portfolio", "Self-taught developers who want team experience"],
    outcomes: ["Experience on a real project", "A reviewed codebase on your GitHub", "Confidence working in a team with Git", "A project report and completion letter"],
    faqs: [
      { q: "Is the internship paid?", a: "Internships focus on learning and experience. Whether a particular batch carries a stipend is confirmed when that batch is announced." },
      { q: "How long is it?", a: "Duration is set per batch. Contact us for the current intake and timing." },
      { q: "Do I need to be an expert?", a: "No, but you should know the basics of the track you apply for. The skill check helps us place you properly." },
      { q: "Will I get a certificate?", a: "You receive a completion letter and a project report when you finish the internship." },
    ],
    photo: { src: "/images/about/team-1.jpg", alt: "A team of interns working on laptops at a shared table" },
  },
  {
    id: "placement-assistance",
    cardSummary: "Get your résumé and portfolio reviewed, practise with mock technical and HR interviews, and have your profile shared with companies that are hiring. We prepare and introduce; the employer decides.",
    tagline: "Get interview-ready and connected to hiring companies, with honest, practical support.",
    accent: ["#047857", "#0ea5e9"],
    badges: ["Résumé", "Mock interviews", "Hiring connect"],
    metaDescription: "Placement assistance from HVK Tech: résumé reviews, mock interviews, aptitude and technical preparation, and introductions to hiring companies.",
    overview: [
      "A good profile gets you shortlisted; a good interview gets you the offer. Placement assistance helps with both: we sharpen your résumé and portfolio, practise interviews with you, and introduce your profile to companies that are hiring.",
      "We can't promise a job, because hiring decisions are the company's. What we do promise is focused preparation and real introductions, so you give yourself the best chance.",
    ],
    highlights: [
      { title: "Résumé and profile review", text: "A clear, honest résumé, plus LinkedIn and GitHub profiles that show your work." },
      { title: "Mock interviews", text: "Technical and HR rounds with feedback on answers, communication and confidence." },
      { title: "Aptitude and coding practice", text: "Practice sets for the screening tests companies commonly use." },
      { title: "Company introductions", text: "Your profile shared with companies that are hiring for roles that match your skills." },
      { title: "Interview scheduling help", text: "Reminders and guidance so you arrive prepared." },
      { title: "Offer guidance", text: "Advice on comparing offers and starting well in a new role." },
    ],
    steps: [
      { title: "Profile review", text: "We review your résumé, projects and exam results." },
      { title: "Prepare", text: "Practice aptitude, technical and HR rounds with feedback." },
      { title: "Match", text: "Your profile goes forward for openings that fit your skills." },
      { title: "Interview", text: "Attend interviews with preparation notes from your mentor." },
      { title: "Follow up", text: "We help you with feedback, next steps and offer questions." },
    ],
    audience: ["Final-year students and recent graduates", "Candidates who completed HVK training or an internship", "Professionals changing roles or domains"],
    outcomes: ["A stronger résumé and portfolio", "Interview practice and feedback", "Introductions to hiring companies", "Clear next steps after each interview"],
    faqs: [
      { q: "Do you guarantee a job?", a: "No. We support your preparation and introduce your profile to hiring companies, but the hiring decision always rests with the employer." },
      { q: "Is it only for HVK trainees?", a: "It is designed for candidates who have completed our training or internship, since their results and projects make the strongest profile. Contact us if you are unsure." },
      { q: "Which roles are covered?", a: "Mainly software, web and data roles. Available openings change, so we match them to your skills at the time." },
    ],
    photo: { src: "/images/hero/hero-2.jpg", alt: "Two colleagues celebrating good news at a desk" },
  },
  {
    id: "career-guidance",
    cardSummary: "Talk one-to-one with a mentor about where you are and where you want to go. Leave with a skill-gap assessment and a step-by-step roadmap for roles in web, data, testing or cloud.",
    tagline: "One-to-one mentorship to choose a direction, close skill gaps and plan the next step.",
    accent: ["#b45309", "#db2777"],
    badges: ["1-to-1", "Roadmap", "Skill gaps"],
    metaDescription: "Career guidance from HVK Tech: one-to-one mentoring, a skill-gap assessment and a personal roadmap for technology careers.",
    overview: [
      "With so many roles and tools, it is hard to know what to learn first. Career guidance gives you a mentor to talk it through: where you are now, where you want to be, and the shortest sensible path between the two.",
      "We look at today's job market, including how AI tools are changing everyday work in software and data, and help you build the skills that stay useful.",
    ],
    highlights: [
      { title: "One-to-one sessions", text: "Private conversations with an experienced mentor, focused on your situation." },
      { title: "Skill-gap assessment", text: "A clear picture of your strengths and what to learn next, using the HVK exam platform where useful." },
      { title: "Personal roadmap", text: "A step-by-step plan with courses, projects and milestones, adjusted as you progress." },
      { title: "Role selection", text: "Compare paths such as web developer, data analyst, tester or cloud and DevOps, and choose with facts." },
      { title: "Portfolio guidance", text: "What to build and how to present it so that it supports the role you want." },
      { title: "Ongoing check-ins", text: "Follow-ups to keep you on track and update the plan." },
    ],
    steps: [
      { title: "Discuss", text: "Share your background, interests and goals." },
      { title: "Assess", text: "Find your current level and the gaps that matter." },
      { title: "Plan", text: "Agree a roadmap with clear milestones." },
      { title: "Act", text: "Learn and build; use training, internships and workshops where they help." },
      { title: "Review", text: "Check progress and adjust the plan." },
    ],
    audience: ["Students choosing a stream or specialisation", "Graduates deciding on a first role", "Professionals moving into technology"],
    outcomes: ["A clear career direction", "A prioritised learning plan", "A portfolio strategy", "Confidence about the next step"],
    faqs: [
      { q: "Is it only for beginners?", a: "No. Beginners get help choosing a direction; experienced people get help with a switch, a promotion or a new skill area." },
      { q: "How are the sessions held?", a: "Online or by phone, at times agreed with your mentor." },
      { q: "Do I need to be an HVK trainee?", a: "No, but combining guidance with training and assessments gives your mentor the most to work with." },
    ],
    photo: { src: "/images/hero/hero-1.jpg", alt: "A mentor and two learners talking at a table with laptops" },
  },
  {
    id: "workshops-events",
    cardSummary: "Join hands-on workshops and talks on Git, web apps, AI-assisted coding, résumés and interviews. Build something small, meet mentors and peers, and hear how real teams work.",
    tagline: "Hands-on workshops and talks with industry practitioners, and a network to grow with.",
    accent: ["#be185d", "#7c3aed"],
    badges: ["Hands-on", "Experts", "Networking"],
    metaDescription: "Workshops and events from HVK Tech: practical sessions with industry experts, hackathons and networking for students and professionals.",
    overview: [
      "Workshops are the fastest way to learn one useful skill in a day. Our sessions are practical: you code along, build something and leave with notes and a working example, guided by people who use the tools at work.",
      "Events also bring learners, trainers and companies together, which is how many people hear about their first opportunity.",
    ],
    highlights: [
      { title: "Practical sessions", text: "Code-along workshops, for example Git and GitHub, building a web app, or using AI tools to write and test code." },
      { title: "Industry speakers", text: "Talks and Q&A with practitioners about how work really happens on teams." },
      { title: "Career sessions", text: "Résumé clinics, interview preparation and portfolio reviews." },
      { title: "Hackathons and challenges", text: "Team events where you build a small product in a short time." },
      { title: "Networking", text: "Meet peers, mentors and hiring teams, in person or online." },
      { title: "Campus workshops", text: "We can run sessions at your college; see Custom Solutions." },
    ],
    steps: [
      { title: "Browse", text: "See upcoming sessions and events on the site and our social channels." },
      { title: "Register", text: "Reserve your seat; details and any prerequisites are shared by email." },
      { title: "Attend", text: "Join live, take part and ask questions." },
      { title: "Keep going", text: "Receive follow-up material and suggestions for what to learn next." },
    ],
    audience: ["Students and recent graduates", "Developers who want to learn one tool quickly", "Colleges and communities that host events"],
    outcomes: ["A new skill or tool in a day", "A small project to show", "Contacts in the industry", "Ideas for your next learning step"],
    faqs: [
      { q: "Are workshops free?", a: "It varies by event. Fees, if any, are listed when the event is announced." },
      { q: "Will I get a certificate?", a: "Participation certificates are available for selected workshops and events; the event page will say so." },
      { q: "Can you run one for our college or group?", a: "Yes. Choose Custom Solutions or contact us with your topic and audience size." },
    ],
    photo: { src: "/images/hero/hero-3.jpg", alt: "A group of people working together at a long table" },
  },
  {
    id: "custom-solutions",
    cardSummary: "Colleges and organisations can get a programme built around their syllabus: trainer-led batches, online proctored assessments on the HVK platform, and progress reports for faculty and management.",
    tagline: "Training and assessment designed around your college or organisation.",
    accent: ["#0f766e", "#1d4ed8"],
    badges: ["Tailored", "On-campus or online", "Reports"],
    metaDescription: "Custom training and assessment solutions from HVK Tech for colleges and organisations: tailored curriculum, trainers and exam reports.",
    overview: [
      "Every institution has different students, timetables and goals. Custom Solutions lets us build a programme around yours: the topics, the depth, the schedule and the way progress is measured.",
      "We combine trainer-led sessions with the HVK learning and exam platform, so you get both teaching and measurable results.",
    ],
    highlights: [
      { title: "Tailored curriculum", text: "Choose topics and depth to match your syllabus, your industry or your hiring needs." },
      { title: "Flexible delivery", text: "On campus, online or blended, in batches that suit your timetable." },
      { title: "Online assessments", text: "Timed, proctored exams on the HVK platform, with question banks built for your topics." },
      { title: "Progress reports", text: "Scores and completion data per batch and per student, for faculty and management." },
      { title: "Certificates", text: "HVK completion certificates for students who meet the criteria you agree with us." },
      { title: "Placement and internship links", text: "Optional pathways into our internships and placement support." },
    ],
    steps: [
      { title: "Discuss", text: "Share your goals, audience, timeline and constraints." },
      { title: "Design", text: "We propose a curriculum, schedule and assessment plan." },
      { title: "Deliver", text: "Trainers run the sessions, on campus or online." },
      { title: "Assess", text: "Students take proctored exams on the HVK platform." },
      { title: "Review", text: "You receive reports, and we agree improvements for the next batch." },
    ],
    audience: ["Colleges and universities", "Training institutes", "Companies upskilling or onboarding teams"],
    outcomes: ["A programme that fits your syllabus or role needs", "Measurable results per student", "Faculty time saved on assessment", "A repeatable plan for future batches"],
    faqs: [
      { q: "How do we get started?", a: "Contact us with your topic, audience size and preferred dates. We reply with a proposal." },
      { q: "Can you assess our existing students only?", a: "Yes. We can run assessments alone, using your question topics, and provide result reports." },
      { q: "Do you work with small groups?", a: "Yes. Batch sizes are agreed with you." },
    ],
    photo: { src: "/images/about/office.jpg", alt: "A bright, modern office corridor" },
  },
];

export const getServiceDetail = (id: string): ServiceDetail | undefined => SERVICE_DETAILS.find((s) => s.id === id);
