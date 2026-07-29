/**
 * Route-scoped governance guidance.
 *
 * Content is grounded in the binding governance/matching product rules:
 * matching is decision support (never authority), consent is granular and
 * fail-closed, ceremony positions are distinct, decisions are read-ledger
 * receipts, domains are single-parent, and member rights (exit, conflict
 * reporting, data revocation) are never buried.
 *
 * To guide a new surface, add an entry whose prefix matches the route's
 * first path segment. Longest-prefix wins, so specific routes can override
 * broad ones.
 */

export interface GuideSection {
  title: string;
  steps: string[];
  link?: { to: string; label: string };
}

export interface RouteGuide {
  /** Route prefix, matched on a path-segment boundary ("/agreements" matches "/agreements/123"). */
  prefix: string;
  title: string;
  intro: string;
  sections: GuideSection[];
}

const guides: RouteGuide[] = [
  {
    prefix: "/",
    title: "Dashboard",
    intro: "Your governance home — what needs your input comes first.",
    sections: [
      {
        title: "Needs my input",
        steps: [
          "Start here: pending ceremonies, proposals awaiting your position, and reflections nearing completion surface first.",
          "Acting from this lens keeps stand-asides and objections from stalling lifecycle progress.",
        ],
      },
      {
        title: "Your ecosystems",
        steps: [
          "Switch scope with the ecosystem picker in the header — lists and counts follow the selected ecosystem.",
          "You hold a separate membership and role tier in each ecosystem you belong to.",
        ],
      },
      {
        title: "Where to start",
        steps: [
          "Discover explores ecosystems and public dossiers across the network.",
          "Onboarding continues any orientation journey you have started.",
          "Me holds your profile, consent scopes, and data rights.",
        ],
        link: { to: "/discover", label: "Open Discover" },
      },
    ],
  },
  {
    prefix: "/dashboard",
    title: "Dashboard",
    intro: "Your governance home — what needs your input comes first.",
    sections: [
      {
        title: "Needs my input",
        steps: [
          "Start here: pending ceremonies, proposals awaiting your position, and reflections nearing completion surface first.",
          "Acting from this lens keeps stand-asides and objections from stalling lifecycle progress.",
        ],
      },
      {
        title: "Your ecosystems",
        steps: [
          "Switch scope with the ecosystem picker in the header — lists and counts follow the selected ecosystem.",
          "You hold a separate membership and role tier in each ecosystem you belong to.",
        ],
      },
    ],
  },
  {
    prefix: "/agreements",
    title: "Agreements",
    intro: "Published, versioned commitments that gate participation.",
    sections: [
      {
        title: "Read before consenting",
        steps: [
          "Open any agreement to read its full text and current version — inspection never requires consent.",
          "Check the version: matching and fit only run against published, current versions.",
          "Only protected people and contact data sits behind consent — the agreement text itself is always readable.",
        ],
      },
      {
        title: "Consent & participate",
        steps: [
          "The detail page is the ceremony surface: record your own attestation there.",
          "Consent is granular — access, directory visibility, direct contact, and matching data are separate scopes.",
          "Some agreements require test evidence before activation; complete it on the same page.",
          "Your position is recorded exactly as given — a recorded position is never displayed as assent.",
        ],
      },
      {
        title: "Create or amend",
        steps: [
          "Use New agreement and declare whether individual consent is required, which participation scopes it gates, and the alignment credit.",
          "Edits produce a new version — prior versions stay readable under History.",
          "Presentation can never bypass the API lifecycle: activation follows consent and evidence, not the other way round.",
        ],
        link: { to: "/agreements/new", label: "New agreement" },
      },
      {
        title: "Withdraw & review",
        steps: [
          "You may withdraw with a reason — a withdrawal window of 7 days follows signature.",
          "An agreement overdue for review is structurally stale and outranks personal fit everywhere it appears.",
        ],
      },
    ],
  },
  {
    prefix: "/proposals",
    title: "Proposals",
    intro: "Proposals attach to one ecosystem or one domain — never free-floating.",
    sections: [
      {
        title: "Draft a proposal",
        steps: [
          "Create it from the list and attach it to the ecosystem or domain it governs.",
          "Reference the agreements it would create or amend so reviewers can trace intent.",
        ],
        link: { to: "/proposals/new", label: "New proposal" },
      },
      {
        title: "Deliberate",
        steps: [
          "Members record distinct positions: consent, stand aside, or object — objections carry their reasoning.",
          "A stand-aside is not consent; it must be resolved before the lifecycle advances.",
        ],
      },
      {
        title: "Outcome",
        steps: [
          "An accepted proposal transforms into a decision receipt producing agreements, shares, or needs.",
          "Outcomes are read from the decision ledger — they are never edited after the fact.",
        ],
        link: { to: "/decisions", label: "Open decisions" },
      },
    ],
  },
  {
    prefix: "/decisions",
    title: "Decisions",
    intro: "Decisions are transformation receipts — a read ledger, not CRUD.",
    sections: [
      {
        title: "Read the ledger",
        steps: [
          "Each decision records what it produced: agreements, shares, or needs.",
          "Fulfilling a need produces its own receipt, linked back to its origin.",
        ],
      },
      {
        title: "Trace a decision",
        steps: [
          "Open a record to see the proposal it came from and the records it created.",
          "Nothing here is editable by design — history is the guarantee.",
        ],
      },
      {
        title: "Disagree with a record?",
        steps: [
          "Use the correction and dispute workflow in Conflicts — records are corrected by new decisions, not edits.",
        ],
        link: { to: "/conflicts", label: "Open conflicts" },
      },
    ],
  },
  {
    prefix: "/ecosystems",
    title: "Ecosystems",
    intro: "One membership per ecosystem; roles are per-ecosystem tiers.",
    sections: [
      {
        title: "Explore before joining",
        steps: [
          "The governance dossier is inspectable before any consent — charter, domains, and agreements included.",
          "Only protected people and contact data is gated behind consent.",
        ],
      },
      {
        title: "Join = request to begin orientation",
        steps: [
          "Joining starts orientation: prospective, then onboarding, then active.",
          "Walk the orientation journey at your own pace — the fit-check inside it is optional and only advisory.",
          "A 48-hour reflection applies after the walkthrough before consent counts; it is enforced on server time.",
          "A 7-day withdrawal window follows signature — leaving early is easy and non-punitive.",
        ],
      },
      {
        title: "Roles & stewards",
        steps: [
          "Tiers run user, moderator, admin, owner — separately in every ecosystem.",
          "Stewards are listed on the ecosystem page; contact them directly with questions.",
          "Admins and owners manage role tiers from the member record.",
        ],
      },
      {
        title: "Fit estimates",
        steps: [
          "Matching is decision support, never admission — a fit estimate creates no membership, consent, role, or visibility.",
          "Estimates show evidence coverage, versions, and reasons — never a raw percentage, and nothing below 60% coverage.",
        ],
      },
    ],
  },
  {
    prefix: "/domains",
    title: "Domains",
    intro: "Strictly single-parent areas of responsibility inside one ecosystem.",
    sections: [
      {
        title: "Understand the tree",
        steps: [
          "Every domain has exactly one parent — the tree never forks upward.",
          "Cross-ecosystem work happens through collaboration agreements with dual admin consent, never by re-parenting domains.",
        ],
      },
      {
        title: "Stewardship",
        steps: [
          "Each domain has a steward, shown on the domain page — message them directly about its scope.",
          "Stewards keep domain documentation current: matching and proposals only run against documented domains.",
        ],
      },
      {
        title: "Work with a domain",
        steps: [
          "Proposals and agreements attach to domains from their respective pages.",
          "Open a domain to see its agreements, members, and active proposals in context.",
        ],
      },
    ],
  },
  {
    prefix: "/members",
    title: "Members",
    intro: "The community of this ecosystem — directory visibility is consent-gated.",
    sections: [
      {
        title: "Directory & consent",
        steps: [
          "You see members whose directory consent allows it — an absence is a consent choice, not an error.",
          "Your own directory visibility is yours to set and revoke at any time from Me.",
        ],
        link: { to: "/me", label: "Manage my consent" },
      },
      {
        title: "Roles",
        steps: [
          "Every member holds a per-ecosystem tier: user, moderator, admin, owner.",
          "Owners can set any tier; admins can set user and moderator — from the member record.",
          "Complexity hides behind tier and process, never by deleting records.",
        ],
      },
      {
        title: "Member rights",
        steps: [
          "Exit and conflict reporting are always available — never buried, never punitive.",
          "Members can inspect, export, and revoke their own data regardless of role.",
        ],
        link: { to: "/exit", label: "Open exit" },
      },
    ],
  },
  {
    prefix: "/onboarding",
    title: "Onboarding",
    intro: "Orientation journeys and consent ceremonies.",
    sections: [
      {
        title: "The journey",
        steps: [
          "Each journey walks the ecosystem's orientation steps in order.",
          "The fit-check is an optional stage inside orientation — its estimate is advisory only.",
        ],
      },
      {
        title: "Ceremony positions",
        steps: [
          "Positions are distinct: consent, stand aside, object, withdrawn, pending.",
          "A stand-aside never counts as consent and must be resolved before the lifecycle advances.",
          "Objections carry their reasoning into the record.",
        ],
      },
      {
        title: "Reflection & withdrawal",
        steps: [
          "A 48-hour reflection runs on server time before consent becomes eligible.",
          "After signature, a 7-day withdrawal window remains open.",
        ],
      },
    ],
  },
  {
    prefix: "/conflicts",
    title: "Conflicts",
    intro: "Correction and dispute — a member right, always reachable.",
    sections: [
      {
        title: "Report",
        steps: [
          "File a conflict or harm report from here — no role is required.",
          "Reporting is non-punitive and never bundled with other actions.",
        ],
        link: { to: "/conflicts/new", label: "Report a conflict" },
      },
      {
        title: "Resolve",
        steps: [
          "Resolution happens through repair agreements attached to the conflict.",
          "Records are corrected by new decisions — nothing is silently deleted.",
        ],
      },
      {
        title: "Your rights",
        steps: [
          "Exit remains available at any point, regardless of an open conflict.",
        ],
        link: { to: "/exit", label: "Open exit" },
      },
    ],
  },
  {
    prefix: "/exit",
    title: "Exit",
    intro: "Leaving is voluntary, easy, and non-punitive.",
    sections: [
      {
        title: "Start an exit",
        steps: [
          "Open an exit record from here — it is your right, not a request.",
          "Your data export and revocation rights travel with you.",
        ],
        link: { to: "/exit/new", label: "Begin exit" },
      },
      {
        title: "Settle",
        steps: [
          "Outstanding agreements, shares, and needs are settled per the ecosystem's published agreements.",
          "Exit never erases the decision ledger — receipts remain as history.",
        ],
      },
      {
        title: "After leaving",
        steps: [
          "Matching data can be revoked and deleted from Me.",
          "Rejoining later starts a fresh orientation — there is no penalty record.",
        ],
      },
    ],
  },
  {
    prefix: "/emergency",
    title: "Emergency",
    intro: "Time-critical governance instruments with declared scope and expiry.",
    sections: [
      {
        title: "Scope",
        steps: [
          "An emergency instrument overrides normal cadence only within its declared scope and only until its expiry.",
        ],
      },
      {
        title: "Act",
        steps: [
          "Follow the active instrument's stated steps — everything done under it is logged.",
        ],
      },
      {
        title: "Review",
        steps: [
          "Expired emergencies are audited under Safeguards; extraordinary action always faces later review.",
        ],
        link: { to: "/safeguards", label: "Open safeguards" },
      },
    ],
  },
  {
    prefix: "/safeguards",
    title: "Safeguards",
    intro: "Health summaries and audits of the governance system itself.",
    sections: [
      {
        title: "Health",
        steps: [
          "The dashboard summarizes governance health across the ecosystem.",
        ],
      },
      {
        title: "Audits",
        steps: [
          "Browse past audits or request a new one; open a record for findings and evidence.",
          "Audit findings feed proposals and agreements — they never edit records directly.",
        ],
      },
    ],
  },
  {
    prefix: "/compliance",
    title: "Compliance",
    intro: "AI-assisted synthesis over governance records.",
    sections: [
      {
        title: "Generate a report",
        steps: [
          "Run a synthesis and give it time — generation is heavyweight.",
          "If it fails, the error is shown with a retry; nothing is silently dropped.",
        ],
      },
      {
        title: "Read reports",
        steps: [
          "Latest and historical reports are listed here.",
          "Treat synthesis as decision support — it carries no authority over records or members.",
        ],
      },
    ],
  },
  {
    prefix: "/discover",
    title: "Discover",
    intro: "Cross-ecosystem exploration: dossiers, shares, needs, collaborations.",
    sections: [
      {
        title: "Explore",
        steps: [
          "Browse ecosystems and their public governance dossiers — inspection never requires consent.",
          "Shares and needs listed here are active and public by their authors' choice.",
        ],
      },
      {
        title: "Fit estimates",
        steps: [
          "Fit is decision support, never admission — it grants no membership, consent, role, or visibility.",
          "Estimates come with evidence coverage, versions, and reasons; nothing shows below 60% coverage.",
          "Statuses read: more to learn, promising, discuss before deciding, not a recommended entry path.",
        ],
      },
      {
        title: "Engage",
        steps: [
          "Request to begin orientation from an ethos dossier when one resonates.",
          "Cross-ecosystem collaboration uses collaboration agreements requiring consent from both ecosystems' admins.",
        ],
      },
    ],
  },
  {
    prefix: "/ethos",
    title: "Ethos dossier",
    intro: "The public governance dossier of an ecosystem.",
    sections: [
      {
        title: "Inspect first",
        steps: [
          "Charter, domains, and agreements are readable before you consent to anything.",
          "Browsing creates no obligation and no visibility for you.",
        ],
      },
      {
        title: "Protected data",
        steps: [
          "People and contact details sit behind granular consent: access, directory, direct contact, and matching are separate scopes.",
          "A consent prompt failing protects your data first — retry rather than assume it opened.",
        ],
      },
      {
        title: "Next step",
        steps: [
          "Begin orientation from here when ready — it starts as a request, not a commitment.",
        ],
      },
    ],
  },
  {
    prefix: "/orientation",
    title: "Orientation",
    intro: "The guided path into an ecosystem.",
    sections: [
      {
        title: "Walk the journey",
        steps: [
          "Complete the orientation steps in order; your progress is saved.",
          "The fit-check is optional and advisory — it can inform, never decide.",
        ],
      },
      {
        title: "Reflect",
        steps: [
          "After the walkthrough, a 48-hour reflection applies before consent is counted — enforced on server time.",
        ],
      },
      {
        title: "Decide",
        steps: [
          "Consent, stand aside, or object — each position is recorded distinctly and honestly.",
          "A 7-day withdrawal window follows any signature.",
        ],
      },
    ],
  },
  {
    prefix: "/me",
    title: "Me",
    intro: "Your profile, consent scopes, and data rights in one place.",
    sections: [
      {
        title: "Profile",
        steps: [
          "Bio, links, skills, interests, and projects are platform-wide — the public member profile is always public.",
          "Ecosystem roles and domain participation show as membership records.",
        ],
      },
      {
        title: "Consent & data",
        steps: [
          "Review each consent scope — access, directory, contact, matching — and revoke any of them here.",
          "Export or delete your matching data at any time; revocation is never punished.",
        ],
      },
      {
        title: "Activity",
        steps: [
          "Quiz history and notification preferences live on this page.",
        ],
      },
    ],
  },
  {
    prefix: "/messaging",
    title: "Messaging",
    intro: "Member conversations and the governance AI chat.",
    sections: [
      {
        title: "Conversations",
        steps: [
          "Start direct or group conversations with members across all ecosystems you belong to.",
          "The people picker respects your authorized ecosystems and everyone's consent scopes.",
        ],
      },
      {
        title: "AI governance chat",
        steps: [
          "The agent can act within your permissions — drafting proposals, checking authority, reading records.",
          "Its output is decision support; it never grants membership, roles, or consent.",
        ],
      },
    ],
  },
];

/**
 * Longest prefix match on a segment boundary, so "/agreements/123/history"
 * resolves to the agreements guide while "/ag" resolves to nothing.
 */
export function getRouteGuide(pathname: string): RouteGuide | null {
  const path = pathname.split("?")[0];
  let best: RouteGuide | null = null;
  for (const guide of guides) {
    if (path === guide.prefix || path.startsWith(guide.prefix + "/")) {
      if (!best || guide.prefix.length > best.prefix.length) best = guide;
    }
  }
  return best;
}
