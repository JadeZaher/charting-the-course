# **Code Change Checklist**

#### **Phase 1: Database Schema (The Foundation)**

* [ ] **Update shared/schema.ts - Users Table**  
  * Add permissions: jsonb("permissions").default([]).  
  * Add isArchived: boolean("is_archived").default(false).  
* [ ] **Update shared/schema.ts - Quizzes/Assignments**  
  * Add hidden_from_user to quizzes table (Boolean, default false).  
  * Add submitted_by to quiz_results (UUID, nullable).  
* [ ] **Create shared/schema.ts - Profile Tiles**  
  * Define profile_tiles table (id, user_id, submission_id, type, data, layout_index, is_visible).  
* [ ] **CRITICAL: Migrate Existing Admins**  
  * Create a SQL script or Edge Function to find all users where role = 'admin'.  
  * Update their permissions column to: ['manage_users', 'manage_content', 'proxy_quiz', 'view_analytics'].

#### **Phase 2: The "Stop Work" & Cleanup**

* [ ] **Disable Gamification Backend**  
  * Comment out achievements/calculate-achievements trigger.  
* [ ] **Clean Sidebar (AppSidebar.tsx)**  
  * Remove "Teams" and "Map View" links.  
* [ ] **Clean Profile UI (Profile.tsx & PublicProfile.tsx)**  
  * Delete <Tabs>, <TabsList>, <TabsContent>.  
  * Delete specific "Journey" and "Connections" sections.  
  * Delete <UserProgress> and <StatCard>.

#### **Phase 3: Security & Permissions Migration**

* [ ] **Update Auth Hook (useRoleAccess.tsx / usePermission.tsx)**  
  * Rename hook. Replace role checks with permissions.includes(...).  
* [ ] **Update Admin User Management (UserManagement.tsx)**  
  * **List:** Filter out archived users (default). Add "Archive" button.  
  * **Edit Modal:** Replace Role Dropdown with **Permissions Checkboxes**.  
* [ ] **API Security**  
  * Update Supabase RLS policies to check permissions JSON.

#### **Phase 4: The Logic Switch (Survey to Tile)**

* [ ] **Create Strategy Engine (functions/process-submission)**  
  * Map SurveyID to Strategy.  
  * Logic: Answers to Strategy to **Generate Tile JSON** (No Pass/Fail) to Insert to profile_tiles.  
* [ ] **Deprecate Old Taggers**  
  * Stop writing to user_badges / user_tags for display purposes.

#### **Phase 5: "Ghost Mode" (Admin Proxy)**

* [ ] **Update QuizManagement.tsx**  
  * Add toggle: "Hide from User Dashboard" (hidden_from_user = true).  
* [ ] **Update TakeQuiz.tsx**  
  * If canTakeQuizForOthers: Show "Select Target User" dropdown.  
  * Submit targetUserId to backend.  
* [ ] **Update Dashboard.tsx**  
  * Filter available quizzes: WHERE hidden_from_user = false.

#### **Phase 6: The "One Page" Profile**

* [ ] **Create TileRenderer.tsx**  
  * Render visual based on type (Badge, Text, Chart).  
* [ ] **Rebuild Profile.tsx (User's Own View)**  
  * Fetch profile_tiles to Map & Render.  
* [ ] **Rebuild PublicProfile.tsx (Public View)**  
  * Fetch profile_tiles (where is_visible is true).  
  * **Inject Alignment:** Call the alignment function (User A vs User B), generate a temporary "Alignment Tile" object, and inject it into the top of the grid list before rendering.