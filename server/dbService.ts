import { eq, and, or, sql, SQL } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  teams,
  teamMembers,
  courses,
  quizzes,
  quizAssignments,
  quizResults,
  quizProgress,
  type User,
  type Team,
  type Course,
  type Quiz,
  type QuizAssignment,
  type QuizResult,
  type QuizProgressType,
} from "@shared/schema";

type TableName = 
  | "users"
  | "teams"
  | "team_members"
  | "courses"
  | "quizzes"
  | "quiz_assignments"
  | "quiz_results"
  | "quiz_progress";

const tableMap = {
  users,
  teams,
  team_members: teamMembers,
  courses,
  quizzes,
  quiz_assignments: quizAssignments,
  quiz_results: quizResults,
  quiz_progress: quizProgress,
} as const;

type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in";

interface QueryBuilder<T> {
  select: (columns?: string) => Promise<T[]>;
  single: () => Promise<T | null>;
  eq: (column: string, value: any) => QueryBuilder<T>;
  neq: (column: string, value: any) => QueryBuilder<T>;
  gt: (column: string, value: any) => QueryBuilder<T>;
  gte: (column: string, value: any) => QueryBuilder<T>;
  lt: (column: string, value: any) => QueryBuilder<T>;
  lte: (column: string, value: any) => QueryBuilder<T>;
  in: (column: string, values: any[]) => QueryBuilder<T>;
  or: (filters: Array<{ column: string; operator: FilterOperator; value: any }>) => QueryBuilder<T>;
  order: (column: string, direction?: "asc" | "desc") => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
}

interface MutationBuilder<T> {
  insert: (data: any) => Promise<T[]>;
  update: (data: any) => UpdateBuilder<T>;
  delete: () => DeleteBuilder;
}

interface UpdateBuilder<T> {
  eq: (column: string, value: any) => Promise<T[]>;
  match: (filters: Record<string, any>) => Promise<T[]>;
}

interface DeleteBuilder {
  eq: (column: string, value: any) => Promise<void>;
  match: (filters: Record<string, any>) => Promise<void>;
}

class SupabaseStyleQueryBuilder<T> implements QueryBuilder<T> {
  private table: any;
  private filters: SQL[] = [];
  private orderBy: { column: any; direction: "asc" | "desc" }[] = [];
  private limitCount?: number;

  constructor(table: any) {
    this.table = table;
  }

  eq(column: string, value: any): QueryBuilder<T> {
    this.filters.push(eq(this.table[column], value));
    return this;
  }

  neq(column: string, value: any): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} != ${value}`);
    return this;
  }

  gt(column: string, value: any): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} > ${value}`);
    return this;
  }

  gte(column: string, value: any): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} >= ${value}`);
    return this;
  }

  lt(column: string, value: any): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} < ${value}`);
    return this;
  }

  lte(column: string, value: any): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} <= ${value}`);
    return this;
  }

  in(column: string, values: any[]): QueryBuilder<T> {
    this.filters.push(sql`${this.table[column]} IN ${values}`);
    return this;
  }

  or(filters: Array<{ column: string; operator: FilterOperator; value: any }>): QueryBuilder<T> {
    const orConditions = filters.map(f => {
      switch (f.operator) {
        case "eq": return eq(this.table[f.column], f.value);
        case "neq": return sql`${this.table[f.column]} != ${f.value}`;
        case "gt": return sql`${this.table[f.column]} > ${f.value}`;
        case "gte": return sql`${this.table[f.column]} >= ${f.value}`;
        case "lt": return sql`${this.table[f.column]} < ${f.value}`;
        case "lte": return sql`${this.table[f.column]} <= ${f.value}`;
        default: return eq(this.table[f.column], f.value);
      }
    });
    this.filters.push(or(...orConditions) as SQL);
    return this;
  }

  order(column: string, direction: "asc" | "desc" = "asc"): QueryBuilder<T> {
    this.orderBy.push({ column: this.table[column], direction });
    return this;
  }

  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  async select(columns?: string): Promise<T[]> {
    let query = db.select().from(this.table);
    
    if (this.filters.length > 0) {
      query = query.where(and(...this.filters)) as any;
    }

    if (this.orderBy.length > 0) {
      const orderByClauses = this.orderBy.map(({ column, direction }) =>
        direction === "asc" ? column : sql`${column} DESC`
      );
      query = query.orderBy(...orderByClauses) as any;
    }

    if (this.limitCount) {
      query = query.limit(this.limitCount) as any;
    }

    return query as Promise<T[]>;
  }

  async single(): Promise<T | null> {
    const results = await this.limit(1).select();
    return results[0] || null;
  }
}

class SupabaseStyleMutationBuilder<T> implements MutationBuilder<T> {
  private table: any;

  constructor(table: any) {
    this.table = table;
  }

  async insert(data: any | any[]): Promise<T[]> {
    const dataArray = Array.isArray(data) ? data : [data];
    return db.insert(this.table).values(dataArray).returning() as Promise<T[]>;
  }

  update(data: any): UpdateBuilder<T> {
    const self = this;
    return {
      async eq(column: string, value: any): Promise<T[]> {
        return db.update(self.table)
          .set(data)
          .where(eq(self.table[column], value))
          .returning() as Promise<T[]>;
      },
      async match(filters: Record<string, any>): Promise<T[]> {
        const conditions = Object.entries(filters).map(([col, val]) =>
          eq(self.table[col], val)
        );
        return db.update(self.table)
          .set(data)
          .where(and(...conditions))
          .returning() as Promise<T[]>;
      },
    };
  }

  delete(): DeleteBuilder {
    const self = this;
    return {
      async eq(column: string, value: any): Promise<void> {
        await db.delete(self.table).where(eq(self.table[column], value));
      },
      async match(filters: Record<string, any>): Promise<void> {
        const conditions = Object.entries(filters).map(([col, val]) =>
          eq(self.table[col], val)
        );
        await db.delete(self.table).where(and(...conditions));
      },
    };
  }
}

export class SupabaseStyleDB {
  from<T = any>(tableName: TableName): QueryBuilder<T> & MutationBuilder<T> {
    const table = tableMap[tableName];
    const queryBuilder = new SupabaseStyleQueryBuilder<T>(table);
    const mutationBuilder = new SupabaseStyleMutationBuilder<T>(table);

    return {
      ...queryBuilder,
      ...mutationBuilder,
    } as QueryBuilder<T> & MutationBuilder<T>;
  }

  async rpc(fnName: string, params?: any): Promise<any> {
    throw new Error("RPC not implemented yet - add custom stored procedures here");
  }
}

export const dbService = new SupabaseStyleDB();
