export const RESOURCE_TYPES = [
  { value: "video", label: "Video", icon: "Play" },
  { value: "lesson", label: "Lesson", icon: "BookOpen" },
  { value: "drill", label: "Drill", icon: "Target" },
  { value: "practice_test", label: "Practice Test", icon: "ClipboardList" },
  { value: "article", label: "Article", icon: "FileText" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy", color: "text-emerald-600 bg-emerald-50" },
  { value: "medium", label: "Medium", color: "text-amber-600 bg-amber-50" },
  { value: "hard", label: "Hard", color: "text-rose-600 bg-rose-50" },
] as const;

export const PROGRESS_STATUSES = [
  { value: "not_started", label: "Not Started", color: "text-slate-500 bg-slate-50" },
  { value: "in_progress", label: "In Progress", color: "text-blue-600 bg-blue-50" },
  { value: "completed", label: "Completed", color: "text-emerald-600 bg-emerald-50" },
  { value: "review_later", label: "Review Later", color: "text-amber-600 bg-amber-50" },
] as const;

export const MODULE_ICONS = [
  "BookOpen",
  "Brain",
  "Scale",
  "FileText",
  "Target",
  "ClipboardList",
  "Lightbulb",
  "Puzzle",
  "GraduationCap",
  "BarChart",
] as const;

export const MODULE_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
