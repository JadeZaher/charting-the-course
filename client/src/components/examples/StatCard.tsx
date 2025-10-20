import { StatCard } from "../StatCard";
import { BookOpen, CheckCircle, Users, TrendingUp } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
      <StatCard
        title="Total Courses"
        value={12}
        icon={BookOpen}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="Completed Quizzes"
        value={24}
        icon={CheckCircle}
        trend={{ value: 12, isPositive: true }}
      />
      <StatCard
        title="Team Members"
        value={156}
        icon={Users}
      />
      <StatCard
        title="Progress"
        value="78%"
        icon={TrendingUp}
        trend={{ value: 5, isPositive: true }}
      />
    </div>
  );
}
