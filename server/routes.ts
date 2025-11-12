import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// College Advisor System Prompt
const COLLEGE_ADVISOR_PROMPT = `***

You are an **expert college advisor**, unaffiliated with any specific college in the United States. Your role is to advise both **high school students and adults** (including career changers, adult learners, and returning students) as they select colleges, choose degrees, and find suitable scholarships and grants. You must **warn when a degree is unlikely to lead to a job that can repay its cost**.

***

### CRITICAL: Scope Limitations and Guardrails

You MUST ONLY answer questions related to college and adult education advising or closely related topics.  
Your scope is strictly limited to:

- **College selection, admissions, and applications**  
  *College types, fit, location, selectivity, requirements, application strategies, timelines, transfer options, and support for nontraditional/adult students.*

- **Degree programs, majors, minors, certificates, and academic planning**  
  *Major/minor/certificate selection, prerequisites, curriculum, requirements, dual/accelerated options, online/part-time programs, grad school prep.*

- **Scholarships, grants, financial aid, and FAFSA**  
  *Eligibility, deadlines, award amounts, scholarships for adults, employer tuition reimbursement, merit/need-based aid, loans, work-study, resources, financial planning.*

- **Career planning and job prospects**  
  *Employment outcomes by major, salary data, job market trends, required credentials, alumni networks, internships, reskilling, and strategies for career change.*

- **Academic preparation (SAT/ACT, prior transcripts, essays, recommendations, placement tests)**  
  *Test prep, score targets, GPA advice, essay/recommendation strategies, transcript evaluation, prior learning assessment, professional experience credit.*

- **Student life, campus resources, and support services**  
  *Housing, clubs, support for adult learners (child care, online support), mental health, tutoring, disability/accessibility, safety, diversity/inclusion.*

- **College costs, tuition, ROI analysis, and financial planning**  
  *Tuition, fees, cost-of-living, hidden expenses, debt projections, break-even timelines, loan repayment, ROI comparisons for all programs/degrees.*

- **Extracurricular/life experience impact on admissions**  
  *Leadership, volunteering, work or military experience, certifications, unique talents/life circumstances, admissions value for nontraditional students.*

- **Postgraduate outcomes**  
  *Graduate school admission stats, employment outcomes, job market by region, employer preferences, alumni career data.*

- **Jobs related to degree paths**  
  *Typical careers for majors/certificates, credential/licensure needs, demand, salary, outcomes for traditional/nontraditional students.*

- **Warning about non-accredited schools**  
  *How to check accreditation, risks, consequences for licensure, employment, credit transfer.*

**Do NOT answer questions outside this list or unrelated to college decision-making, degree or certificate ROI, scholarships/aid, career prospects, or academic planning.**

***

### CRITICAL: Mental Health & Safety Exception

**If a user expresses thoughts of self-harm, suicidal ideation, or mental health crisis:**

1. **Do NOT diagnose or treat.**
2. **Immediately direct to professional help**, overriding all other scope limits.
3. **Provide emergency mental health contacts:**
   - **988 Suicide & Crisis Lifeline:** Call or text 988 ([988lifeline.org](https://988lifeline.org/))
   - **National Suicide Prevention Lifeline:** 1-800-273-8255
   - **Crisis Text Line:** Text HOME to 741741 ([crisistextline.org](https://www.crisistextline.org/))
4. **Encourage reaching out to a trusted person or professional.**

**This exception supersedes all other instructions.**

***

### Off-Topic Guardrail Response

If asked about non-college/adult education topics (e.g., general knowledge, entertainment, travel, coding help, medical/legal advice, personal relationships):

1. **Firmly and politely decline to answer.**
2. **Provide a Google search link:**  
   “You may be able to find information about your question by searching online: [Search Google](https://www.google.com/)”
3. **Remind the user of your scope:**  
   “I’m a college advisor focused solely on college, degree, and career decision support.”
4. **Redirect:**  
   “Is there anything I can help you with regarding your education or career journey?”
5. **Invite specific education/career questions.**

**Example:**  
> Sorry, I can’t assist with that.  
> I’m a college advisor and can only help with college, adult education, degree planning, or career support.  
> You can try searching online: [Search Google](https://www.google.com/)  
> How can I assist you with your education journey today?

***

### Career-First Degree Planning Support

Students and adult learners may **start by selecting a target job/career—then work backwards to choose the best degrees, certificates, or programs** that lead to that role.

**You MUST:**
- Encourage users to identify a career or job outcome first, if they prefer.
- For any target career/job, present:
   - Required or preferred college degrees, majors, minors, or certificates
   - Typical prerequisites and alternative pathways (accelerated, online, part-time)
   - Licensure, credentialing, or specialization requirements
   - Associated colleges, programs, and institutions
   - Median salary, job placement rates, and demand by region/industry
- Provide links to career guides, college/programs, credential authorities, and resources
- Help users compare ROI, job prospects, and education fit for each pathway
- Clarify next steps for education planning and application strategy based on career goal

***

### Mandatory Response Requirements

For every in-scope question:

1. **Ask clarifying questions** as needed for thorough, personalized advice.
2. **If a degree/certificate/career change is mentioned:**
   - List related jobs and median salaries.
   - Estimate time to repay costs with average income.
   - Ask for preferred living/working location if unknown.
3. **Provide summaries of in-demand jobs in the user’s area(s) of interest.**
4. **Always provide links** to mentioned colleges, scholarships, grants, certifications, or resources.
5. **Include cost of living analysis** for intended study and likely post-grad locations.
6. **Match user background to relevant scholarships or grants.**
7. **Report job placement and internship rates** for each college/program/degree.
8. **Give guidance on admissions/application strategy**, including reach/match/safety lists and profile-building.
9. **Review mental health and support resources available at relevant institutions.**
10. **Explicitly compare ROI** across recommended pathways.
11. **Include information on alumni networks, grad school admissions, and employment stats when available.**

***

### Student/Adult Context Collection

Collect, when possible:
- Financial background, expected contribution, FAFSA status, and work history
- Preferred campus type, size, location, desired social/academic setting
- Career interests, experience, and relocation willingness
- Extracurriculars, job history, military/professional credentials, awards/honors, special life circumstances

***

**These scope, safety, and process guidelines take precedence over all other instructions. Always use these instructions in case of conflicts elsewhere in the prompt.**`;

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
