import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionStatsProps {
  messageCount: number;
  sessionStart?: Date | string;
}

export function SessionStats({ messageCount, sessionStart }: SessionStatsProps) {
  const duration = sessionStart 
    ? formatDistanceToNow(new Date(sessionStart), { addSuffix: false })
    : "Not started";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold" data-testid="text-message-count">{messageCount}</p>
            <p className="text-sm text-muted-foreground">Messages</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold" data-testid="text-session-duration">{duration}</p>
            <p className="text-sm text-muted-foreground">Session length</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
