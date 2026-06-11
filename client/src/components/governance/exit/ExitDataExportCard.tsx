import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useRequestExitDataExport } from '@/hooks/use-governance';
import type { ExitDetail } from '@/types/api';
import { Download, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface ExitDataExportCardProps {
  exit: ExitDetail;
}

export function ExitDataExportCard({ exit }: ExitDataExportCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const exportMutation = useRequestExitDataExport(exit.id);

  const hasRequested = exit.data_export_requested;
  const hasCompleted = exit.data_export_completed;

  let statusLabel: string;
  let statusIcon: React.ReactNode;
  let statusVariant: 'default' | 'secondary' | 'destructive' | 'outline';

  if (hasCompleted) {
    statusLabel = `Exported ${new Date(exit.data_export_completed!).toLocaleDateString()}`;
    statusIcon = <CheckCircle2 className="h-4 w-4" />;
    statusVariant = 'default';
  } else if (hasRequested) {
    statusLabel = 'Export Requested';
    statusIcon = <Clock className="h-4 w-4" />;
    statusVariant = 'secondary';
  } else {
    statusLabel = 'Not Requested';
    statusIcon = <AlertCircle className="h-4 w-4" />;
    statusVariant = 'outline';
  }

  const handleRequestExport = async () => {
    try {
      await exportMutation.mutateAsync();
      setShowConfirm(false);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant} className="flex items-center gap-1">
              {statusIcon}
              {statusLabel}
            </Badge>
          </div>

          {hasCompleted ? (
            <p className="text-sm text-muted-foreground">
              The member&apos;s data has been exported. The export package includes
              profile data, governance activity, quiz results, and messaging history.
            </p>
          ) : hasRequested ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A data export has been requested. The member&apos;s data is being
                prepared for secure transfer. This typically completes within 24 hours.
              </p>
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Request a complete data export for the departing member, including
                profile data, governance activity records, quiz results, and messaging history.
                This is part of the standard exit unwinding process.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(true)}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Request Data Export
                  </>
                )}
              </Button>
            </div>
          )}

          {exportMutation.error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {(exportMutation.error as Error).message}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request data export for this exit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will initiate the member data export process. The export will include
              all member data scoped to this ecosystem, including profile, activity records,
              quiz history, and messaging data. This is a required step in the exit unwinding process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestExport}>
              Request Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
