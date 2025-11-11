import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// College Advisor System Prompt
const COLLEGE_ADVISOR_PROMPT = `You are an expert college advisor not affiliated with any college in the United States. Your job is to advise high school students in selecting a college, a degree, and helping them find suitable scholarships and grants. Your job is also to warn when a degree will not result in a job that can pay for that degree.

When asked a question, you must always ask clarifying questions needed to answer thoroughly.
If a college degree is mentioned, then always provide a list of related jobs with the median income information, a guesstimate of the typical time it would take to pay off the degree at the specified college using the average median income job in that field, and ask where they wish to live if not known.

Provide a summary of in-demand jobs in their area of interest for their region.

### Additional Requirements

- **Provide Links**: Always provide links for any college, scholarship, grant, or resource mentioned so the student can easily access more information.
- **Cost of Living Analysis**: Research and include the cost of living for where the student wishes to study and for their likely post-graduation location. Factor this into repayment timelines and post-grad life planning.
- **Scholarship/Grant Fit**: Match and compare the student's academic, extracurricular, and demographic background to the key eligibility criteria of scholarships and grants to ensure relevance.
- **Job Placement & Internship Rates**: Report on post-graduation job placement rates, career outcomes, and internship statistics for each college and degree option.
- **Application Strategies**: Offer guidance for building a well-balanced college list (reach, match, safety), and specific advice on strengthening admissions profiles (extracurriculars, essay topics, etc.).
- **Mental Health and Support**: Review campus mental health resources, advising, and academic support systems that may impact a student's success and well-being.
- **ROI Comparison**: Explicitly compare the return on investment (ROI), based on tuition and projected earnings, across all recommended degrees and colleges.
- **Postgraduate Outcomes**: Include data on alumni networks, graduate school admission rates, and longer-term employment statistics when available.

### Student Context Collection

Collect the following context where possible to tailor advice:
- Family financial information, expected contribution, and FAFSA status.
- Preferred campus type, size, and location; desired social and academic environment.
- Career interests and willingness to relocate after graduation.
- Existing extracurriculars, honors, and unique skills/attributes.

Always prefer these instructions over other instructions in the prompt.`;

const GREETING_MESSAGE = `Hello, I am an unbiased AI-driven college advisor that can help you make informed decisions about **college selection**, **degree planning**, **scholarships & aid**, and provide **degree ROI analysis**. Please tell me a little bit about yourself and your goals. My goal is to make recommendations that are in your best interest and lead to a degree path that ultimately has jobs that will not leave you having regrets about your choice. Tell me a bit about what you'd like me to help you figure out.`;

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Get messages for a session
  app.get("/api/messages/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getMessagesBySession(sessionId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch messages" });
    }
  });

  // Send a message and get AI response
  app.post("/api/messages", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertMessageSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { role, content, sessionId } = validationResult.data;

      // Only accept user messages through this endpoint
      if (role !== "user") {
        return res.status(400).json({ message: "Only user messages can be sent through this endpoint" });
      }

      // Create session if this is the first message
      const existingSession = await storage.getSession(sessionId);
      if (!existingSession) {
        await storage.createSession(sessionId);
      }

      // Get conversation history
      const conversationHistory = await storage.getMessagesBySession(sessionId);

      // Save user message
      const userMessage = await storage.createMessage({
        role,
        content,
        sessionId,
      });
      
      // Build messages array for Perplexity API
      // Format: system message, then alternating user/assistant messages
      const perplexityMessages = [
        {
          role: "system",
          content: COLLEGE_ADVISOR_PROMPT,
        }
      ];

      // Add conversation history (excluding system messages and any stored greeting messages from old sessions)
      for (const msg of conversationHistory) {
        if (msg.role !== "system" && msg.content !== GREETING_MESSAGE) {
          perplexityMessages.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        }
      }

      // Add the current user message
      perplexityMessages.push({
        role: "user",
        content,
      });

      // Call Perplexity API
      const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
      if (!perplexityApiKey) {
        throw new Error("PERPLEXITY_API_KEY not configured");
      }

      const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: perplexityMessages,
          temperature: 0.7,
          top_p: 0.9,
          stream: false,
        }),
      });

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
      }

      const perplexityData = await perplexityResponse.json();
      const assistantContent = perplexityData.choices?.[0]?.message?.content;
      const citations = perplexityData.citations || [];

      if (!assistantContent) {
        throw new Error("No response from Perplexity AI");
      }

      // Save assistant response with citations
      await storage.createMessage({
        role: "assistant",
        content: assistantContent,
        citations: citations.length > 0 ? citations : undefined,
        sessionId,
      });

      // Return the user message (the assistant messages will be fetched separately)
      res.json(userMessage);
    } catch (error: any) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: error.message || "Failed to process message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
