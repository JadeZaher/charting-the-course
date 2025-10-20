import { EmptyState } from "../EmptyState";
import { BookOpen } from "lucide-react";
import emptyStateImage from "@assets/generated_images/Empty_quiz_state_illustration_616a28ec.png";

export default function EmptyStateExample() {
  return (
    <div className="p-8">
      <div className="border rounded-xl p-4 mb-8">
        <EmptyState
          icon={BookOpen}
          title="No Quizzes Yet"
          description="You haven't started any quizzes. Browse available courses and start your learning journey today."
          actionLabel="Browse Quizzes"
          onAction={() => console.log("Browse clicked")}
        />
      </div>
      <div className="border rounded-xl p-4">
        <EmptyState
          icon={BookOpen}
          title="No Quizzes Available"
          description="There are currently no quizzes available for your role. Check back later for new learning opportunities."
          imageSrc={emptyStateImage}
        />
      </div>
    </div>
  );
}
