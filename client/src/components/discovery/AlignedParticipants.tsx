interface Props {
  ethosId: string;
}

export function AlignedParticipants({ ethosId: _ethosId }: Props) {
  // TODO: Implement participant listing via backend API when endpoint is available.
  // Previously used Supabase Edge Functions (participants-list, participants-update-contact).
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Aligned Participants</h2>
      </div>
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Participant information will be available once ethos matching is configured.
        </p>
      </div>
    </div>
  );
}
