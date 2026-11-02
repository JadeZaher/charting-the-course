import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function ValueFields({ value, onChange, label, depth = 0 }: { value: unknown; onChange: (value: unknown) => void; label: string; depth?: number }) {
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState('text');
  const initial = () => newType === 'object' ? {} : newType === 'array' ? [] : newType === 'boolean' ? false : newType === 'number' ? 0 : '';
  if (value !== null && typeof value === 'object' && depth < 5) {
    const entries = Object.entries(value);
    const array = Array.isArray(value);
    return <fieldset className="space-y-3 border border-border p-3"><legend className="px-1 font-semibold">{label}</legend>{entries.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}{entries.map(([key,item]) => <div key={key} className="space-y-2"><ValueFields label={array ? `Item ${Number(key) + 1}` : key.replaceAll('_',' ')} value={item} depth={depth + 1} onChange={next => { const changed = array ? [...value] : { ...value }; (changed as Record<string,unknown>)[key] = next; onChange(changed); }} /><Button type="button" size="sm" variant="outline" onClick={() => { if (array) onChange(value.filter((_,index) => index !== Number(key))); else { const changed = { ...value } as Record<string,unknown>; delete changed[key]; onChange(changed); } }}>Remove {array ? 'item' : key.replaceAll('_',' ')}</Button></div>)}<div className="flex flex-wrap gap-2">{!array && <Input aria-label={`New field name in ${label}`} value={newKey} onChange={event => setNewKey(event.target.value)} placeholder="Field name" />}<select aria-label={`New value type in ${label}`} className="min-h-11 border bg-background p-2" value={newType} onChange={event => setNewType(event.target.value)}><option value="text">Text</option><option value="number">Number</option><option value="boolean">Yes / no</option><option value="object">Group of fields</option><option value="array">List</option></select><Button type="button" variant="outline" disabled={!array && (!newKey.trim() || Object.hasOwn(value, newKey.trim()) || ['__proto__','constructor','prototype'].includes(newKey.trim()))} onClick={() => { onChange(array ? [...value,initial()] : { ...value,[newKey.trim()]:initial() }); setNewKey(''); }}>Add {array ? 'item' : 'field'}</Button></div></fieldset>;
  }
  if (typeof value === 'boolean') return <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} />{label}</label>;
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span><Input type={typeof value === 'number' ? 'number' : 'text'} value={value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')} onChange={event => onChange(typeof value === 'number' ? Number(event.target.value) : event.target.value)} /></label>;
}

export function StructuredValueEditor({ value, onChange, label, array = false }: { value: string; onChange: (value: string) => void; label: string; array?: boolean }) {
  let parsed: unknown = array ? [] : {}, error = '';
  try { parsed = value.trim() ? JSON.parse(value) : parsed; } catch { error = 'The advanced content is not valid JSON. Repair it below before saving.'; }
  return <div className="space-y-3">{error ? <p role="alert" className="text-destructive">{error}</p> : <ValueFields label={label} value={parsed} onChange={next => onChange(JSON.stringify(next))} />}<details><summary className="min-h-11 cursor-pointer py-3 font-bold">Advanced {label.toLowerCase()} JSON</summary><Textarea aria-label={`Advanced ${label} JSON`} value={value} rows={5} onChange={event => onChange(event.target.value)} /></details></div>;
}
