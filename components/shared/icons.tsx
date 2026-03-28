import {
  BookOpen,
  Brain,
  Scale,
  FileText,
  Target,
  ClipboardList,
  Lightbulb,
  GraduationCap,
  BarChart,
  Play,
  Puzzle,
  type LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  BookOpen,
  Brain,
  Scale,
  FileText,
  Target,
  ClipboardList,
  Lightbulb,
  GraduationCap,
  BarChart,
  Play,
  Puzzle,
};

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = iconMap[name] || BookOpen;
  return <Icon {...props} />;
}
