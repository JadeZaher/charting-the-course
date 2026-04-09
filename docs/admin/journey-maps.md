# Journey Maps — Admin Operations Manual

Journey Maps are the structured orientation sequences that guide a new member through an ETHOS. This document covers everything an admin or facilitator needs to create, configure, and publish a Journey Map.

---

## 1. What a Journey Map Is

A Journey Map is an ordered sequence of steps that a user works through when they begin their orientation with an ETHOS. Each step presents content or asks for a response — a video to watch, a question to answer, a reflection to write, or a conversation with OmniBot. When all required steps are complete, the user receives an Exit Package and is handed off to continued engagement.

Journey Maps are per-ETHOS. A single ETHOS can have multiple maps (for example, different maps for different role types or alignment ranges), but only one is marked as the **Default map for this ETHOS** — the one assigned to new members automatically.

Maps live at **Admin → Journey Maps** in the navigation.

---

## 2. Creating a Map

Navigate to **Admin → Journey Maps** and click **Create Journey Map** (or open an existing map to edit it).

The **Map Details** section contains the map's identity and routing fields:

| Field | Notes |
|---|---|
| **Title** | Human-readable name. Displayed to admins; not shown to members during the journey. |
| **Slug** | Auto-generated from the title as a URL-safe identifier (e.g. `intro-to-greenearth`). Edit manually if needed. Must be unique. |
| **Description** | Internal note on the map's purpose. Not shown to members. |
| **ETHOS Organization** | The ETHOS this map belongs to. Select from the dropdown. Required if you want the map to appear in that ETHOS's orientation flow. |
| **Min Alignment Score** | Minimum alignment score (0–100) a user must have to be assigned this map. Leave at `0` to apply to all members regardless of alignment. |
| **Sector Alignment** | Comma-separated sector tags (e.g. `tech, nonprofit`). Used for routing logic if multiple maps exist for the same ETHOS. |
| **Role Types** | Comma-separated role identifiers (e.g. `facilitator, member, steward`). Used for routing when role-specific maps are needed. |
| **Active** | Toggle off to disable the map without deleting it. Inactive maps are never assigned to new members. |
| **Default map for this ETHOS** | When on, this map is assigned to any new member who doesn't match a more specific map. Only one map per ETHOS should have this on. |

Click **Save Map** at any time to persist changes. The page URL updates to the map's ID after the first save.

---

## 3. Step Types and When to Use Each

Steps are added in the **Steps** section using the row of buttons at the bottom: **Video**, **Choice**, **AI Conversation**, **Confirmation**, **Reflection**, **Survey / Quiz**.

Every step has three common fields:

- **Title** — shown to the member as the step heading
- **Description** — optional sub-text or instructions shown below the title
- **Required** toggle — if off, the member can skip this step

Steps can be reordered by dragging the grip handle on the left of each step card.

---

### Video

Plays a hosted video. Use this for welcome messages, explainer content, or any media that should be watched before proceeding.

- **Video URL** — paste the full URL of the video (YouTube embed, Vimeo, direct MP4, etc.)

---

### Choice

Presents the member with a set of options and captures their selection. Use this for branching paths, role self-selection, or preference capture.

Each choice has three sub-fields:

| Sub-field | Purpose |
|---|---|
| **Value** | Internal identifier stored with the response (e.g. `builder`, `connector`). No spaces. |
| **Label** | Display text shown to the member (e.g. `I'm a builder`). |
| **Description** | Optional clarifying text under the label. |

Click **Add Choice** to add more options. At least one choice is required.

---

### AI Conversation

Opens a live OmniBot conversation embedded in the step. Use this for intake conversations, open-ended exploration, or guided self-reflection that benefits from a back-and-forth dialogue.

- **AI Prompt Template** — the system prompt passed to OmniBot for this conversation. Write it as instructions to the AI, describing what it should ask or explore with the user.
- **Session Type** — controls OmniBot's conversational mode:
  - **Orientation** — general ETHOS orientation context
  - **Intake** — structured 3–5 exchange intake flow; OmniBot asks short open questions and summarises at the end
  - **Ongoing** — open-ended, no structured endpoint

---

### Confirmation

Presents a single checkbox the member must tick before continuing. Use this for consent statements, acknowledgements, or agreement to terms.

- **Confirmation Label** — the text next to the checkbox (e.g. `I understand and agree to proceed`).

---

### Reflection

Presents a text prompt and captures a free-form written response. Use this for journaling, values articulation, or any question where a member's own words matter.

- **Reflection Prompt** — the question or prompt displayed to the member (e.g. `What draws you to this work?`).

---

### Survey / Quiz

Embeds a published quiz from the Quizzes library into the journey step. Use this for structured assessments, onboarding surveys, or multi-question forms.

- **Quiz / Survey** — select from the dropdown of published quizzes. Only quizzes marked as published appear here.

---

## 4. content_sequence Structure

Internally, the ordered list of steps is stored as a `content_sequence` JSONB array on the journey map record. Each element in the array corresponds to one step card in the editor.

Each step object includes:

```json
{
  "id": "abc12345",
  "type": "video",
  "title": "Welcome to GreenEarth",
  "description": "Watch this short intro before continuing.",
  "required": true,
  "branch_condition": null
}
```

Type-specific fields are merged into the same object. For example, a `video` step adds `video_url`; a `choice` step adds `choices` (array) and `choice_routes` (map of value → next step ID); an `ai_conversation` step adds `ai_prompt_template` and `session_type`.

**You do not edit `content_sequence` directly.** The step builder in the editor writes to it on every save. This section is provided so you understand what is stored if you need to inspect or migrate data.

### Branch Conditions

Each step optionally has a `branch_condition` that controls whether the step is shown to a particular user. Enable it with the **Branch condition** toggle inside any step card.

- **Dimension** — the profile dimension key to evaluate (e.g. `leadership`, `collaboration`)
- **Min Score** — the minimum score on that dimension required for this step to appear

If the user's dimension score is below the threshold, the step is skipped automatically. Use this to show advanced content only to members who have demonstrated a particular trait.

---

## 5. Connecting to an ETHOS

A Journey Map is connected to an ETHOS through the **ETHOS Organization** dropdown in Map Details. Selecting an ETHOS does two things:

1. The map becomes available for assignment when a user begins orientation for that ETHOS.
2. The **Default map for this ETHOS** toggle becomes meaningful — if enabled, this map is automatically assigned to any new member who doesn't match a more specific map via `min_alignment_score`, `sector_alignment`, or `role_types` routing.

If no map is set as default for an ETHOS, new members will not be automatically assigned a journey. They will see a "no journey available" state in the orientation flow.

To manage which users have access to an ETHOS at all, use the **Manage Access** (Shield) button on the ETHOS row in the Admin ETHOS tab.

---

## 6. Exit Package

The Exit Package is what the member receives when they complete all required steps. Configure it in the **Exit Package** section at the bottom of the editor.

It has four parts:

| Section | Purpose |
|---|---|
| **Documents** | Links to PDFs, guides, or reference materials the member should keep (e.g. member handbook, onboarding checklist). Each item has a **Label** and an optional **URL**. |
| **Tools** | Links to platforms, tools, or resources the member will use (e.g. project management tool, Slack workspace). |
| **Next Steps** | Action items or suggested next actions after orientation ends (e.g. "Book a call with your facilitator"). |
| **OmniBot Handoff Prompt** | A system prompt passed to OmniBot after the journey is complete. This shapes OmniBot's behaviour in any subsequent conversations with this member — use it to brief OmniBot on what the member completed and what ongoing support they might need. |

Each item in Documents, Tools, and Next Steps uses the same two fields: **Label** (display text) and **URL** (optional link). Click **Add** to add items, and the trash icon to remove them.

---

## 7. Publishing and User Progress

### Publishing a Map

A map is live when **Active** is toggled on and it is saved. There is no separate "publish" step. Toggling **Active** off immediately removes the map from being assigned to new members (existing in-progress journeys are not affected).

If you want to test a map before it goes live, create it with **Active** off and preview the steps by navigating directly to the map in the editor. Turn **Active** on when ready.

### How Users Are Assigned a Map

When a user enters an ETHOS orientation flow (`/orientation/:ethos_slug`), the system checks for an existing progress record. If none exists, it selects a Journey Map for that ETHOS using this priority:

1. A map matching the user's `min_alignment_score`, `sector_alignment`, or `role_types` (most specific match wins)
2. The map with **Default map for this ETHOS** enabled (fallback)

The assigned map ID is stored on the user's progress record and does not change mid-journey, even if you update the map.

### User Progress

User progress is tracked per ETHOS per user. Each step completion is saved with:

- **current_step** — the index of the step the user is on
- **step_key** — an identifier for the completed step (e.g. `step_0`, `step_1`)
- **step_response** — the user's response for that step (video: null, choice: selected value, reflection: written text, etc.)
- **status** — `in_progress` while the journey is running; `complete` when the final step is finished

When `status` is `complete`, the user is redirected to `/orientation/:ethos_slug/complete` where they receive the Exit Package.

Progress records are not deleted when a map is edited. If you add, remove, or reorder steps on a live map, users mid-journey may experience a mismatch between their saved `current_step` index and the updated step list. Avoid structural changes to active maps while users are in progress. Make structural edits before activating a map, or create a new map version instead.
