import { StructuredValueEditor } from '@/components/StructuredValueEditor';
import { GovernedMatchingEditor } from '@/components/discovery/GovernedMatchingEditor';
import type { MatchingConfiguration } from '@/lib/matching-authoring';
import { Textarea } from '@/components/ui/textarea';

export function ActPolicyEditor({value,onChange,ecosystemId}:{value:string;onChange:(value:string)=>void;ecosystemId?:string}){
 let policy:Record<string,unknown>={};
 try{const parsed=value.trim()?JSON.parse(value):{};if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw new Error();policy=parsed;}catch{return <div><p role="alert">ACT policy must be a valid group of fields. Repair the advanced content first.</p><Textarea aria-label="Repair ACT policy JSON" value={value} onChange={event=>onChange(event.target.value)}/></div>;}
 const {matching_profile,...ordinary}=policy;
 return <div className="space-y-4"><StructuredValueEditor label="ACT gates and settings" value={JSON.stringify(ordinary)} onChange={next=>onChange(JSON.stringify({...JSON.parse(next),...(matching_profile?{matching_profile}:{} )}))}/><GovernedMatchingEditor ecosystemId={ecosystemId} value={matching_profile as MatchingConfiguration||null} onChange={next=>onChange(JSON.stringify({...ordinary,...(next?{matching_profile:next}:{})}))}/></div>;
}
