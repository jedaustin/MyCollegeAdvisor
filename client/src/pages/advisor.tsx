import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Send, 
  Mic, 
  Download, 
  MessageSquare, 
  Clock,
  GraduationCap,
  MicOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";
import { WelcomeScreen } from "@/components/welcome-screen";
import { SessionStats } from "@/components/session-stats";
import { DownloadDialog } from "@/components/download-dialog";

export default function AdvisorPage() {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Fetch messages for the current session
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", sessionId],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        role: "user",
        content,
        sessionId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      setInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Speech recognition error",
          description: "Please check your microphone permissions",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const [showWelcome, setShowWelcome] = useState(true);
  const hasStartedConversation = messages.length > 0;

  // Hide welcome screen once conversation starts or user clicks start
  const shouldShowWelcome = showWelcome && !hasStartedConversation && !isLoading;

  if (shouldShowWelcome) {
    return (
      <WelcomeScreen
        onStart={() => {
          setShowWelcome(false);
          setTimeout(() => textareaRef.current?.focus(), 100);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Personal College Advisor</h1>
            <p className="text-sm text-muted-foreground">AI-powered guidance</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="default"
          onClick={() => setShowDownloadDialog(true)}
          disabled={messages.length === 0}
          data-testid="button-download"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                    data-testid={`message-${message.role}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <GraduationCap className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <Card className={`max-w-2xl ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card'
                    }`}>
                      <div className="p-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className={`whitespace-pre-wrap text-base leading-relaxed ${
                            message.role === 'user' ? 'text-primary-foreground' : 'text-card-foreground'
                          }`}>
                            {message.content}
                          </p>
                        </div>
                        <p className={`mt-2 text-xs ${
                          message.role === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-muted-foreground'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </Card>

                    {message.role === 'user' && (
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-muted">
                          <MessageSquare className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              
              {sendMessageMutation.isPending && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <GraduationCap className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="max-w-2xl">
                    <div className="p-4">
                      <div className="flex gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary"></div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about colleges, degrees, scholarships, or career guidance..."
                    className="min-h-24 max-h-40 resize-none pr-12"
                    disabled={sendMessageMutation.isPending}
                    data-testid="input-message"
                  />
                  <div className="absolute bottom-3 right-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleSpeechRecognition}
                      disabled={sendMessageMutation.isPending}
                      className={isListening ? 'text-destructive' : ''}
                      data-testid="button-speech"
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessageMutation.isPending}
                  size="lg"
                  data-testid="button-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden w-80 border-l bg-muted/30 lg:block">
          <div className="p-6 space-y-6">
            <SessionStats 
              messageCount={messages.length}
              sessionStart={messages[0]?.timestamp}
            />
          </div>
        </aside>
      </div>

      <DownloadDialog
        open={showDownloadDialog}
        onOpenChange={setShowDownloadDialog}
        messages={messages}
      />
    </div>
  );
}
