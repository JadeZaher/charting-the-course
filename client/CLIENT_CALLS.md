# Client API Calls Inventory

> Generated from `charting-the-course/client/src/lib/api-client.ts` + hooks — 2026-06-10

## API Client Wrappers (`api-client.ts`)

### Health & Skills
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchHealth()` | `/api/v1/health` | GET |
| `fetchSkills(layer?)` | `/api/v1/skills` | GET |

### Auth
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchChallenge(did)` | `/api/v1/auth/challenge` | POST |
| `fetchVerify(params)` | `/api/v1/auth/verify` | POST |
| `fetchMe()` | `/api/v1/auth/me` | GET |
| `fetchLogout()` | `/api/v1/auth/logout` | POST |
| `loginWithPassword(u,p)` | `/api/v1/auth/login` | POST |
| `setCredentials(u,p)` | `/api/v1/auth/set-credentials` | POST |
| `registerWithPassword(u,p,dn?)` | `/api/v1/auth/register` | POST |
| `resetDid()` | `/api/v1/auth/did/reset` | POST |
| `linkDid(params)` | `/api/v1/auth/did/link` | POST |

### OAuth
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchOAuthProviders()` | `/api/v1/auth/oauth/providers` | GET |
| `getOAuthUrl(provider)` | `/api/v1/auth/oauth/:provider` | GET |

### Ecosystems
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchEcosystems()` | `/api/v1/ecosystems` | GET |
| `fetchEcosystem(id)` | `/api/v1/ecosystems/:id` | GET |
| `fetchEcosystemsList(params)` | `/api/v1/ecosystems` | GET |
| `createEcosystemRecord(data)` | `/api/v1/ecosystems` | POST |
| `updateEcosystemRecord(id,data)` | `/api/v1/ecosystems/:id` | PUT |
| `requestJoinEcosystem(id)` | `/api/v1/ecosystems/:id/join` | POST |
| `fetchEcosystemQuizzes(id)` | `/api/v1/ecosystems/:id/quizzes` | GET |
| `assignQuizToEcosystem(id,qid,e)` | `/api/v1/ecosystems/:id/quizzes/assign` | POST |
| `unassignQuizFromEcosystem(id,qid)` | `/api/v1/ecosystems/:id/quizzes/unassign` | POST |
| `fetchEcosystemSharesNeeds(id,p?)` | `/api/v1/ecosystems/:id/shares-needs` | GET |

### Dashboard
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchDashboardSummary()` | `/api/v1/dashboard/summary` | GET |

### Agreements
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchAgreements(params)` | `/api/v1/agreements` | GET |
| `fetchAgreement(id)` | `/api/v1/agreements/:id` | GET |
| `createAgreement(data)` | `/api/v1/agreements` | POST |
| `updateAgreement(id,data)` | `/api/v1/agreements/:id` | PUT |
| `updateAgreementStatus(id,s)` | `/api/v1/agreements/:id/status` | POST |
| `fetchAgreementHistory(id)` | `/api/v1/agreements/:id/history` | GET |
| `rollbackAgreement(id,vid)` | `/api/v1/agreements/:id/rollback/:vid` | POST |

### Proposals
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchProposals(params)` | `/api/v1/proposals` | GET |
| `fetchProposal(id)` | `/api/v1/proposals/:id` | GET |
| `createProposal(data)` | `/api/v1/proposals` | POST |
| `updateProposal(id,data)` | `/api/v1/proposals/:id` | PUT |
| `updateProposalStatus(id,s)` | `/api/v1/proposals/:id/status` | POST |
| `fetchProposalAdvice(id)` | `/api/v1/proposals/:id/advice` | GET |
| `submitAdvice(id,data)` | `/api/v1/proposals/:id/advice` | POST |
| `fetchProposalConsent(id)` | `/api/v1/proposals/:id/consent` | GET |
| `submitConsent(id,data)` | `/api/v1/proposals/:id/consent` | POST |
| `fetchProposalTest(id)` | `/api/v1/proposals/:id/test` | GET |
| `submitTestReport(id,data)` | `/api/v1/proposals/:id/test` | POST |

### Members
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchMembers(params)` | `/api/v1/members` | GET |
| `fetchMember(id)` | `/api/v1/members/:id` | GET |
| `createMember(data)` | `/api/v1/members` | POST |
| `updateMember(id,data)` | `/api/v1/members/:id` | PUT |
| `fetchMemberOnboarding(id)` | `/api/v1/members/:id/onboarding` | GET |
| `fetchMemberProfile(id)` | `/api/v1/members/:id/profile` | GET |

### Domains
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchDomains(params)` | `/api/v1/domains` | GET |
| `fetchDomain(id)` | `/api/v1/domains/:id` | GET |
| `createDomain(data)` | `/api/v1/domains` | POST |
| `updateDomain(id,data)` | `/api/v1/domains/:id` | PUT |
| `fetchDomainQuizzes(id)` | `/api/v1/domains/:id/quizzes` | GET |
| `assignQuizToDomain(did,qid,e)` | `/api/v1/domains/:id/quizzes/assign` | POST |
| `unassignQuizFromDomain(did,qid)` | `/api/v1/domains/:id/quizzes/unassign` | POST |
| `fetchDomainSharesNeeds(id,p?)` | `/api/v1/domains/:id/shares-needs` | GET |

### Decisions
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchDecisions(params)` | `/api/v1/decisions` | GET |
| `fetchDecision(id)` | `/api/v1/decisions/:id` | GET |

### Onboarding
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchOnboardings(params)` | `/api/v1/onboarding` | GET |
| `fetchOnboardingCeremony(id)` | `/api/v1/onboarding/:id/ceremony` | GET |
| `submitCeremonyConsent(id,d)` | `/api/v1/onboarding/:id/ceremony` | POST |

### Conflicts
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchConflicts(params)` | `/api/v1/conflicts` | GET |
| `fetchConflict(id)` | `/api/v1/conflicts/:id` | GET |
| `createConflict(data)` | `/api/v1/conflicts` | POST |
| `updateConflict(id,data)` | `/api/v1/conflicts/:id` | PUT |
| `createRepairAgreement(id,d)` | `/api/v1/conflicts/:id/repair` | POST |

### Emergency
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchEmergencyState()` | `/api/v1/emergency` | GET |
| `fetchEmergencyDetail(id)` | `/api/v1/emergency/:id` | GET |
| `declareEmergency(data)` | `/api/v1/emergency/declare` | POST |
| `resolveEmergency(id)` | `/api/v1/emergency/:id/resolve` | POST |

### Exit
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchExits(params)` | `/api/v1/exit` | GET |
| `fetchExit(id)` | `/api/v1/exit/:id` | GET |
| `createExit(data)` | `/api/v1/exit` | POST |
| `updateExitStatus(id,data)` | `/api/v1/exit/:id/status` | POST |

### Safeguards
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchSafeguards()` | `/api/v1/safeguards` | GET |
| `fetchAudits(params)` | `/api/v1/safeguards/audits` | GET |
| `fetchAudit(id)` | `/api/v1/safeguards/audits/:id` | GET |
| `requestAudit(data)` | `/api/v1/safeguards/audits` | POST |

### Messaging
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchConversations()` | `/api/v1/messaging/conversations` | GET |
| `fetchConversation(id)` | `/api/v1/messaging/conversations/:id` | GET |
| `createConversation(data)` | `/api/v1/messaging/conversations` | POST |
| `sendConversationMessage(id,c)` | `/api/v1/messaging/conversations/:id/messages` | POST |
| `fetchConversationMessages(id,p?)` | `/api/v1/messaging/conversations/:id/messages` | GET |
| `searchMessages(q)` | `/api/v1/messaging/search` | GET |
| `fetchMembersList()` | `/api/v1/messaging/members` | GET |

### Courses & Quizzes
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchCourses(params)` | `/api/v1/courses` | GET |
| `fetchCourse(id)` | `/api/v1/courses/:id` | GET |
| `createCourse(data)` | `/api/v1/courses` | POST |
| `fetchQuizzes(params)` | `/api/v1/quizzes` | GET |
| `fetchQuiz(id)` | `/api/v1/quizzes/:id` | GET |
| `createQuiz(data)` | `/api/v1/quizzes` | POST |
| `updateQuiz(id,data)` | `/api/v1/quizzes/:id` | PUT |
| `deleteQuiz(id)` | `/api/v1/quizzes/:id` | DELETE |
| `submitQuizResult(id,data)` | `/api/v1/quizzes/:id/submit` | POST |
| `fetchQuizResults(id,p?)` | `/api/v1/quizzes/:id/results` | GET |
| `fetchQuizResultsAdmin(id,p?)` | `/api/v1/quizzes/:id/results/all` | GET |
| `fetchMemberQuizHistory(id)` | `/api/v1/members/:id/quiz-history` | GET |
| `fetchMemberBadges(id)` | `/api/v1/members/:id/badges` | GET |
| `fetchMemberTags(id)` | `/api/v1/members/:id/tags` | GET |

### Chat
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchChatSessions(params)` | `/api/v1/chat/sessions` | GET |
| `fetchChatSession(id)` | `/api/v1/chat/sessions/:id` | GET |
| `deleteChatSession(id)` | `/api/v1/chat/sessions/:id` | DELETE |
| `updateChatSessionPrivacy(id,p)` | `/api/v1/chat/sessions/:id/privacy` | PATCH |
| SSE hook (in `use-chat.ts`) | `/api/v1/chat/send` | POST (SSE) |

### Discover
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchDiscover(params)` | `/api/v1/discover` | GET |
| `fetchSharesNeeds(params)` | `/api/v1/discover/shares-needs` | GET |
| `fetchSharesNeedsAdmin(params)` | `/api/v1/discover/shares-needs/admin` | GET |
| `createSharesNeeds(data)` | `/api/v1/discover/shares-needs` | POST |
| `updateSharesNeeds(id,data)` | `/api/v1/discover/shares-needs/:id` | PUT |
| `updateSharesNeedsStatus(id,s)` | `/api/v1/discover/shares-needs/:id/status` | POST |
| `deleteSharesNeeds(id)` | `/api/v1/discover/shares-needs/:id` | DELETE |
| `fetchCollaborations(params)` | `/api/v1/discover/collaborations` | GET |
| `fetchCollaboration(id)` | `/api/v1/discover/collaborations/:id` | GET |
| `createCollaboration(data)` | `/api/v1/discover/collaborations` | POST |

### Compliance
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchComplianceLatest()` | `/api/v1/compliance/latest` | GET |
| `fetchComplianceHistory(params)` | `/api/v1/compliance/history` | GET |
| `generateCompliance()` | `/api/v1/compliance/generate` | POST |

### AI Assist
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `aiAssist(data)` | `/api/v1/ai/assist` | POST |

### Orientation
| Client Function | Backend Endpoint | Method |
|----------------|-----------------|--------|
| `fetchEthosJourneyMaps(id,incl?)` | `/api/v1/orientation/ethos/:id/journey-maps` | GET |
| `fetchOrientationProgress(id)` | `/api/v1/orientation/ethos/:id/progress` | GET |
| `saveOrientationProgress(id,d)` | `/api/v1/orientation/ethos/:id/progress` | POST |
| `saveGenplanInput(data)` | `/api/v1/orientation/genplan-input` | POST |
| `createJourneyMap(id,data)` | `/api/v1/orientation/ethos/:id/journey-maps` | POST |
| `updateJourneyMap(id,data)` | `/api/v1/orientation/journey-maps/:id` | PUT |
| `deleteJourneyMap(id)` | `/api/v1/orientation/journey-maps/:id` | DELETE |

### Notifications
**(No client wrappers exist)**

---

## React Query Hooks Inventory

| Hook File | Covers |
|-----------|--------|
| `use-api.ts` | `useHealth()`, `useSkills()`, `useDashboardSummary()` |
| `use-governance.ts` | Agreements, Proposals, Members, Domains, Decisions, Onboarding, Conflicts, Ecosystems, Emergency, Exit, Safeguards |
| `use-governance-list.ts` | Shared filter/pagination state for governance list pages |
| `use-auth.ts` | Auth context (challenge/verify/me) |
| `use-chat.ts` | Chat SSE streaming |
| `use-courses.ts` | Courses CRUD |
| `use-discover.ts` | Discover feed |
| `use-ecosystem-filter.ts` | Ecosystem scope filtering |
| `use-messaging.ts` | Conversations, messages |
| `use-notifications.ts` | Push notification subscription (browser-level, not API) |
| `use-ai-assist.ts` | AI assist text generation |

## Pages with API calls

| Page | Endpoints Called |
|------|-----------------|
| `EmergencyDashboard` | `fetchEmergencyState()`, `declareEmergency()` |
| `EmergencyDetail` | `fetchEmergencyDetail()`, `resolveEmergency()` |
| `ExitList` | `fetchExits()` |
| `ExitDetail` | `fetchExit()` |
| `ExitForm` | `createExit()` |
| `ComplianceDashboard` | `compliance/latest`, `compliance/history`, `compliance/generate` |
| `SafeguardsDashboard` | `fetchSafeguards()` |
| `AuditList`/`AuditDetail` | `fetchAudits()`, `fetchAudit()` |
| `ConflictList`/`ConflictDetail`/`ConflictForm` | `fetchConflicts()`, `fetchConflict()`, `createConflict()`, `updateConflict()` |
| `RepairAgreementForm` | `createRepairAgreement()` |
