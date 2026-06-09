/**
 * interviewGenerator.js
 * AI Interview Question Generator Service
 * Generates personalized interview questions based on resume analysis data
 */

// ─── Question Banks ────────────────────────────────────────────────────────────

const HR_QUESTIONS = [
  { id: 'hr_1', question: 'Tell me about yourself and your career journey so far.', category: 'HR', level: 'Beginner', optimalKeywords: ['experience', 'background', 'skills', 'goal', 'journey'], sampleAnswer: 'Summarize your education, key experiences, and what brought you to this role. Focus on achievements and how they align with the position.' },
  { id: 'hr_2', question: 'Why are you interested in this role and our company?', category: 'HR', level: 'Beginner', optimalKeywords: ['company', 'mission', 'culture', 'growth', 'align', 'values'], sampleAnswer: 'Research the company, mention specific aspects like culture, mission, or products, and connect them to your own career goals.' },
  { id: 'hr_3', question: 'What are your greatest strengths?', category: 'HR', level: 'Beginner', optimalKeywords: ['strength', 'skills', 'example', 'achieve', 'leadership', 'communication'], sampleAnswer: 'Choose 2-3 genuine strengths supported by concrete examples. Tie them directly to skills needed for the role.' },
  { id: 'hr_4', question: 'Where do you see yourself in 5 years?', category: 'HR', level: 'Intermediate', optimalKeywords: ['growth', 'leadership', 'expertise', 'contribute', 'develop', 'long term'], sampleAnswer: 'Show ambition balanced with realism. Mention growing expertise in a domain, taking on leadership, and contributing to company success.' },
  { id: 'hr_5', question: 'What is your biggest weakness and how are you working on it?', category: 'HR', level: 'Intermediate', optimalKeywords: ['weakness', 'improve', 'learning', 'action', 'feedback', 'growth'], sampleAnswer: "Choose a real weakness that isn't critical to the role. Show self-awareness and concrete steps you're taking to improve." },
  { id: 'hr_6', question: 'Describe a time you had a conflict with a coworker. How did you resolve it?', category: 'HR', level: 'Intermediate', optimalKeywords: ['communication', 'resolve', 'listen', 'empathy', 'compromise', 'outcome'], sampleAnswer: 'Use the STAR method. Focus on how you communicated calmly, listened actively, found common ground, and reached a positive resolution.' },
  { id: 'hr_7', question: 'Why are you leaving your current job?', category: 'HR', level: 'Beginner', optimalKeywords: ['growth', 'challenge', 'opportunity', 'learn', 'positive'], sampleAnswer: 'Stay positive. Focus on seeking new challenges, growth opportunities, or a better skill alignment — never speak negatively about current employer.' },
  { id: 'hr_8', question: 'How do you handle working under pressure or tight deadlines?', category: 'HR', level: 'Intermediate', optimalKeywords: ['prioritize', 'organize', 'calm', 'focus', 'deadline', 'plan'], sampleAnswer: 'Describe your system: breaking work into tasks, prioritizing by impact, communicating proactively, and staying methodical rather than reactive.' },
  { id: 'hr_9', question: 'What motivates you in your work?', category: 'HR', level: 'Beginner', optimalKeywords: ['challenge', 'impact', 'learning', 'team', 'solve', 'create'], sampleAnswer: 'Be authentic. Connect your motivations (solving hard problems, seeing impact, learning) to what the role specifically offers.' },
  { id: 'hr_10', question: 'How do you handle receiving constructive criticism?', category: 'HR', level: 'Beginner', optimalKeywords: ['feedback', 'open', 'improve', 'implement', 'grateful', 'learn'], sampleAnswer: 'Show you welcome feedback, share a specific example, and describe how you used it to improve your performance.' },
];

const BEHAVIORAL_QUESTIONS = [
  { id: 'beh_1', question: 'Tell me about a time you demonstrated leadership.', category: 'Behavioral', level: 'Intermediate', optimalKeywords: ['led', 'team', 'initiative', 'decision', 'outcome', 'goal'], sampleAnswer: 'Use STAR: describe a team challenge, the leadership action you took (rallying the team, making key decisions), and the measurable positive outcome.' },
  { id: 'beh_2', question: 'Describe a situation where you had to learn something new quickly.', category: 'Behavioral', level: 'Intermediate', optimalKeywords: ['learn', 'adapt', 'research', 'apply', 'fast', 'challenge'], sampleAnswer: 'Describe the skill gap, how you structured your rapid learning (resources, mentors, hands-on practice), and how you successfully applied it.' },
  { id: 'beh_3', question: 'Give an example of a time you failed. What did you learn?', category: 'Behavioral', level: 'Advanced', optimalKeywords: ['failure', 'lesson', 'recover', 'improve', 'accountability', 'growth'], sampleAnswer: 'Choose a genuine failure. Be clear about what went wrong, show you owned it, and detail the specific lesson that changed how you work.' },
  { id: 'beh_4', question: 'Tell me about a time you worked successfully in a team.', category: 'Behavioral', level: 'Beginner', optimalKeywords: ['collaborate', 'team', 'communication', 'role', 'outcome', 'support'], sampleAnswer: 'Describe your specific role, how you collaborated and communicated, and the successful outcome the team achieved together.' },
  { id: 'beh_5', question: 'Describe a time when you had to manage multiple priorities simultaneously.', category: 'Behavioral', level: 'Intermediate', optimalKeywords: ['prioritize', 'organize', 'deadline', 'manage', 'balance', 'plan'], sampleAnswer: 'Explain how you assessed urgency vs. importance, communicated with stakeholders, and systematically completed tasks without dropping quality.' },
  { id: 'beh_6', question: 'Tell me about an achievement you are most proud of professionally.', category: 'Behavioral', level: 'Beginner', optimalKeywords: ['achievement', 'impact', 'result', 'challenge', 'overcome', 'success'], sampleAnswer: 'Choose an impactful achievement with measurable results. Explain the challenge, your actions, and the concrete outcome it produced.' },
  { id: 'beh_7', question: 'Describe a time you had to persuade someone to see your point of view.', category: 'Behavioral', level: 'Advanced', optimalKeywords: ['communication', 'evidence', 'listen', 'influence', 'respect', 'outcome'], sampleAnswer: 'Use STAR: present the situation, how you gathered evidence, approached the person with empathy, listened to their concerns, and won them over.' },
  { id: 'beh_8', question: 'Tell me about a time you received difficult feedback and how you responded.', category: 'Behavioral', level: 'Intermediate', optimalKeywords: ['feedback', 'open', 'implement', 'action', 'growth', 'mature'], sampleAnswer: 'Show emotional maturity: how you separated emotion from information, asked clarifying questions, created an action plan, and showed follow-through.' },
  { id: 'beh_9', question: 'Give an example of a time you went above and beyond your job requirements.', category: 'Behavioral', level: 'Intermediate', optimalKeywords: ['initiative', 'extra', 'impact', 'proactive', 'value', 'ownership'], sampleAnswer: 'Describe a situation where you identified an opportunity, took ownership beyond your role, and delivered meaningful additional value.' },
  { id: 'beh_10', question: 'Tell me about a time you adapted to a major unexpected change at work.', category: 'Behavioral', level: 'Advanced', optimalKeywords: ['adapt', 'flexible', 'positive', 'pivot', 'resilience', 'outcome'], sampleAnswer: 'Show resilience: how you quickly assessed the change, reframed it positively, adjusted your plan, and helped your team adapt too.' },
];

const PROBLEM_SOLVING_QUESTIONS = [
  { id: 'ps_1', question: 'How would you approach debugging a critical production issue you have never seen before?', category: 'Problem Solving', level: 'Intermediate', optimalKeywords: ['logs', 'reproduce', 'isolate', 'hypothesize', 'test', 'rollback'], sampleAnswer: 'Triage severity first, check logs and alerts, reproduce in a staging environment, isolate the component, form hypotheses, test iteratively, and have a rollback plan.' },
  { id: 'ps_2', question: 'Describe your approach to breaking down a complex problem into smaller, manageable parts.', category: 'Problem Solving', level: 'Beginner', optimalKeywords: ['decompose', 'steps', 'prioritize', 'understand', 'sub-problems', 'structure'], sampleAnswer: 'Start by fully understanding the problem, define the output required, break it into logical sub-problems, solve each independently, then integrate and validate.' },
  { id: 'ps_3', question: 'How do you decide between multiple valid solutions to a technical problem?', category: 'Problem Solving', level: 'Advanced', optimalKeywords: ['tradeoff', 'criteria', 'performance', 'maintainability', 'cost', 'evaluate'], sampleAnswer: 'Define evaluation criteria (performance, maintainability, cost, scalability), analyze each solution against them, consider future impact, and prototype the top candidate.' },
  { id: 'ps_4', question: 'Walk me through how you would estimate the time required for a new complex feature.', category: 'Problem Solving', level: 'Intermediate', optimalKeywords: ['breakdown', 'risk', 'buffer', 'estimate', 'complexity', 'dependencies'], sampleAnswer: 'Break into smaller tasks, estimate each independently, identify dependencies and blockers, add buffer for unknowns (20-30%), and communicate assumptions clearly.' },
  { id: 'ps_5', question: 'How do you validate that your solution to a problem is the correct one?', category: 'Problem Solving', level: 'Intermediate', optimalKeywords: ['test', 'validate', 'edge case', 'review', 'measure', 'monitor'], sampleAnswer: 'Define success metrics upfront, write unit and integration tests, peer review, deploy incrementally, monitor metrics post-deploy, and verify against the original problem statement.' },
];

// ─── Skill-Based Technical Question Map ───────────────────────────────────────

const SKILL_TECH_QUESTIONS = {
  react: [
    { id: 'tech_react_1', question: 'Explain the Virtual DOM in React and how reconciliation works.', category: 'Technical', level: 'Intermediate', optimalKeywords: ['virtual dom', 'reconciliation', 'diffing', 'fiber', 'render'], sampleAnswer: "React's Virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React creates a new VDom tree, diffs it with the previous using its reconciliation algorithm (Fiber), and applies only the necessary real DOM updates." },
    { id: 'tech_react_2', question: 'What are React Hooks? Explain useState and useEffect with use cases.', category: 'Technical', level: 'Beginner', optimalKeywords: ['hook', 'usestate', 'useeffect', 'side effects', 'functional', 'state'], sampleAnswer: 'Hooks allow functional components to use state and lifecycle features. useState manages local state; useEffect handles side effects like data fetching, subscriptions, and DOM manipulation on mount/update/unmount.' },
    { id: 'tech_react_3', question: 'How do you optimize rendering performance in a large React app?', category: 'Technical', level: 'Advanced', optimalKeywords: ['memo', 'usememo', 'usecallback', 'lazy', 'code splitting', 'virtualize'], sampleAnswer: 'Use React.memo to prevent unnecessary re-renders, useMemo and useCallback to memoize expensive values and functions, React.lazy for code splitting, and virtualization (react-window) for long lists.' },
  ],
  javascript: [
    { id: 'tech_js_1', question: 'Explain closures in JavaScript with a practical example.', category: 'Technical', level: 'Intermediate', optimalKeywords: ['scope', 'lexical', 'outer', 'inner', 'function', 'enclosure'], sampleAnswer: "A closure is when an inner function retains access to its outer function's variables even after the outer function returns. Classic use: factory functions, module patterns, and memoization." },
    { id: 'tech_js_2', question: 'What is the event loop in JavaScript? How do async operations work?', category: 'Technical', level: 'Advanced', optimalKeywords: ['call stack', 'event loop', 'callback queue', 'microtask', 'promise', 'async'], sampleAnswer: "JS is single-threaded. The event loop continuously checks if the call stack is empty, then processes the microtask queue (Promises) first, followed by the macrotask queue (setTimeout). This enables non-blocking async behavior." },
    { id: 'tech_js_3', question: 'Explain the difference between == and === in JavaScript.', category: 'Technical', level: 'Beginner', optimalKeywords: ['type coercion', 'strict equality', 'loose equality', 'convert'], sampleAnswer: "== performs type coercion (e.g., '5' == 5 is true) while === checks both value and type strictly ('5' === 5 is false). Always prefer === to avoid unexpected bugs." },
  ],
  python: [
    { id: 'tech_py_1', question: 'Explain list comprehensions vs generator expressions in Python. When to use each?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['list comprehension', 'generator', 'memory', 'lazy', 'iteration', 'eager'], sampleAnswer: 'List comprehensions create an entire list in memory (eager evaluation). Generator expressions are lazy — they yield items one by one, using far less memory for large datasets. Use generators for big datasets or infinite sequences.' },
    { id: 'tech_py_2', question: 'What are Python decorators and how do you implement one?', category: 'Technical', level: 'Advanced', optimalKeywords: ['wrapper', 'decorator', 'higher order', 'functools', 'wraps', '@'], sampleAnswer: 'A decorator is a higher-order function that wraps another function to add behavior. Implement using @functools.wraps to preserve metadata. Common uses: logging, authentication, caching.' },
    { id: 'tech_py_3', question: 'How does Python manage memory? Explain garbage collection.', category: 'Technical', level: 'Advanced', optimalKeywords: ['reference counting', 'garbage collector', 'cyclic', 'gc module', 'memory'], sampleAnswer: "Python uses reference counting as its primary memory management. The cyclic garbage collector (gc module) handles objects in reference cycles that reference counting can't free." },
  ],
  java: [
    { id: 'tech_java_1', question: 'Explain the four pillars of Object-Oriented Programming in Java.', category: 'Technical', level: 'Beginner', optimalKeywords: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'class'], sampleAnswer: 'Encapsulation (data hiding via access modifiers), Inheritance (extending classes), Polymorphism (same interface, different behavior), and Abstraction (hiding implementation details via abstract classes/interfaces).' },
    { id: 'tech_java_2', question: 'What is the difference between ArrayList and LinkedList in Java?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['array', 'linked', 'access', 'insertion', 'random access', 'node'], sampleAnswer: 'ArrayList uses a dynamic array — O(1) random access but O(n) insertions/deletions mid-list. LinkedList uses doubly-linked nodes — O(1) insert/delete at ends but O(n) random access. Choose based on your access pattern.' },
  ],
  sql: [
    { id: 'tech_sql_1', question: 'What is the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN?', category: 'Technical', level: 'Beginner', optimalKeywords: ['inner', 'left', 'right', 'outer', 'null', 'match'], sampleAnswer: 'INNER JOIN returns only matching rows. LEFT JOIN returns all left table rows + matches (NULLs for no match). FULL OUTER JOIN returns all rows from both tables with NULLs where there are no matches.' },
    { id: 'tech_sql_2', question: 'Explain SQL indexes and when you should/should not use them.', category: 'Technical', level: 'Intermediate', optimalKeywords: ['index', 'b-tree', 'read', 'write', 'performance', 'cardinality'], sampleAnswer: 'Indexes speed up read queries using B-tree structures. Use them on frequently queried/joined columns with high cardinality. Avoid on small tables, frequently updated columns, or low-cardinality fields — they slow writes.' },
  ],
  nodejs: [
    { id: 'tech_node_1', question: 'How does Node.js handle concurrency if it is single-threaded?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['event loop', 'non-blocking', 'async', 'libuv', 'callback', 'io'], sampleAnswer: "Node.js uses a non-blocking I/O model via libuv's thread pool and the event loop. Long I/O operations (disk, network) run asynchronously in the background, allowing the single JS thread to remain responsive." },
  ],
  firebase: [
    { id: 'tech_fb_1', question: 'How do you structure Firestore security rules for a multi-user application?', category: 'Technical', level: 'Advanced', optimalKeywords: ['security rules', 'auth', 'uid', 'allow', 'request.auth', 'match'], sampleAnswer: "Use `match /collection/{docId}` blocks with `allow read, write: if request.auth != null && request.auth.uid == resource.data.userId` to restrict access. Validate data fields and use custom functions for complex rules." },
  ],
  'machine learning': [
    { id: 'tech_ml_1', question: 'Explain the bias-variance tradeoff in machine learning models.', category: 'Technical', level: 'Advanced', optimalKeywords: ['bias', 'variance', 'overfitting', 'underfitting', 'tradeoff', 'generalization'], sampleAnswer: 'High bias = underfitting (model too simple, misses patterns). High variance = overfitting (model memorizes training noise). The goal is to find the sweet spot via cross-validation, regularization, and sufficient training data.' },
    { id: 'tech_ml_2', question: 'What is the difference between supervised, unsupervised, and reinforcement learning?', category: 'Technical', level: 'Beginner', optimalKeywords: ['labeled', 'unlabeled', 'reward', 'agent', 'clustering', 'classification'], sampleAnswer: 'Supervised: learns from labeled data (classification, regression). Unsupervised: finds hidden patterns in unlabeled data (clustering, dimensionality reduction). Reinforcement: learns optimal actions via trial and reward signals.' },
  ],
  docker: [
    { id: 'tech_docker_1', question: 'Explain Docker containers vs virtual machines. What are the key differences?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['container', 'vm', 'kernel', 'lightweight', 'isolation', 'image'], sampleAnswer: 'Containers share the host OS kernel and are lightweight (MB, seconds to start). VMs include a full OS guest (GB, minutes to boot). Containers offer better density and speed; VMs offer stronger isolation.' },
  ],
  kubernetes: [
    { id: 'tech_k8s_1', question: 'What is a Kubernetes Pod, and how does it differ from a container?', category: 'Technical', level: 'Advanced', optimalKeywords: ['pod', 'container', 'sidecar', 'namespace', 'co-located', 'deploy'], sampleAnswer: 'A Pod is the smallest deployable unit in Kubernetes, hosting one or more tightly coupled containers that share network and storage. Unlike a bare container, Pods are managed by the Kubernetes scheduler and controllers.' },
  ],
  aws: [
    { id: 'tech_aws_1', question: 'Explain the difference between AWS EC2, Lambda, and ECS. When do you use each?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['ec2', 'lambda', 'ecs', 'serverless', 'container', 'compute'], sampleAnswer: 'EC2: full VM control, long-running workloads. Lambda: serverless event-driven functions, short-lived tasks with auto-scaling. ECS: managed Docker container orchestration. Choose based on duration, control needs, and cost profile.' },
  ],
  typescript: [
    { id: 'tech_ts_1', question: 'What are TypeScript generics and why are they useful?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['generic', 'type parameter', 'reusable', 'type safe', 'constraint', 'T'], sampleAnswer: 'Generics allow you to write reusable, type-safe functions and classes that work with any type. Example: `function identity<T>(arg: T): T` works for any type while preserving type information throughout.' },
  ],
};

// ─── Project-Based Question Templates ────────────────────────────────────────

const PROJECT_QUESTIONS_TEMPLATES = [
  { id: 'proj_1', question: 'Walk me through the most technically challenging project on your resume.', category: 'Project', level: 'Advanced', optimalKeywords: ['challenge', 'decision', 'architecture', 'result', 'learn', 'overcome'], sampleAnswer: 'Pick your most complex project. Describe the problem it solved, your role, a key technical challenge you faced, the decision you made to solve it, and what you learned.' },
  { id: 'proj_2', question: 'What technology stack did you choose for your key project and why?', category: 'Project', level: 'Intermediate', optimalKeywords: ['stack', 'tradeoff', 'choice', 'scalability', 'performance', 'reason'], sampleAnswer: 'Explain the stack, justify each choice with tradeoffs (e.g., chosen for team familiarity, performance, ecosystem), and mention what you might choose differently now.' },
  { id: 'proj_3', question: 'How did you ensure quality and reliability in your project?', category: 'Project', level: 'Intermediate', optimalKeywords: ['testing', 'ci/cd', 'code review', 'error handling', 'monitoring', 'coverage'], sampleAnswer: 'Describe testing strategies (unit, integration, E2E), CI/CD pipelines, error monitoring (Sentry, logging), code reviews, and any SLAs or uptime targets you maintained.' },
  { id: 'proj_4', question: 'If you could rebuild your resume project from scratch, what would you do differently?', category: 'Project', level: 'Advanced', optimalKeywords: ['improve', 'architecture', 'scale', 'learn', 'refactor', 'mistake'], sampleAnswer: "Show growth mindset. Describe what you'd architect differently (e.g., microservices, better DB schema, cleaner patterns) and connect it to lessons learned during the project." },
  { id: 'proj_5', question: 'How did you collaborate with others (if any) on this project?', category: 'Project', level: 'Beginner', optimalKeywords: ['git', 'branch', 'pr', 'review', 'communication', 'team'], sampleAnswer: 'Describe your collaboration setup: version control (Git branching strategy), code reviews, communication tools (Slack, Jira), and how you handled merge conflicts or disagreements.' },
  { id: 'proj_6', question: 'How did you handle deployment and infrastructure for your project?', category: 'Project', level: 'Intermediate', optimalKeywords: ['deploy', 'hosting', 'ci/cd', 'cloud', 'pipeline', 'environment'], sampleAnswer: 'Describe your deployment pipeline: hosting platform (Vercel, AWS, Firebase), CI/CD automation (GitHub Actions, CircleCI), environment management (staging vs production), and rollback strategy.' },
  { id: 'proj_7', question: 'What metrics did you track to measure the success of your project?', category: 'Project', level: 'Advanced', optimalKeywords: ['metrics', 'kpi', 'performance', 'user', 'analytics', 'measure'], sampleAnswer: 'Discuss specific metrics: page load time, API response time, error rate, user retention, conversion rate, or business outcomes. Show you think about impact beyond just shipping code.' },
  { id: 'proj_8', question: 'Describe the most significant bug or outage you dealt with in your project.', category: 'Project', level: 'Advanced', optimalKeywords: ['bug', 'debug', 'impact', 'root cause', 'fix', 'postmortem'], sampleAnswer: "Describe the bug's impact, how you diagnosed it (logs, monitoring, reproduction), the root cause, the fix implemented, and any preventive measures added afterward." },
  { id: 'proj_9', question: 'How did you prioritize features when you had limited time or resources?', category: 'Project', level: 'Intermediate', optimalKeywords: ['prioritize', 'mvp', 'impact', 'tradeoff', 'scope', 'user'], sampleAnswer: 'Explain your framework: user value vs. effort matrix, MVP thinking, deferring nice-to-haves, and communicating trade-offs clearly. Show pragmatic decision-making.' },
  { id: 'proj_10', question: 'How would you scale your project to handle 10x more users?', category: 'Project', level: 'Advanced', optimalKeywords: ['scale', 'cache', 'load balance', 'database', 'cdn', 'microservice'], sampleAnswer: 'Think through bottlenecks: add caching (Redis), use CDN for static assets, horizontal scaling with load balancers, read replicas for DB, optimize queries with indexes, and consider microservices for isolated scaling.' },
];

// ─── Default Technical Questions (generic/fallback) ───────────────────────────

const GENERIC_TECH_QUESTIONS = [
  { id: 'gen_1', question: 'Explain the concept of REST API design principles.', category: 'Technical', level: 'Intermediate', optimalKeywords: ['stateless', 'resource', 'http', 'endpoint', 'json', 'idempotent'], sampleAnswer: 'REST APIs are stateless, resource-based, and use HTTP methods (GET, POST, PUT, DELETE). Resources are identified by URIs. Good REST APIs are idempotent, use proper status codes, and version their endpoints.' },
  { id: 'gen_2', question: 'What is the difference between synchronous and asynchronous programming?', category: 'Technical', level: 'Beginner', optimalKeywords: ['blocking', 'non-blocking', 'async', 'await', 'callback', 'concurrent'], sampleAnswer: 'Synchronous code blocks execution until completion. Asynchronous code allows the program to continue while waiting for I/O or long operations (callbacks, Promises, async/await).' },
  { id: 'gen_3', question: 'What is Git branching strategy and what are common workflows?', category: 'Technical', level: 'Beginner', optimalKeywords: ['branch', 'main', 'feature', 'merge', 'pr', 'gitflow'], sampleAnswer: 'Common strategies: Gitflow (feature/release/hotfix branches), trunk-based development (short-lived feature branches merged to main frequently), and GitHub Flow (branch, PR, merge). Choose based on team size and release cadence.' },
  { id: 'gen_4', question: 'How do you approach application security in your code?', category: 'Technical', level: 'Advanced', optimalKeywords: ['sanitize', 'auth', 'xss', 'sql injection', 'https', 'least privilege'], sampleAnswer: 'Apply defense in depth: input validation and sanitization, parameterized queries (SQL injection), Content Security Policy (XSS), HTTPS enforcement, least-privilege access control, secrets management, and dependency auditing.' },
  { id: 'gen_5', question: 'What is Big O notation and why does it matter?', category: 'Technical', level: 'Intermediate', optimalKeywords: ['complexity', 'big o', 'time', 'space', 'algorithm', 'efficiency'], sampleAnswer: "Big O describes algorithm time/space complexity as input grows. O(1) is constant, O(n) is linear, O(n²) is quadratic. It matters because it predicts how code scales — an O(n²) algorithm that's fine at 100 records may cripple at 1M." },
  { id: 'gen_6', question: 'Explain the difference between TCP and UDP protocols.', category: 'Technical', level: 'Intermediate', optimalKeywords: ['tcp', 'udp', 'reliable', 'ordered', 'connection', 'packet loss'], sampleAnswer: 'TCP provides reliable, ordered, connection-oriented delivery with error checking and retransmission. UDP is connectionless, fast, and lossy — used for real-time applications (video streaming, gaming) where speed > reliability.' },
  { id: 'gen_7', question: 'What are design patterns and can you give two examples?', category: 'Technical', level: 'Advanced', optimalKeywords: ['pattern', 'singleton', 'observer', 'factory', 'design', 'reusable'], sampleAnswer: 'Design patterns are proven solutions to common software problems. Singleton: ensures a class has only one instance. Observer: objects subscribe to events from a publisher. Factory: centralizes object creation logic.' },
  { id: 'gen_8', question: 'What is CI/CD and why is it important in modern software development?', category: 'Technical', level: 'Beginner', optimalKeywords: ['continuous integration', 'continuous delivery', 'pipeline', 'automate', 'test', 'deploy'], sampleAnswer: 'CI/CD automates building, testing, and deploying code. CI catches integration bugs early via automated test runs on every push. CD deploys validated code to production automatically, reducing manual errors and release cycle time.' },
];

// ─── Core Generation Logic ────────────────────────────────────────────────────

/**
 * Generate personalized interview questions based on resume analysis
 * @param {Object} analysisData - Resume analysis data from aiAnalyzer
 * @param {Object} options - Generation options
 * @returns {Object} Generated question set with categories
 */
export const generateInterviewQuestions = (analysisData = {}, options = {}) => {
  const {
    skills = [],
    detectedSkills = [],
    strengths = [],
    weaknesses = [],
  } = analysisData;

  const allDetectedSkills = [...new Set([
    ...(skills || []),
    ...(detectedSkills || []),
  ])].map(s => s.toLowerCase());

  // ── HR Questions (10) ──────────────────────────────────────────────────────
  const hrQuestions = shuffle(HR_QUESTIONS).slice(0, 10);

  // ── Technical Questions (15) — personalized by skills ─────────────────────
  let technicalQuestions = [];

  const skillMap = Object.keys(SKILL_TECH_QUESTIONS).map(k => k.toLowerCase());

  allDetectedSkills.forEach(skill => {
    const matchKey = skillMap.find(k => skill.includes(k) || k.includes(skill));
    if (matchKey && SKILL_TECH_QUESTIONS[matchKey]) {
      technicalQuestions.push(...SKILL_TECH_QUESTIONS[matchKey]);
    }
  });

  // Deduplicate
  technicalQuestions = uniqueById(technicalQuestions);

  // Fill remaining with generic tech questions
  if (technicalQuestions.length < 15) {
    const remaining = shuffle(GENERIC_TECH_QUESTIONS).slice(0, 15 - technicalQuestions.length);
    technicalQuestions = [...technicalQuestions, ...remaining];
  } else {
    technicalQuestions = shuffle(technicalQuestions).slice(0, 15);
  }

  // ── Project Questions (10) ─────────────────────────────────────────────────
  const projectQuestions = shuffle(PROJECT_QUESTIONS_TEMPLATES).slice(0, 10);

  // ── Behavioral Questions (10) ──────────────────────────────────────────────
  const behavioralQuestions = shuffle(BEHAVIORAL_QUESTIONS).slice(0, 10);

  // ── Problem Solving (5) ────────────────────────────────────────────────────
  const problemSolvingQuestions = shuffle(PROBLEM_SOLVING_QUESTIONS).slice(0, 5);

  const allQuestions = [
    ...hrQuestions,
    ...technicalQuestions,
    ...projectQuestions,
    ...behavioralQuestions,
    ...problemSolvingQuestions,
  ];

  return {
    total: allQuestions.length,
    byCategory: {
      hr: hrQuestions,
      technical: technicalQuestions,
      project: projectQuestions,
      behavioral: behavioralQuestions,
      problemSolving: problemSolvingQuestions,
    },
    all: allQuestions,
    detectedSkillsUsed: allDetectedSkills,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Evaluate a user's answer against a question
 * @param {string} userAnswer - The answer typed by the user
 * @param {Object} questionObj - The question object with optimalKeywords and sampleAnswer
 * @returns {Object} Evaluation result with score, strengths, weaknesses, improvements
 */
export const evaluateAnswer = (userAnswer = '', questionObj = {}) => {
  const normalized = userAnswer.toLowerCase().trim();
  const keywords = questionObj.optimalKeywords || [];

  if (!normalized || normalized.length < 10) {
    return {
      score: 0,
      grade: 'F',
      confidence: 'Low',
      technicalAccuracy: 'Poor',
      communication: 'Poor',
      completeness: 'Incomplete',
      strengths: [],
      weaknesses: ['No meaningful answer provided.'],
      improvements: ['Write a complete, detailed response.', 'Use technical terminology relevant to the question.'],
      feedback: 'No answer provided. Please write a substantive response.',
    };
  }

  // Keyword matching
  const matchedKeywords = keywords.filter(kw => normalized.includes(kw.toLowerCase()));
  const keywordRatio = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;

  // Length scoring
  let lengthScore = 0;
  if (normalized.length >= 400) lengthScore = 30;
  else if (normalized.length >= 200) lengthScore = 22;
  else if (normalized.length >= 100) lengthScore = 14;
  else if (normalized.length >= 50) lengthScore = 7;

  // Keyword score
  const keywordScore = Math.round(keywordRatio * 50);

  // Base score for writing anything meaningful
  const baseScore = normalized.length >= 50 ? 20 : 10;

  let rawScore = baseScore + lengthScore + keywordScore;
  const score = Math.min(100, rawScore);

  // Derived ratings
  const confidence = score >= 80 ? 'High' : score >= 55 ? 'Medium' : 'Low';
  const technicalAccuracy = keywordRatio >= 0.7 ? 'Excellent' : keywordRatio >= 0.4 ? 'Good' : keywordRatio >= 0.2 ? 'Fair' : 'Needs Work';
  const communication = normalized.length >= 200 ? 'Clear' : normalized.length >= 100 ? 'Adequate' : 'Brief';
  const completeness = score >= 80 ? 'Complete' : score >= 55 ? 'Partial' : 'Incomplete';

  // Grade
  let grade = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 65) grade = 'C';
  else if (score >= 50) grade = 'D';

  // Strengths
  const strengths = [];
  if (matchedKeywords.length > 0) strengths.push(`Covered key concepts: ${matchedKeywords.slice(0, 3).join(', ')}.`);
  if (normalized.length >= 200) strengths.push('Good answer depth and detail.');
  if (normalized.length >= 400) strengths.push('Excellent comprehensive response.');
  if (score >= 80) strengths.push('Strong overall coverage of the topic.');

  // Weaknesses
  const weaknesses = [];
  const missedKeywords = keywords.filter(kw => !normalized.includes(kw.toLowerCase()));
  if (missedKeywords.length > 0) weaknesses.push(`Missed key concepts: ${missedKeywords.slice(0, 3).join(', ')}.`);
  if (normalized.length < 100) weaknesses.push('Answer is too brief — add more detail and examples.');
  if (keywordRatio < 0.3) weaknesses.push('Limited use of relevant technical terminology.');

  // Improvements
  const improvements = [];
  if (missedKeywords.length > 0) improvements.push(`Include these key terms: ${missedKeywords.slice(0, 4).join(', ')}.`);
  if (normalized.length < 200) improvements.push('Expand your answer with specific examples or use cases.');
  if (!normalized.includes('example') && !normalized.includes('instance') && !normalized.includes('such as')) {
    improvements.push('Add a concrete real-world example to strengthen your response.');
  }
  if (improvements.length === 0) improvements.push('Keep practicing and refine your delivery speed.');

  // Feedback text
  let feedback = '';
  if (score >= 90) feedback = 'Outstanding answer! You demonstrated comprehensive knowledge with excellent depth.';
  else if (score >= 75) feedback = 'Strong response with good technical coverage. Minor details could be expanded.';
  else if (score >= 55) feedback = 'Decent attempt. Add more specific terminology and real-world examples.';
  else if (score >= 35) feedback = 'Basic response. Significantly more detail and technical depth is needed.';
  else feedback = 'Answer is too vague. Study the key concepts and provide structured, specific responses.';

  return {
    score,
    grade,
    confidence,
    technicalAccuracy,
    communication,
    completeness,
    strengths,
    weaknesses,
    improvements,
    feedback,
    matchedKeywords,
    missedKeywords,
  };
};

/**
 * Compute overall session performance summary
 * @param {Array} answersLog - Array of answer evaluations
 * @returns {Object} Session summary
 */
export const computeSessionSummary = (answersLog = []) => {
  if (answersLog.length === 0) {
    return { avgScore: 0, grade: 'N/A', performance: 'No answers recorded', topStrength: null, topWeakness: null };
  }

  const avgScore = Math.round(answersLog.reduce((acc, a) => acc + a.score, 0) / answersLog.length);
  
  let grade = 'F';
  if (avgScore >= 90) grade = 'A+';
  else if (avgScore >= 80) grade = 'A';
  else if (avgScore >= 70) grade = 'B';
  else if (avgScore >= 60) grade = 'C';
  else if (avgScore >= 50) grade = 'D';

  let performance = '';
  if (avgScore >= 85) performance = 'Interview Ready 🚀';
  else if (avgScore >= 70) performance = 'Strong Candidate 💪';
  else if (avgScore >= 55) performance = 'Needs Practice 📚';
  else performance = 'Significant Preparation Required 🔧';

  const highScores = answersLog.filter(a => a.score >= 75);
  const lowScores = answersLog.filter(a => a.score < 55);

  return {
    avgScore,
    grade,
    performance,
    answeredCount: answersLog.length,
    strongAnswers: highScores.length,
    weakAnswers: lowScores.length,
    topScore: Math.max(...answersLog.map(a => a.score)),
    lowestScore: Math.min(...answersLog.map(a => a.score)),
    chartData: answersLog.map((a, i) => ({ name: `Q${i + 1}`, Score: a.score, category: a.category || '' })),
  };
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uniqueById(array) {
  const seen = new Set();
  return array.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
