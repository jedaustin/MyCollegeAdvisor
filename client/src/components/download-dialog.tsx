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
import { Document, Paragraph, TextRun, Packer, HeadingLevel, ExternalHyperlink } from "docx";
import MarkdownIt from "markdown-it";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
}

// Helper to convert markdown to plain text for PDF
function markdownToPlainText(markdown: string): string {
  const md = new MarkdownIt();
  const html = md.render(markdown);
  
  // Strip HTML tags and convert to plain text
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Helper to parse markdown using HTML conversion for Word
interface WordElement {
  type: 'paragraph' | 'list';
  runs?: TextRunElement[];
  items?: TextRunElement[][];
}

interface TextRunElement {
  text: string;
  bold?: boolean;
  italic?: boolean;
  link?: string;
  linkChildren?: TextRunElement[]; // For preserving mixed formatting within links
}

function parseMarkdownForWord(markdown: string): WordElement[] {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});
  const elements: WordElement[] = [];
  
  // Process inline tokens recursively with state tracking
  function processInlineTokens(tokens: any[], boldContext = false, italicContext = false): TextRunElement[] {
    const runs: TextRunElement[] = [];
    let i = 0;
    
    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token.type === 'text') {
        runs.push({
          text: token.content,
          bold: boldContext,
          italic: italicContext,
        });
      } else if (token.type === 'strong_open') {
        // Find matching strong_close
        let depth = 1;
        let endIndex = i + 1;
        while (endIndex < tokens.length && depth > 0) {
          if (tokens[endIndex].type === 'strong_open') depth++;
          if (tokens[endIndex].type === 'strong_close') depth--;
          if (depth === 0) break;
          endIndex++;
        }
        // Process tokens between open and close with bold=true
        const innerTokens = tokens.slice(i + 1, endIndex);
        runs.push(...processInlineTokens(innerTokens, true, italicContext));
        i = endIndex; // Skip to close tag
      } else if (token.type === 'em_open') {
        // Find matching em_close
        let depth = 1;
        let endIndex = i + 1;
        while (endIndex < tokens.length && depth > 0) {
          if (tokens[endIndex].type === 'em_open') depth++;
          if (tokens[endIndex].type === 'em_close') depth--;
          if (depth === 0) break;
          endIndex++;
        }
        // Process tokens between open and close with italic=true
        const innerTokens = tokens.slice(i + 1, endIndex);
        runs.push(...processInlineTokens(innerTokens, boldContext, true));
        i = endIndex; // Skip to close tag
      } else if (token.type === 'link_open') {
        const url = token.attrGet('href') || '';
        // Find link_close
        let endIndex = i + 1;
        while (endIndex < tokens.length && tokens[endIndex].type !== 'link_close') {
          endIndex++;
        }
        // Process inner tokens recursively to preserve formatting
        const innerTokens = tokens.slice(i + 1, endIndex);
        const innerRuns = processInlineTokens(innerTokens, boldContext, italicContext);
        
        // Keep individual runs to preserve mixed formatting within the link
        if (innerRuns.length > 0) {
          runs.push({
            text: innerRuns.map(r => r.text).join(''), // Combined text for display
            link: url,
            linkChildren: innerRuns, // Preserve individual formatted runs
          });
        }
        i = endIndex; // Skip to link_close
      } else if (token.type === 'code_inline') {
        runs.push({
          text: token.content,
          bold: boldContext,
          italic: italicContext,
        });
      }
      
      i++;
    }
    
    return runs;
  }
  
  // Process top-level tokens
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (token.type === 'paragraph_open') {
      i++;
      const inlineToken = tokens[i];
      if (inlineToken && inlineToken.children) {
        const runs = processInlineTokens(inlineToken.children);
        if (runs.length > 0) {
          elements.push({ type: 'paragraph', runs });
        }
      }
      i++; // Skip paragraph_close
    } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const listItems: TextRunElement[][] = [];
      i++;
      
      while (i < tokens.length) {
        if (tokens[i].type === 'bullet_list_close' || tokens[i].type === 'ordered_list_close') {
          break;
        }
        
        if (tokens[i].type === 'list_item_open') {
          i++;
          // Process paragraph inside list item
          if (tokens[i] && tokens[i].type === 'paragraph_open') {
            i++;
            const inlineToken = tokens[i];
            if (inlineToken && inlineToken.children) {
              const runs = processInlineTokens(inlineToken.children);
              listItems.push(runs);
            }
            i++; // Skip inline token
            i++; // Skip paragraph_close
          }
          i++; // Skip list_item_close
        } else {
          i++;
        }
      }
      
      if (listItems.length > 0) {
        elements.push({ type: 'list', items: listItems });
      }
    }
    
    i++;
  }
  
  return elements.length > 0 ? elements : [{ type: 'paragraph', runs: [{ text: markdown }] }];
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
    const lineHeight = 5;
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

      // Parse markdown to get formatted elements with links
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const elements = parseMarkdownForWord(msg.content);
      
      // Process each element (paragraph or list)
      elements.forEach(element => {
        if (element.type === 'paragraph' && element.runs) {
          // Process runs in this paragraph
          let currentX = margin;
          
          element.runs.forEach(run => {
            // Check if we need a new page
            if (y > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              y = margin;
              currentX = margin;
            }
            
            // Set font style
            doc.setFont('helvetica', run.bold ? 'bold' : 'normal');
            
            // Split text to fit width
            const remainingWidth = maxWidth - (currentX - margin);
            const textLines = doc.splitTextToSize(run.text, remainingWidth);
            
            textLines.forEach((line: string, lineIndex: number) => {
              if (lineIndex > 0) {
                y += lineHeight;
                currentX = margin;
                
                if (y > doc.internal.pageSize.getHeight() - 20) {
                  doc.addPage();
                  y = margin;
                }
              }
              
              if (run.link) {
                // Add clickable link
                doc.setTextColor(0, 0, 255); // Blue color for links
                const textWidth = doc.getTextWidth(line);
                doc.textWithLink(line, currentX, y, { url: run.link });
                doc.setTextColor(0, 0, 0); // Reset to black
                currentX += textWidth;
              } else {
                // Regular text
                doc.text(line, currentX, y);
                currentX += doc.getTextWidth(line);
              }
            });
          });
          
          y += lineHeight + 3; // Add spacing after paragraph
          
        } else if (element.type === 'list' && element.items) {
          // Process list items
          element.items.forEach(itemRuns => {
            if (y > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              y = margin;
            }
            
            // Add bullet
            doc.text('•', margin, y);
            let currentX = margin + 8;
            
            // Process runs in this list item
            itemRuns.forEach(run => {
              doc.setFont('helvetica', run.bold ? 'bold' : 'normal');
              
              const remainingWidth = maxWidth - (currentX - margin);
              const textLines = doc.splitTextToSize(run.text, remainingWidth);
              
              textLines.forEach((line: string, lineIndex: number) => {
                if (lineIndex > 0) {
                  y += lineHeight;
                  currentX = margin + 8;
                  
                  if (y > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    y = margin;
                    currentX = margin + 8;
                  }
                }
                
                if (run.link) {
                  doc.setTextColor(0, 0, 255);
                  const textWidth = doc.getTextWidth(line);
                  doc.textWithLink(line, currentX, y, { url: run.link });
                  doc.setTextColor(0, 0, 0);
                  currentX += textWidth;
                } else {
                  doc.text(line, currentX, y);
                  currentX += doc.getTextWidth(line);
                }
              });
            });
            
            y += lineHeight + 2;
          });
          
          y += 3; // Extra spacing after list
        }
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

      // Parse markdown content into formatted elements
      const elements = parseMarkdownForWord(msg.content);
      
      // Convert elements to Word paragraphs
      const paragraphs: any[] = [];
      
      paragraphs.push(
        new Paragraph({
          text: `${role} - ${timestamp}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      
      // Convert TextRunElement array to TextRun/ExternalHyperlink children
      function convertRuns(runs: TextRunElement[]): any[] {
        return runs.map(run => {
          if (run.link) {
            // If linkChildren exist, use them to preserve mixed formatting
            const children = run.linkChildren
              ? run.linkChildren.map(childRun => 
                  new TextRun({
                    text: childRun.text,
                    style: "Hyperlink",
                    bold: childRun.bold,
                    italics: childRun.italic,
                  })
                )
              : [
                  new TextRun({
                    text: run.text,
                    style: "Hyperlink",
                    bold: run.bold,
                    italics: run.italic,
                  })
                ];
            
            return new ExternalHyperlink({
              children: children,
              link: run.link,
            });
          } else {
            return new TextRun({
              text: run.text,
              bold: run.bold,
              italics: run.italic,
            });
          }
        });
      }
      
      // Process each element
      elements.forEach((element) => {
        if (element.type === 'paragraph' && element.runs) {
          const children = convertRuns(element.runs);
          paragraphs.push(
            new Paragraph({
              children: children,
              spacing: { after: 100 },
            })
          );
        } else if (element.type === 'list' && element.items) {
          // Add list items as paragraphs with bullets
          element.items.forEach(itemRuns => {
            const children = convertRuns(itemRuns);
            paragraphs.push(
              new Paragraph({
                children: children,
                bullet: {
                  level: 0,
                },
                spacing: { after: 50 },
              })
            );
          });
        }
      });
      
      return paragraphs;
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
