import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileType, Download } from "lucide-react";
import type { Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
}

export function DownloadDialog({ open, onOpenChange, messages }: DownloadDialogProps) {
  const { toast } = useToast();

  const downloadAsMarkdown = () => {
    const content = messages
      .map((msg) => {
        const role = msg.role === 'user' ? 'Student' : 'Advisor';
        const timestamp = new Date(msg.timestamp).toLocaleString();
        return `### ${role} - ${timestamp}\n\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    const header = `# Personal College Advisor - Session Transcript

**Generated:** ${new Date().toLocaleString()}  
**Total Messages:** ${messages.length}

---

`;

    const blob = new Blob([header + content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college-advisor-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded successfully",
      description: "Your conversation has been saved as a Markdown file",
    });
    onOpenChange(false);
  };

  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    // Header
    doc.setFontSize(16);
    doc.text("Personal College Advisor - Session Transcript", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 6;
    doc.text(`Total Messages: ${messages.length}`, margin, y);
    y += 15;

    // Messages
    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'Student' : 'Advisor';
      const timestamp = new Date(msg.timestamp).toLocaleString();

      // Check if we need a new page
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = margin;
      }

      // Role and timestamp
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${role} - ${timestamp}`, margin, y);
      y += 7;

      // Content
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(msg.content, maxWidth);
      
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 5;
      });

      y += 10;

      // Separator
      if (index < messages.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
      }
    });

    doc.save(`college-advisor-session-${Date.now()}.pdf`);

    toast({
      title: "Downloaded successfully",
      description: "Your conversation has been saved as a PDF file",
    });
    onOpenChange(false);
  };

  const downloadAsWord = async () => {
    const sections = messages.map((msg) => {
      const role = msg.role === 'user' ? 'Student' : 'Advisor';
      const timestamp = new Date(msg.timestamp).toLocaleString();

      return [
        new Paragraph({
          text: `${role} - ${timestamp}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          children: [new TextRun(msg.content)],
          spacing: { after: 200 },
        }),
      ];
    }).flat();

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Personal College Advisor - Session Transcript",
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()}`,
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Messages: ${messages.length}`,
                bold: true,
              }),
            ],
            spacing: { after: 400 },
          }),
          ...sections,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `college-advisor-session-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded successfully",
      description: "Your conversation has been saved as a Word document",
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
            onClick={downloadAsMarkdown}
            data-testid="button-download-markdown"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Markdown (.md)</p>
              <p className="text-sm text-muted-foreground">
                Plain text with formatting for easy reading
              </p>
            </div>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={downloadAsPDF}
            data-testid="button-download-pdf"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileType className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">PDF Document (.pdf)</p>
              <p className="text-sm text-muted-foreground">
                Professional format for printing and sharing
              </p>
            </div>
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={downloadAsWord}
            data-testid="button-download-word"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Word Document (.docx)</p>
              <p className="text-sm text-muted-foreground">
                Editable document for Microsoft Word
              </p>
            </div>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
