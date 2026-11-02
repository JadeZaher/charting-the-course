import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOrientationChat } from '@/hooks/use-orientation-chat';
import type { OmniBotContext } from '@/types/orientation';

export function OmniBotPanel({context}:{context?:OmniBotContext}) {
  const [open,setOpen]=useState(false),[input,setInput]=useState('');
  const [scope,setScope]=useState<'general'|'step'>('general');
  const chat=useOrientationChat(context?.journey_id,scope==='step'?context?.step_id:undefined);
  return <aside className="mt-8 border-2 border-strong-border bg-card p-4 space-y-4" aria-label="Private orientation guide"><Button variant="outline" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?'Close orientation guide':'Ask the orientation guide'}</Button>{open && <>
    <h2 className="font-bold">Your private orientation conversations</h2><p className="text-sm text-muted-foreground">These conversations stay separate from your governance operator. The guide has no action tools.</p>
    <p className="text-sm">{scope==='step' && context?.step_id ? `Showing the saved conversation for this journey step: ${context.current_step || context.step_id}.` : 'Showing general journey conversations. Conversations for required steps are saved separately and restored when you open that step.'}</p>
    {context?.step_id && <Button variant="outline" disabled={chat.busy} onClick={()=>{setScope(value=>value==='general'?'step':'general');setInput('');}}>{scope==='general'?"Open this step's saved conversation":'Open general journey conversations'}</Button>}
    {!chat.available && <p role={chat.checking?'status':'alert'}>{chat.reason}</p>}
    <label className="block space-y-2"><span>Conversation history</span><select className="min-h-11 w-full border bg-background p-2" value={chat.sessionId||''} disabled={chat.busy} onChange={event=>chat.chooseSession(event.target.value)}><option value="">New orientation conversation</option>{chat.sessions.map(session=><option key={session.id} value={session.id}>{session.title||'Orientation conversation'}{session.updated_at?` · ${new Date(session.updated_at).toLocaleString()}`:''}</option>)}</select></label>
    <div className="max-h-80 overflow-auto space-y-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" role="log" aria-label="Orientation panel conversation" tabIndex={0} aria-live="polite">{chat.messages.map((message,index)=><p key={index} className="whitespace-pre-wrap"><strong>{message.role==='user'?'You':'Guide'}: </strong>{message.content}</p>)}{chat.busy&&<p role="status">Preparing a reply…</p>}</div>
    <form onSubmit={async event=>{event.preventDefault();if(await chat.send(input))setInput('');}} className="space-y-3"><label htmlFor="orientation-panel-question" className="font-bold">Ask about this journey</label><Textarea id="orientation-panel-question" disabled={!chat.available||chat.busy} value={input} onChange={event=>setInput(event.target.value)} /><Button disabled={!chat.available||chat.busy||!input.trim()}>Send question</Button></form>{chat.error&&<p role="alert" className="text-destructive">{chat.error}</p>}{chat.sessionId&&<Button variant="outline" disabled={chat.busy} onClick={()=>{if(window.confirm('Delete this private orientation conversation?'))void chat.removeSession();}}>Delete this conversation</Button>}
  </>}</aside>;
}
