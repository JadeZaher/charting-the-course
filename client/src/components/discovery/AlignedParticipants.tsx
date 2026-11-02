import { keys } from '@/lib/query-keys';
import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { resolveInternalPath } from '@/lib/internal-path';
import type { MatchingConsent } from '@/lib/matching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsentGate } from './ConsentGate';
import { MatchingPreferences } from './MatchingPreferences';

interface Participant {user_id:string;member_id:string;display_name:string;headline?:string;profile_url:string;contact_url?:string;shared_skills:string[];shared_interests:string[]}
export function AlignedParticipants({ethosId}:{ethosId:string}) {
 const {user}=useAuth();
 if(!user)return <p>Sign in and choose your privacy permissions to explore a consented participant directory.</p>;
 return <ConsentGate ethosId={ethosId}><ParticipantDirectory ecosystemId={ethosId}/></ConsentGate>;
}
function ParticipantDirectory({ecosystemId}:{ecosystemId:string}) {
 const {user}=useAuth();
 const [search,setSearch]=useState(''),[page,setPage]=useState(1);
 const root=keys.matching.ecosystem(user?.id,ecosystemId);
 const consent=useQuery({queryKey:[...root,'consent'],queryFn:()=>apiFetch<MatchingConsent>(`/api/v1/matching/ecosystems/${ecosystemId}/consent`)});
 const ready=consent.data?.directory_visible&&consent.data.contact_discovery;
 const query=useQuery({queryKey:[...root,'participants',search,page],queryFn:()=>apiFetch<{items:Participant[];total:number;state:string;algorithm_version:string}>(`/api/v1/matching/ecosystems/${ecosystemId}/participants?q=${encodeURIComponent(search)}&page=${page}`),enabled:!!ready});
 return <section className="space-y-4" aria-label="Consented participant directory"><h3 className="text-xl font-bold">People open to connecting</h3><p className="text-sm text-muted-foreground">Active participants in this ecosystem who separately opted into profile discovery and contact. Alphabetical browsing and shared declared interests are conversation aids, not a reputation ranking.</p><MatchingPreferences ecosystemId={ecosystemId}/>
 {!ready&&<p>Choose directory visibility and contact discovery above to use this private directory. You can decline either and still participate in governance.</p>}{ready&&<><label className="block space-y-2"><span>Find a participant by name or declared interest</span><Input value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}}/></label>{query.isLoading&&<p role="status">Finding eligible participants…</p>}{query.error&&<div role="alert"><p>{apiErrorMessage(query.error)} No private directory data is shown.</p><Button variant="outline" onClick={()=>query.refetch()}>Retry directory</Button></div>}{query.data?.state==='consent_required'&&<p>The server could not verify all directory permissions. Recheck participation and privacy choices.</p>}{query.data?.items.map(person=>{const profile=resolveInternalPath(person.profile_url),contact=resolveInternalPath(person.contact_url);return <article key={person.user_id} className="space-y-3 border border-border p-4"><h4 className="font-bold">{profile?<Link className="underline" href={profile}>{person.display_name}</Link>:person.display_name}</h4>{person.headline&&<p>{person.headline}</p>}{person.shared_skills?.length>0&&<p className="text-sm">Shared declared skills: {person.shared_skills.join(', ')}</p>}{person.shared_interests?.length>0&&<p className="text-sm">Shared declared interests: {person.shared_interests.join(', ')}</p>}{contact&&<Button asChild variant="outline"><Link href={contact}>Start a conversation</Link></Button>}</article>;})}{query.data?.items.length===0&&query.data.state!=='consent_required'&&<p>No eligible people match this search. Nobody's private profile is substituted.</p>}{query.data&&<div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={page===1||query.isFetching} onClick={()=>setPage(value=>value-1)}>Previous</Button><span>Page {page} · {query.data.total} people</span><Button variant="outline" disabled={page*20>=query.data.total||query.isFetching} onClick={()=>setPage(value=>value+1)}>Next</Button></div>}</>}
 </section>;
}
