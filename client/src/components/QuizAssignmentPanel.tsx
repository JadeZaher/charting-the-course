import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { apiErrorMessage } from "@/lib/api-error-message";
import { createQuizAssignment, deleteQuizAssignment, fetchMembers, fetchQuizAssignments } from "@/lib/api-client";
import { quizDisplayTitle } from "@/lib/quiz-title";
import { affects, keys } from "@/lib/query-keys";
import type { MemberListItem, QuizAssignment } from "@/types/api";

interface AssignableQuiz {
  id: string;
  title: string;
}

/** Member assignments for quizzes. The API takes one member id; it does not assign a team. */
export function QuizAssignmentPanel({ quizzes }: { quizzes: AssignableQuiz[] }) {
  const [quizId, setQuizId] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [member, setMember] = useState<MemberListItem | null>(null);
  const [dueDate, setDueDate] = useState("");
  const search = memberQuery.trim();

  const assignments = useQuery({
    queryKey: keys.quizAssignments.list(),
    queryFn: () => fetchQuizAssignments(),
  });
  const members = useQuery({
    queryKey: keys.members.list({ q: search, per_page: "8" }),
    queryFn: () => fetchMembers({ q: search, per_page: "8" }),
    enabled: search.length >= 2 && !member,
  });
  const assign = useApiMutation({
    mutationFn: createQuizAssignment,
    invalidates: affects.quizAssignments,
    success: "Quiz assigned",
    error: "Quiz not assigned",
  });
  const remove = useApiMutation({
    mutationFn: deleteQuizAssignment,
    invalidates: affects.quizAssignments,
    success: "Assignment removed",
    error: "Assignment not removed",
  });

  const items: QuizAssignment[] = assignments.data?.items ?? [];
  const memberHits = members.data?.items ?? [];

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!quizId || !member) return;
    try {
      await assign.mutateAsync({
        quiz_id: quizId,
        member_id: member.member_id || member.id,
        due_date: dueDate || null,
      });
      setMember(null);
      setMemberQuery("");
      setDueDate("");
    } catch {
      // The mutation toast already reports the failure.
    }
  }

  return (
    <section className="space-y-4 border-2 border-strong-border bg-card p-5" aria-labelledby="quiz-assignments-heading">
      <div>
        <h2 id="quiz-assignments-heading" className="text-xl font-bold">Assign a quiz to a member</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Assignments here go to one member. This workspace has no control that assigns a quiz to a team.
          Unfinished answers are not stored; the member opens the quiz and submits it.
        </p>
      </div>

      {assignments.isPending && <p role="status">Loading assignments…</p>}
      {assignments.isError && <p role="alert" className="text-destructive">{apiErrorMessage(assignments.error)}</p>}
      {!assignments.isPending && !assignments.isError && items.length === 0 && (
        <p className="border border-dashed border-border p-4 text-sm">No quiz assignments yet.</p>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-border border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="font-semibold">{quizDisplayTitle(item.quiz_title)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.member_name || item.member_id}
                  {item.due_date ? ` · due ${item.due_date}` : ""}
                  {item.status ? ` · ${item.status}` : ""}
                </p>
              </div>
              <Button type="button" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form className="space-y-4" onSubmit={onAssign}>
        <div className="space-y-2">
          <Label htmlFor="assign-quiz">Quiz</Label>
          <select
            id="assign-quiz"
            className="min-h-11 w-full border-2 border-control-border bg-background px-3"
            value={quizId}
            onChange={(event) => setQuizId(event.target.value)}
            required
          >
            <option value="">Choose a quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
            ))}
          </select>
          {quizzes.length === 0 && <p className="text-sm text-muted-foreground">Create a quiz before assigning one.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="assign-member">Member</Label>
          <Input
            id="assign-member"
            value={member ? member.display_name : memberQuery}
            onChange={(event) => {
              setMember(null);
              setMemberQuery(event.target.value);
            }}
            placeholder="Search by name (at least 2 characters)"
          />
          {member && <p className="text-sm">Selected: {member.display_name}</p>}
          {members.isError && <p role="alert" className="text-sm text-destructive">{apiErrorMessage(members.error)}</p>}
          {!member && search.length >= 2 && (
            <div className="space-y-2">
              {members.isFetching && <p role="status" className="text-sm">Finding members…</p>}
              {memberHits.map((hit) => (
                <Button
                  key={hit.id}
                  type="button"
                  variant="outline"
                  className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
                  onClick={() => setMember(hit)}
                >
                  {hit.display_name}
                </Button>
              ))}
              {!members.isFetching && memberHits.length === 0 && (
                <p className="text-sm text-muted-foreground">No members match this search.</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="assign-due">Due date (optional)</Label>
          <Input id="assign-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
        <Button type="submit" disabled={!quizId || !member || assign.isPending}>
          {assign.isPending ? "Assigning…" : "Assign quiz"}
        </Button>
      </form>
    </section>
  );
}
