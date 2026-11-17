export interface BlogTrainingStep {
  stepNumber: string;
  title: string;
  content: string;
  note?: string;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  pillarNum?: string;
  pillarBadge?: string;
  icon?: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: 'pillar' | 'clinical' | 'prevention' | 'digital-health';
  categoryLabel: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  readTime: string;
  coverImage: string;
  learningObjectives: string[];
  overview: string;
  steps: BlogTrainingStep[];
  faqs: BlogFaq[];
  keyTakeaways: string[];
  tags: string[];
}
