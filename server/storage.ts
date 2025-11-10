import { type Message, type InsertMessage, type Session, type InsertSession } from "@shared/schema";
import { db } from "../db";
import { messages, sessions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  
  // Session operations
  createSession(id: string): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
}

export class DbStorage implements IStorage {
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }

  async createSession(id: string): Promise<Session> {
    const [session] = await db.insert(sessions).values({ id }).returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }
}

export const storage = new DbStorage();
