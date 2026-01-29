# Tile Architecture Implementation Plan

**Version:** 2.9 (Final - Public Bucket Note Added)
**Stack:** Supabase (Edge Functions), Drizzle ORM, React
**Status:** Ready for Coding

---

## Phase 1: Database Foundation

**Goal:** Create storage that supports Event Sourcing, Layout Stability, and Security.

### 1.1 Update Shared Schema (`shared/schema.ts`)

Append these tables to your existing schema.

```typescript
import { pgTable, text, integer, boolean, jsonb, uuid, timestamp } from "drizzle-orm/pg-core";
import { users } from "./schema";

// 1. The Immutable History Log
export const surveySubmissions = pgTable("survey_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  surveyId: text("survey_id").notNull(),
  surveyVersion: integer("survey_version").default(1),
  rawResult: jsonb("raw_result").notNull(),
  submittedBy: uuid("submitted_by"),
  isOfficial: boolean("is_official").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. The UI Cache (What the frontend reads)
export const profileTiles = pgTable("profile_tiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  submissionId: uuid("submission_id").references(() => surveySubmissions.id, { onDelete: 'cascade' }),
  
  // Logic & Rendering
  tileType: text("tile_type").notNull(), // e.g. "RADAR_CHART"
  tileKey: text("tile_key").notNull(),   // e.g. "personality_radar" (Tracks layout)
  data: jsonb("data").notNull(),         // e.g. { labels: [], values: [] }
  
  // State
  isLocked: boolean("is_locked").default(false),
  isVisible: boolean("is_visible").default(true),
  sortOrder: integer("sort_order").default(0),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

```

### 1.2 RLS Policies (Security Layer)

Run this SQL in your Supabase SQL Editor.

```sql
-- 1. View: Anyone (or Auth only) can view tiles
CREATE POLICY "View Tiles" ON profile_tiles FOR SELECT USING (true);

-- 2. Update: User can ONLY toggle visibility if NOT locked
CREATE POLICY "Update Visibility" ON profile_tiles FOR UPDATE
USING (auth.uid() = user_id AND is_locked = false)
WITH CHECK (auth.uid() = user_id AND is_locked = false);

-- 3. Delete: User can ONLY delete if NOT locked
CREATE POLICY "Delete Tiles" ON profile_tiles FOR DELETE
USING (auth.uid() = user_id AND is_locked = false);

```

### 1.3 Create Storage Bucket (Critical)

1. Create a new bucket in Supabase Storage named `tile-assets`.
2. **IMPORTANT:** Toggle "Public" to **ON**. (Images will fail to load if this is missed).
3. Add RLS Policy: `Grant SELECT to anon` (Public Read), `Grant INSERT/UPDATE to service_role` (Admin Write).

---

## Phase 2: The Transformation Engine (Edge Functions)

**Goal:** Securely process surveys with Transactional Safety, Validation, and Fallback support.

### 2.1 Dependencies (`supabase/functions/import_map.json`)

```json
{
  "imports": {
    "drizzle-orm": "https://esm.sh/drizzle-orm@0.29.3",
    "postgres": "https://deno.land/x/postgresjs@v3.4.3/mod.js",
    "zod": "https://deno.land/x/zod@v3.21.4/mod.ts"
  }
}

```

### 2.2 Strategy Interface & Fallback (`strategies/index.ts`)

```typescript
export interface TileConfig {
  tileType: string;
  tileKey: string;
  data: Record<string, any>;
  defaultSortOrder?: number;
}

export interface ProcessingContext {
  rawResult: any;
  isOfficial: boolean;
}

export type StrategyFunction = (ctx: ProcessingContext) => TileConfig[];

import { personalityStrategy } from "./personality.ts";

export const STRATEGY_MAP: Record<string, StrategyFunction> = {
  "personality-v1": personalityStrategy,
};

// FALLBACK STRATEGY (Prevents crashes on unknown surveys)
export const defaultStrategy: StrategyFunction = () => [{
  tileType: "TEXT_BLOCK",
  tileKey: "fallback_summary",
  data: { title: "Survey Completed", content: "Result saved." },
  defaultSortOrder: 99
}];

```

### 2.3 Concrete Strategy with Validation (`strategies/personality.ts`)

**New:** Validates input with `zod` and uses dynamic storage URLs.

```typescript
import { z } from "zod";
import { TileConfig, ProcessingContext } from "./index.ts";

// Define the expected shape of the survey result
const SurveySchema = z.object({
  score_total: z.number().optional().default(0),
  trait_openness: z.number().optional().default(0),
  trait_focus: z.number().optional().default(0),
  trait_speed: z.number().optional().default(0),
});

const STORAGE_BASE = "https://[YOUR_PROJECT].supabase.co/storage/v1/object/public/tile-assets/badges/";

export const personalityStrategy = ({ rawResult }: ProcessingContext): TileConfig[] => {
  // Validate (Safe Parse prevents crashes)
  const result = SurveySchema.parse(rawResult);
  
  return [
    {
      tileType: "RADAR_CHART",
      tileKey: "personality_radar", 
      data: {
        title: "Dimensions",
        labels: ["Openness", "Focus", "Speed"],
        values: [result.trait_openness, result.trait_focus, result.trait_speed]
      },
      defaultSortOrder: 0
    },
    {
      tileType: "BADGE_GRID",
      tileKey: "personality_badges", 
      data: {
        title: "Achievements",
        badges: [
           { iconUrl: `${STORAGE_BASE}wizard.svg`, label: "Wizard", description: "Top 10% Score" }
        ]
      },
      defaultSortOrder: 1
    }
  ];
};

```

### 2.4 The Processor (`process-submission/index.ts`)

**New:** Includes real Admin Check.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { surveySubmissions, profileTiles } from "../../../shared/schema.ts";
import { eq, inArray, and } from "drizzle-orm";
import { STRATEGY_MAP, defaultStrategy } from "./strategies/index.ts";

const connectionString = Deno.env.get("SUPABASE_DB_URL")!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response("Missing Auth", { status: 401 });
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  const { surveyId, rawResult, userId, isOfficial } = await req.json();

  // 2. IDENTITY / ADMIN CHECK
  // Check if user is trying to submit for someone else
  if (user.id !== userId) {
      // Fetch user role from DB (assuming you have a roles table or metadata)
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
      const isAdmin = roleData?.role === 'admin';
      
      if (!isAdmin) return new Response("Forbidden: ID Mismatch", { status: 403 });
  }

  try {
    // 3. TRANSACTION
    await db.transaction(async (tx) => {
        // A. Archive
        const [submission] = await tx.insert(surveySubmissions).values({
            userId, surveyId, rawResult, isOfficial: isOfficial || false,
        }).returning();

        // B. Transform
        const strategy = STRATEGY_MAP[surveyId] || defaultStrategy;
        const newConfigs = strategy({ rawResult, isOfficial });

        // C. Fetch Old Layouts
        const oldSubs = await tx.query.surveySubmissions.findMany({
            where: and(eq(surveySubmissions.userId, userId), eq(surveySubmissions.surveyId, surveyId)),
            columns: { id: true }
        });
        const oldSubIds = oldSubs.map(s => s.id).filter(id => id !== submission.id);

        let layoutMap = new Map();
        if (oldSubIds.length > 0) {
            const oldTiles = await tx.query.profileTiles.findMany({
                where: inArray(profileTiles.submissionId, oldSubIds),
                columns: { tileKey: true, sortOrder: true, isVisible: true }
            });
            oldTiles.forEach(t => layoutMap.set(t.tileKey, t));
        }

        // D. Wipe Old
        if (oldSubIds.length > 0) {
            await tx.delete(profileTiles).where(inArray(profileTiles.submissionId, oldSubIds));
        }

        // E. Insert New
        const tilesToInsert = newConfigs.map((config, index) => {
            const prev = layoutMap.get(config.tileKey);
            return {
                userId, submissionId: submission.id,
                tileType: config.tileType, tileKey: config.tileKey, data: config.data,
                isLocked: isOfficial || false,
                sortOrder: prev ? prev.sortOrder : (config.defaultSortOrder ?? index),
                isVisible: prev ? prev.isVisible : true, 
            };
        });
        await tx.insert(profileTiles).values(tilesToInsert);
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

```

---

## Phase 3: The Frontend (React)

**Prerequisite:** `npm install recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### 3.1 Tile Components (`client/src/components/profile/tiles/`)

**`BadgeGridTile.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function BadgeGridTile({ data }: { data: any }) {
  return (
    <Card>
      <CardHeader><CardTitle>{data.title}</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {data.badges.map((b: any, i: number) => (
          <Tooltip key={i}>
            <TooltipTrigger>
               <div className="flex flex-col items-center p-2 border rounded hover:bg-muted">
                 {/* Uses full URL from strategy */}
                 <img src={b.iconUrl} className="w-8 h-8 mb-1" />
                 <span className="text-xs font-bold">{b.label}</span>
               </div>
            </TooltipTrigger>
            <TooltipContent>{b.description}</TooltipContent>
          </Tooltip>
        ))}
      </CardContent>
    </Card>
  );
}

```

**`RadarTile.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export function RadarTile({ data }: { data: any }) {
  const chartData = data.labels.map((label: string, i: number) => ({
    subject: label, A: data.values[i], fullMark: 100,
  }));

  return (
    <Card className="h-full min-h-[300px]">
      <CardHeader><CardTitle>{data.title}</CardTitle></CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar name="Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

```

**`TextTile.tsx`**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TextTile({ data }: { data: any }) {
  return (
    <Card className="h-full">
      {data.title && <CardHeader><CardTitle>{data.title}</CardTitle></CardHeader>}
      <CardContent>
        <div className="prose dark:prose-invert text-sm">
          {data.content}
        </div>
      </CardContent>
    </Card>
  );
}

```

### 3.2 Registry (`TileRegistry.tsx`)

```tsx
import { RadarTile } from "./tiles/RadarTile";
import { BadgeGridTile } from "./tiles/BadgeGridTile";
import { TextTile } from "./tiles/TextTile";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const COMPONENT_MAP = {
  'RADAR_CHART': RadarTile,
  'BADGE_GRID': BadgeGridTile,
  'TEXT_BLOCK': TextTile,
};

export function TileRenderer({ tile }: { tile: any }) {
  const Component = COMPONENT_MAP[tile.tileType];
  const [isVisible, setIsVisible] = useState(tile.isVisible);
  
  if (!Component) return <div className="p-4 border border-red-500">Unknown: {tile.tileType}</div>;

  const toggleVisibility = async () => {
    if (tile.isLocked) return;
    setIsVisible(!isVisible); // Optimistic
    await supabase.from('profile_tiles').update({ is_visible: !isVisible }).eq('id', tile.id);
  };

  return (
    <div className={`relative group ${tile.isLocked ? 'border-gold' : ''}`}>
      <Component data={tile.data} />
      {!tile.isLocked && (
        <button onClick={toggleVisibility} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded shadow">
            {isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
        </button>
      )}
    </div>
  );
}

```

### 3.3 Sortable Grid (`SortableTileGrid.tsx`)

```tsx
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TileRenderer } from "./TileRegistry";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function SortableTileGrid({ tiles, onUpdate }: { tiles: any[], onUpdate: () => void }) {
  const [items, setItems] = useState(tiles);
  useEffect(() => setItems(tiles), [tiles]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over?.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      
      setItems(newItems); // Optimistic UI
      const updates = newItems.map((item, index) => ({ id: item.id, sortOrder: index }));
      await supabase.functions.invoke('update-layout', { body: { updates } });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((tile) => (
            <SortableItem key={tile.id} tile={tile} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ tile }: { tile: any }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tile.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TileRenderer tile={tile} />
    </div>
  );
}

```

---

## Phase 4: Integration & Routing

### 4.1 Update `SurveyRunner.tsx`

Refactor to accept `surveyId` as a prop.

```tsx
export const SurveyRunner = ({ surveyConfig, surveyId }: { surveyConfig: any, surveyId: string }) => {
  // ... existing code ...
  const handleComplete = async (sender: any) => {
    await supabase.functions.invoke('process-submission', {
       body: { surveyId, rawResult: sender.data, userId: user.id }
    });
  };
  // ...
};

```

### 4.2 Update Routing (`App.tsx` or `router.tsx`)

Ensure the new Admin page is accessible.

```tsx
// Add to your routes
<Route path="/admin/submit" element={<SubmitOnBehalf />} />

```

---

## Phase 5: Administration & Polish

### 5.1 Admin Submit Page (`client/src/pages/admin/SubmitOnBehalf.tsx`)

```tsx
import { useState } from "react";
import { SurveyRunner } from "@/components/SurveyRunner";
import { supabase } from "@/lib/supabase";

export default function SubmitOnBehalf() {
  const [targetUserId, setTargetUserId] = useState("");
  
  const onAdminComplete = async (sender: any) => {
     await supabase.functions.invoke('process-submission', {
        body: { 
           surveyId: "certification-v1", 
           rawResult: sender.data, 
           userId: targetUserId, 
           isOfficial: true // Forces Lock
        }
     });
     alert("Certified!");
  };

  return (
     <div className="p-10">
        <h1 className="text-2xl font-bold mb-4">Admin Submission</h1>
        <input placeholder="Target User ID" value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="border p-2 mb-4 block w-full"/>
        {/* Render SurveyJS Form Here */}
     </div>
  );
}

```

### 5.2 Layout API (`update-layout/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabase.auth.getUser(req.headers.get('Authorization'));
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { updates } = await req.json(); // [{ id: "...", sortOrder: 1 }]

  for (const update of updates) {
    await supabase.from('profile_tiles')
      .update({ sort_order: update.sortOrder })
      .eq('id', update.id)
      .eq('user_id', user.id); 
  }
  return new Response(JSON.stringify({ success: true }));
});

```

### 5.3 Migration Script (`scripts/migrate-survey.ts`)

*Note: Since you have no users yet, this is primarily for future use or testing.*

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("URL")!, Deno.env.get("SERVICE_KEY")!);
const TARGET_SURVEY_ID = "personality-v1";

const { data: submissions } = await supabase
  .from("survey_submissions")
  .select("*")
  .eq("survey_id", TARGET_SURVEY_ID);

for (const sub of submissions) {
  await fetch("https://[YOUR_PROJECT].supabase.co/functions/v1/process-submission", {
    method: "POST",
    headers: { 
       "Authorization": `Bearer ${Deno.env.get("SERVICE_KEY")}`, // Service Role
       "Content-Type": "application/json"
    },
    body: JSON.stringify({
      surveyId: sub.survey_id,
      rawResult: sub.raw_result,
      userId: sub.user_id,
      isOfficial: sub.is_official
    })
  });
}
console.log("Migration Complete.");

```

---

## Phase 6: Cleanup & Refactor (Critical)

**Goal:** Remove legacy debt to ensure a clean codebase.

### 6.1 Remove Legacy Files

Delete these files from your project structure:

* `client/src/components/examples/RoleBadge.tsx`
* `client/src/components/examples/StatCard.tsx`
* `client/src/components/examples/QuizCard.tsx` (Use `SurveyRunner` instead)

### 6.2 Update `Profile.tsx`

Replace the old hardcoded list with the new Sortable Grid.

```tsx
import { SortableTileGrid } from "@/components/profile/SortableTileGrid";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { data: tiles, refetch } = useQuery({
    queryKey: ['profileTiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profile_tiles').select('*').order('sort_order');
      return data;
    }
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <SortableTileGrid tiles={tiles || []} onUpdate={refetch} />
    </div>
  );
}

```
