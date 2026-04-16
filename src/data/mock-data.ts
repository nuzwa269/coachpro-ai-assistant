export interface Project {
  id: string;
  name: string;
  description: string;
  assistantCount: number;
  conversationCount: number;
  createdAt: string;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  icon: string;
  isPrebuilt: boolean;
  category: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isSaved: boolean;
}

export interface Conversation {
  id: string;
  projectId: string;
  assistantId: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

export const mockUser = {
  id: "u1",
  name: "Ali Ahmed",
  email: "ali@example.com",
  avatar: "",
  credits: 47,
  plan: "Free",
};

export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "React Mastery",
    description: "Learning advanced React patterns and hooks",
    assistantCount: 3,
    conversationCount: 12,
    createdAt: "2025-03-15",
  },
  {
    id: "p2",
    name: "E-Commerce System",
    description: "Building a full-stack e-commerce platform",
    assistantCount: 2,
    conversationCount: 8,
    createdAt: "2025-04-01",
  },
  {
    id: "p3",
    name: "Python Basics",
    description: "Learning Python programming from scratch",
    assistantCount: 1,
    conversationCount: 5,
    createdAt: "2025-04-10",
  },
];

export const prebuiltAssistants: Assistant[] = [
  {
    id: "a1",
    name: "Code Tutor",
    description: "Learn programming concepts with clear explanations and examples",
    systemPrompt: "You are a friendly programming tutor...",
    icon: "GraduationCap",
    isPrebuilt: true,
    category: "Education",
  },
  {
    id: "a2",
    name: "System Architect",
    description: "Design scalable software architectures and system diagrams",
    systemPrompt: "You are an expert system architect...",
    icon: "Building2",
    isPrebuilt: true,
    category: "Architecture",
  },
  {
    id: "a3",
    name: "Debug Helper",
    description: "Find and fix bugs in your code with step-by-step guidance",
    systemPrompt: "You are a debugging expert...",
    icon: "Bug",
    isPrebuilt: true,
    category: "Development",
  },
  {
    id: "a4",
    name: "Tech Explainer",
    description: "Understand complex tech concepts in simple language",
    systemPrompt: "You explain complex tech topics simply...",
    icon: "Lightbulb",
    isPrebuilt: true,
    category: "Education",
  },
];

export const customAssistants: Assistant[] = [
  {
    id: "ca1",
    name: "My API Designer",
    description: "Helps me design REST APIs for my projects",
    systemPrompt: "You are an API design assistant...",
    icon: "Code",
    isPrebuilt: false,
    category: "Custom",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "c1",
    projectId: "p1",
    assistantId: "a1",
    title: "Understanding useEffect",
    messages: [
      { id: "m1", role: "user", content: "Can you explain the useEffect hook in React?", timestamp: "2025-04-10T10:00:00", isSaved: false },
      { id: "m2", role: "assistant", content: "The `useEffect` hook lets you perform side effects in function components. It serves the same purpose as `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` in React class components.\n\nHere's a basic example:\n\n```jsx\nuseEffect(() => {\n  document.title = `You clicked ${count} times`;\n}, [count]);\n```\n\nThe second argument `[count]` is the dependency array. The effect only re-runs when `count` changes.", timestamp: "2025-04-10T10:00:05", isSaved: true },
      { id: "m3", role: "user", content: "What happens if I pass an empty array?", timestamp: "2025-04-10T10:01:00", isSaved: false },
      { id: "m4", role: "assistant", content: "An empty dependency array `[]` means the effect runs only once after the initial render, similar to `componentDidMount`. It won't re-run on any state or prop changes.\n\nThis is perfect for:\n- Fetching initial data\n- Setting up event listeners\n- Starting subscriptions\n\nJust remember to clean up in the return function!", timestamp: "2025-04-10T10:01:05", isSaved: false },
    ],
    createdAt: "2025-04-10",
  },
  {
    id: "c2",
    projectId: "p1",
    assistantId: "a2",
    title: "Component Architecture",
    messages: [
      { id: "m5", role: "user", content: "How should I structure components in a large React app?", timestamp: "2025-04-11T09:00:00", isSaved: false },
      { id: "m6", role: "assistant", content: "For large React applications, I recommend this folder structure:\n\n```\nsrc/\n  components/\n    common/     - Reusable UI components\n    features/   - Feature-specific components\n    layout/     - Layout components\n  hooks/        - Custom hooks\n  pages/        - Route-level components\n  services/     - API calls\n  utils/        - Helper functions\n```\n\nKey principles:\n1. **Single Responsibility** - Each component does one thing\n2. **Composition over Inheritance** - Build complex UIs from simple pieces\n3. **Container/Presentational** - Separate logic from UI", timestamp: "2025-04-11T09:00:05", isSaved: true },
    ],
    createdAt: "2025-04-11",
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 20,
    features: ["20 credits on signup", "Access to pre-built assistants", "1 project", "Basic chat history"],
  },
  {
    id: "basic",
    name: "Basic",
    price: 999,
    credits: 100,
    features: ["100 credits/month", "All pre-built assistants", "5 projects", "Custom assistants", "Save responses", "Priority support"],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: 2499,
    credits: 500,
    features: ["500 credits/month", "All pre-built assistants", "Unlimited projects", "Custom assistants", "Save responses", "Priority support", "API access"],
  },
];

export const creditPacks: CreditPack[] = [
  { id: "cp1", name: "Starter", credits: 50, price: 299, currency: "PKR" },
  { id: "cp2", name: "Popular", credits: 200, price: 999, currency: "PKR" },
  { id: "cp3", name: "Power User", credits: 500, price: 1999, currency: "PKR" },
];

export const savedResponses = mockConversations
  .flatMap((c) => c.messages)
  .filter((m) => m.isSaved);
