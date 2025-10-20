import { QuizCard } from "../QuizCard";

export default function QuizCardExample() {
  return (
    <div className="space-y-4 p-8 max-w-4xl">
      <QuizCard
        id="quiz-1"
        title="Foundations of Cooperation"
        description="Learn the core principles of team collaboration and cooperative frameworks."
        status="not_started"
        estimatedTime={15}
        onStart={() => console.log("Start quiz")}
        onUpload={() => console.log("Upload results")}
      />
      <QuizCard
        id="quiz-2"
        title="Leadership Essentials"
        description="Understanding leadership styles and effective team management."
        status="in_progress"
        estimatedTime={20}
        progress={65}
        onStart={() => console.log("Continue quiz")}
        onUpload={() => console.log("Upload results")}
      />
      <QuizCard
        id="quiz-3"
        title="Communication Skills"
        status="completed"
        estimatedTime={10}
        score={88}
        onViewResults={() => console.log("View results")}
      />
    </div>
  );
}
