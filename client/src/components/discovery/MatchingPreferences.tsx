import { keys } from '@/lib/query-keys';
import { useEffect,useState } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { Button } from '@/components/ui/button';
import type { MatchingConsent } from '@/lib/matching';

export function MatchingPreferences({ecosystemId}:{ecosystemId:string}){
 const {user}=useAuth(),client=useQueryClient();
 const root=keys.matching.ecosystem(user?.id,ecosystemId),key=[...root,'consent'];
 const query=useQuery({queryKey:key,queryFn:()=>apiFetch<MatchingConsent>(`/api/v1/matching/ecosystems/${ecosystemId}/consent`),enabled:!!user?.id});
 const [values,setValues]=useState<MatchingConsent>({directory_visible:false,contact_discovery:false,matching_enabled:false}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setValues({directory_visible:false,contact_discovery:false,matching_enabled:false});setError('');},[user?.id,ecosystemId]);
 useEffect(()=>{if(query.data)setValues(query.data);},[query.data,user?.id,ecosystemId]);
 async function save(){setBusy(true);setError('');try{const result=await apiFetch<MatchingConsent>(`/api/v1/matching/ecosystems/${ecosystemId}/consent`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});client.setQueryData(key,result);await client.invalidateQueries({queryKey:root});}catch(failure){setError(apiErrorMessage(failure));}finally{setBusy(false);}}
 return <fieldset className="space-y-3 border border-border p-4"><legend className="px-2 font-bold">Your choices for this ecosystem</legend><p className="text-sm text-muted-foreground">These permissions are separate from membership and agreement consent. Nothing is selected for you. Turning off private matching deletes its saved answers and assessments for this ecosystem.</p>{query.isLoading&&<p role="status">Loading your choices…</p>}{query.error&&<p role="alert" className="text-destructive">{apiErrorMessage(query.error)}</p>}{([['directory_visible','Let eligible participants discover my profile'],['contact_discovery','Let eligible participants find my contact route'],['matching_enabled','Use my voluntary answers for private fit checks']] as const).map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3"><input type="checkbox" disabled={!query.data||busy} checked={values[key]} onChange={event=>setValues(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}<Button disabled={!query.data||busy} onClick={save}>{busy?'Saving…':'Save my privacy choices'}</Button>{error&&<p role="alert" className="text-destructive">{error}</p>}</fieldset>;
}
