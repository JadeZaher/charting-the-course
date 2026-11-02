import { keys } from '@/lib/query-keys';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StructuredValueEditor } from '@/components/StructuredValueEditor';
import { QuizQuestionEditor } from '@/components/QuizQuestionEditor';
import { JourneyStepsEditor,JourneyExitEditor } from '@/components/orientation/JourneyAuthoring';
import { ActPolicyEditor } from './ActPolicyEditor';
import { fetchSupportResources } from '@/lib/node-admin-api';
import { fieldOptions } from '@/lib/node-admin';
import { supportRecordName } from '@/lib/admin-tasks';
import { apiErrorMessage } from '@/lib/api-error-message';
import type { SupportField } from '@/types/node-admin';

export function SupportFieldEditor({ field, value, onChange, organization, owner, onReference }: { field: SupportField; value: string; onChange: (value: string) => void; organization: string; owner: string; onReference: (id: string,label: string) => void }) {
  const [search, setSearch] = useState('');
  const id = `support-field-${field.name}`;
  const family = field.reference?.split('.')[0];
  const query = useQuery({ queryKey: [...keys.nodeAdmin.all,owner,'reference',family,organization,search], queryFn: () => fetchSupportResources(family!, { organization_id: organization, q: search, per_page: 12 }), enabled: !!family && search.trim().length >= 2 });
  const options = fieldOptions(field).map(option => field.name === 'role' ? {...option,label:({user:'Member',mod:'Steward (moderator)',admin:'Ecosystem administrator',owner:'Ecosystem owner'} as Record<string,string>)[option.value]||option.label} : option);
  const label = ({passing_score:'Passing score (%)',is_published:'Published and available to candidates',is_entry_quiz:'Required entry quiz for the selected scope',team_id:'Team scope',domain_id:'Domain or circle scope'} as Record<string,string>)[field.name]||field.label;
  return <div className="space-y-2"><Label htmlFor={id}>{label}{field.required ? ' (required)' : ''}</Label>
    {family ? <><Input id={id} value={search} onChange={event => setSearch(event.target.value)} placeholder={`Find ${family.replaceAll('_',' ')} by name (at least 2 characters)`} />{query.isFetching && <p role="status">Finding records…</p>}{query.error && <p role="alert" className="text-destructive">{apiErrorMessage(query.error)}</p>}{search.trim().length >= 2 && <div className="space-y-2">{query.data?.items.map(record => <Button type="button" key={record.id} variant={value === record.id ? 'default' : 'outline'} className="min-h-11 h-auto w-full justify-start whitespace-normal text-left" onClick={() => { onChange(record.id); onReference(record.id,supportRecordName(record)); }}>{supportRecordName(record)} <span className="ml-2 text-xs break-all">{record.id}</span></Button>)}{query.data?.items.length === 0 && <p className="text-sm">No records match. Try another name or check the support organization.</p>}</div>}{value && <p className="text-sm break-all">Selected record: {value}</p>}<details><summary className="min-h-11 cursor-pointer py-3 font-bold">Advanced: exact record ID</summary><Input aria-label={`${field.label} exact record ID`} value={value} onChange={event => onChange(event.target.value)} /><p className="text-xs text-muted-foreground">The server validates the record and its scope. A search never chooses a record for you.</p></details></>
      : field.name === 'survey_json' ? <QuizQuestionEditor value={value} onChange={onChange} id={id} />
      : field.name === 'act_policy' ? <ActPolicyEditor value={value} onChange={onChange} ecosystemId={organization||undefined}/>
      : field.name === 'content_sequence' ? <JourneyStepsEditor onReference={onReference} supportOwner={owner} ecosystemId={organization||undefined} value={value} onChange={onChange}/>
      : field.name === 'exit_package' ? <JourneyExitEditor value={value} onChange={onChange}/>
      : options.length > 0 || field.type === 'boolean' ? <select id={id} className="min-h-11 w-full border border-input bg-background p-2" value={value} onChange={event => onChange(event.target.value)}><option value="">Choose a value</option>{(field.type === 'boolean' ? [{value:'true',label:'Yes'},{value:'false',label:'No'}] : options).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      : ['json','object','array'].includes(field.type) ? <StructuredValueEditor label={field.label} array={field.type === 'array' || ['skills','interests','projects','choices','content_sequence'].includes(field.name)} value={value} onChange={onChange} />
      : field.type === 'text' || /description|body|content|rationale/.test(field.name) ? <Textarea id={id} value={value} rows={4} onChange={event => onChange(event.target.value)} />
      : <Input id={id} type={field.type === 'date' ? 'date' : field.type.includes('datetime') ? 'datetime-local' : ['number','integer','float','numeric'].includes(field.type) ? 'number' : 'text'} value={value} onChange={event => onChange(event.target.value)} />}
  </div>;
}
