// The leaver downloads their portable governance record (GET /exit/:id/portable-record); never changes the exit status.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortableRecordDownload } from '@/hooks/use-exit';
import type { ExitView } from '@/types/api';
import { Download, Loader2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

export function ExitDataExportCard({ exit }: { exit: ExitView }) {
  const download = usePortableRecordDownload(exit.id);
  if (!exit.caller_is_leaver) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5" aria-hidden="true" />
          Your governance record
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Take your record with you: your memberships, the proposals you wrote, the advice you gave, your consent
          positions and the agreements you consented to, across every ecosystem you belong to, as a JSON file.
          Download it before your departure is confirmed; you can download it again at any time.
        </p>
        <p className="text-sm" aria-live="polite">
          {exit.data_export_completed
            ? `Last downloaded ${new Date(exit.data_export_completed).toLocaleDateString()}.`
            : 'Not downloaded yet.'}
        </p>
        <Button variant="outline" onClick={() => download.mutate()} disabled={download.isPending}>
          {download.isPending
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Preparing…</>
            : <><Download className="mr-2 h-4 w-4" aria-hidden="true" />Download my record</>}
        </Button>
        {download.error && (
          <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(download.error)}</p>
        )}
      </CardContent>
    </Card>
  );
}
