import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { keys } from '@/lib/query-keys';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { JoinRequirements } from '@/components/JoinRequirements';
import type { Team } from '@/types/api';

type TeamView=Team&{caller_is_member:boolean;caller_can_manage:boolean};
export default function Teams() {
  const [,params]=useRoute('/teams/:id');
  const id=params?.id;
  const {isNodeAdmin}=useAuth();
  const client=useQueryClient();
  const [busy,setBusy]=useState(false),[failure,setFailure]=useState('');
  const list=useQuery({queryKey:keys.teams.list(),queryFn:()=>apiFetch<{items:TeamView[]}>('/api/v1/teams'),enabled:!id});
  const detail=useQuery({queryKey:keys.teams.detail(id),queryFn:()=>apiFetch<TeamView>(`/api/v1/teams/${id}`),enabled:!!id});
  const team=detail.data;
  async function join(){if(!id)return;setBusy(true);setFailure('');try{await apiFetch(`/api/v1/teams/${id}/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});await client.invalidateQueries({queryKey:keys.teams.all});}catch(error){setFailure(apiErrorMessage(error));void client.invalidateQueries({queryKey:keys.joinGates.target('team',id)});}finally{setBusy(false);}}
  const query=id?detail:list;
  return <div className="space-y-6"><header className="space-y-3"><h1 className="text-3xl font-bold">{team?.name||'Teams'}</h1><p className="text-muted-foreground">Join a team in an ecosystem where you take part. Only configured entry quizzes apply; passing them does not add you automatically.</p>{isNodeAdmin&&<Button asChild variant="outline"><Link href="/admin/teams">Manage teams and entry quizzes</Link></Button>}</header>
    {query.isLoading&&<p role="status">Loading teams…</p>}{query.error&&<div role="alert"><p>{apiErrorMessage(query.error)}</p><Button variant="outline" onClick={()=>query.refetch()}>Retry</Button></div>}
    {!id&&<div className="grid gap-4 sm:grid-cols-2">{list.data?.items.map(item=><Link className="block border-2 border-border p-5 space-y-3" key={item.id} href={`/teams/${item.id}`}><h2 className="font-bold">{item.name}</h2><p>{item.description}</p><p className="text-sm">{item.caller_is_member?'You belong to this team':item.is_active?'Open team':'Inactive team'}</p></Link>)}{list.data?.items.length===0&&<p>No teams are available in this scope.</p>}</div>}
    {team&&<><p>{team.description}</p>{team.caller_is_member?<p role="status" className="font-bold">You belong to this team.</p>:team.is_active?<><JoinRequirements type="team" id={team.id} returnTo={`/teams/${team.id}`} /><Button disabled={busy} onClick={join}>{busy?'Joining…':'Join this team'}</Button></>:<p>This team is inactive.</p>}{failure&&<p role="alert" className="text-destructive">{failure}</p>}<p><Link href="/teams" className="underline">Back to teams</Link></p></>}
  </div>;
}
