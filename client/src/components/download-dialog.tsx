import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileJson, Download } from "lucide-react";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
}

export function DownloadDialog({ open, onOpenChange, messages }: DownloadDialogProps) {
  const { toast } = useToast();

  const downloadAsText = () => {
    const content = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'Student' : 'Advisor';
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    const header = `Personal College Advisor - Session Transcript
Generated: ${new Date().toLocaleString()}
Total Messages: ${messages.length}

================================================================================

`;

    const blob = new Blob([header + content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college-advisor-session-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded successfully",
      description: "Your conversation has been saved as a text file",
    });
    onOpenChange(false);
  };

  const downloadAsJSON = () => {
    const data = {
      sessionInfo: {
        generatedAt: new Date().toISOString(),
        totalMessages: messages.length,
        sessionStart: messages[0]?.timestamp,
        sessionEnd: messages[messages.length - 1]?.timestamp,
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college-advisor-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded successfully",
      description: "Your conversation has been saved as a JSON file",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Conversation</DialogTitle>
          <DialogDescription>
            Choose your preferred format to save your college advising session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={downloadAsText}
            data-testid="button-download-txt"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Text File (.txt)</p>
              <p className="text-sm text-muted-foreground">
                Human-readable format with timestamps
              </p>
            </div>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={downloadAsJSON}
            data-testid="button-download-json"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileJson className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">JSON File (.json)</p>
              <p className="text-sm text-muted-foreground">
                Structured data format for analysis
              </p>
            </div>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
