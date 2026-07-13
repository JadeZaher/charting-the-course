interface Props {
  ethosId: string;
}

export function AlignedParticipants({ ethosId: _ethosId }: Props) {
  return (
    <div className="border-2 border-dashed border-strong-border bg-background p-6 sm:p-8">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Directory status</p>
      <p className="mt-3 text-xl font-black tracking-tight">Participant matching is not connected yet.</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Aligned participant profiles will appear here once ecosystem matching and contact consent are configured.
      </p>
    </div>
  );
}
