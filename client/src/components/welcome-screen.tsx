import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Target, DollarSign, TrendingUp, School } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Personal College Advisor</h1>
            <p className="text-lg text-muted-foreground">
              Unbiased AI-powered guidance for your educational journey
            </p>
          </div>
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              <ReactMarkdown>
                Hello, I am an unbiased AI-driven college advisor that can help you make informed decisions about **College Selection**, **Degree Planning**, **Scholarships & Aid**, and provide **Degree ROI Analysis**. Please tell me a little bit about yourself and your goals. My goal is to make recommendations that are in your best interest and lead to a degree path that ultimately has jobs that will not leave you having regrets about your choice. Tell me a bit about what you'd like me to help you figure out.
              </ReactMarkdown>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Value Propositions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <School className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">College Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Find schools that match your goals and budget
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Degree Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose programs with strong career outcomes
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Scholarships & Aid</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover funding opportunities tailored to you
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">ROI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand costs, salaries, and repayment timelines
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button 
              onClick={onStart} 
              size="lg" 
              className="w-full"
              data-testid="button-start-session"
            >
              Start Your Advisor Session
            </Button>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          Your conversation can be downloaded at any time for future reference
        </p>
      </div>
    </div>
  );
}
