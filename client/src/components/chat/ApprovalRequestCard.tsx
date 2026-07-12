import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export interface ApprovalRequest {
  question: string;
  options: string[];
  allow_other: boolean;
}

interface ApprovalRequestCardProps {
  approvalRequest: ApprovalRequest;
  onSubmit: (selection: string, otherText?: string) => void;
}

export function ApprovalRequestCard({ approvalRequest, onSubmit }: ApprovalRequestCardProps) {
  const [otherText, setOtherText] = useState('');

  const handleOtherSubmit = () => {
    const trimmed = otherText.trim();
    if (trimmed) {
      onSubmit('Other', trimmed);
    }
  };

  return (
    <Card className="mt-2 p-3 border-primary/20 bg-primary/5">
      <p className="text-sm font-medium mb-2">{approvalRequest.question}</p>
      <div className="flex flex-wrap gap-2">
        {approvalRequest.options.map((option) => (
          <Button
            key={option}
            variant="outline"
            size="sm"
            onClick={() => onSubmit(option)}
            className="text-xs"
          >
            {option}
          </Button>
        ))}
      </div>
      {approvalRequest.allow_other && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">Or type your own answer:</p>
          <div className="flex gap-2">
            <Textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Other..."
              rows={2}
              className="resize-none flex-1 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleOtherSubmit();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleOtherSubmit}
              disabled={!otherText.trim()}
              className="self-end"
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
