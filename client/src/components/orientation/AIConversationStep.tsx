import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useOrientationChat } from '@/hooks/use-orientation-chat';
import type { JourneyStep, OmniBotContext } from '@/types/orientation';

export function AIConversationStep({step,context,onComplete}:{step:JourneyStep;context?:OmniBotContext;onComplete:(response:unknown)=>void}) {
  const chat=useOrientationChat(context?.journey_id,context?.step_id);
  const [input,setInput]=useState('');
  const canComplete=!step.required || chat.completedReplies>0&&!chat.sessionStale;
  return <section className="space-y-4" aria-labelledby="orientation-conversation-title"><h2 id="orientation-conversation-title" className="text-xl font-bold">{step.title}</h2>{step.description && <p>{step.description}</p>}
    <p className="text-sm text-muted-foreground">This private orientation guide uses no governance tools and cannot join, consent, change records or make decisions for you.</p>
    {!chat.available && <div className="space-y-2 border border-border p-4" role={chat.checking?'status':'alert'}><p>{chat.reason}</p>{!chat.checking && <Button variant="outline" onClick={chat.retry}>Check availability again</Button>}</div>}
    <label className="block space-y-2"><span>Private conversations for this step</span><select className="min-h-11 w-full border bg-background p-2" value={chat.sessionId||''} disabled={chat.busy} onChange={event=>{chat.chooseSession(event.target.value);setInput('');}}><option value="">New orientation conversation</option>{chat.sessions.map(session=><option key={session.id} value={session.id}>{session.title||'Orientation conversation'}{session.stale?' (earlier journey version)':''}</option>)}</select></label>
    <div className="max-h-80 overflow-y-auto space-y-3 border border-border p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" role="log" aria-label="Orientation guide conversation for this step" tabIndex={0} aria-live="polite">{chat.messages.length===0 && <p className="text-sm text-muted-foreground">Ask about this step in your own words.</p>}{chat.messages.map((message,index)=><div key={index}><strong>{message.role==='user'?'You':'Orientation guide'}</strong><p className="whitespace-pre-wrap">{message.content}</p></div>)}{chat.busy && <p role="status">Preparing a reply…</p>}</div>
    <form className="space-y-3" onSubmit={async event=>{event.preventDefault();if(await chat.send(input))setInput('');}}><label htmlFor="orientation-question" className="font-bold">Your question</label><Textarea id="orientation-question" value={input} disabled={!chat.available||chat.busy} onChange={event=>setInput(event.target.value)} /><Button type="submit" disabled={!chat.available||chat.busy||!input.trim()}>{chat.busy?'Replying…':'Ask orientation guide'}</Button></form>
    {chat.error && <p role="alert" className="text-destructive">{chat.error} Your question is kept so you can retry.</p>}
    <div className="flex flex-wrap justify-between gap-3">{!step.required && <Button variant="outline" onClick={()=>onComplete({skipped:true,turns:0})}>Skip optional conversation</Button>}{step.required && !canComplete && <p className="text-sm text-muted-foreground">A completed guide reply is required. If the guide is unavailable, ask a steward to make this step optional or repair its availability.</p>}<Button disabled={!canComplete||chat.busy} onClick={()=>onComplete({turns:chat.completedReplies,session_id:chat.sessionId,step_id:context?.step_id})}>Continue</Button></div>
  </section>;
}
