import { StatCard } from "@/components/StatCard";
import { QuizCard } from "@/components/QuizCard";
import { RoleBadge } from "@/components/RoleBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Users, TrendingUp, Clock } from "lucide-react";

// TODO: remove mock functionality
const mockUser = {
  name: "Jane Doe",
  role: "Admin" as const,
  email: "jane.doe@example.com",
  avatar: "",
};

const mockQuizzes = [
  {
    id: "quiz-1",
    title: "Foundations of Cooperation",
    description: "Core principles of team collaboration",
    status: "in_progress" as const,
    progress: 65,
    estimatedTime: 15,
  },
  {
    id: "quiz-2",
    title: "Leadership Essentials",
    status: "not_started" as const,
    estimatedTime: 20,
  },
];

const mockActivity = [
  { time: "2 hours ago", action: "Completed 'Communication Skills' quiz", score: 88 },
  { time: "Yesterday", action: "Joined 'Advanced Leadership' team" },
  { time: "2 days ago", action: "Started 'Foundations of Cooperation' course" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback className="text-lg">
              {mockUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-welcome-name">
              Welcome back, {mockUser.name}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <RoleBadge role={mockUser.role} />
              <span className="text-sm text-muted-foreground">{mockUser.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Courses"
          value={5}
          icon={BookOpen}
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Completed Quizzes"
          value={12}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Team Members"
          value={24}
          icon={Users}
        />
        <StatCard
          title="Avg. Score"
          value="85%"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Continue Learning</h2>
            <Button variant="outline" data-testid="button-view-all-quizzes">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {mockQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                {...quiz}
                onStart={() => console.log("Start quiz:", quiz.id)}
                onUpload={() => console.log("Upload results:", quiz.id)}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Activity</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivity.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 pb-4 last:pb-0 border-b last:border-0"
                  data-testid={`activity-item-${index}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.action}</p>
                    {item.score && (
                      <p className="text-sm text-chart-3 font-medium">
                        Score: {item.score}%
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
