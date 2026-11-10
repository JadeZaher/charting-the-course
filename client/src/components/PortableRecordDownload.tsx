import { useState,type ReactNode } from 'react';
import { portableRecordPath } from '@/lib/chat-links';
import { apiErrorMessage } from '@/lib/api-error-message';
import { API_BASE_URL } from '@/lib/api-origin';

export function PortableRecordDownload({href,children}:{href:string;children:ReactNode}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const path=portableRecordPath(href);
 const url=`${API_BASE_URL}${path||''}`;
 if(!path)return <span>{children}</span>;
 async function download(){if(busy||!path)return;setBusy(true);setError('');try{const response=await fetch(url,{credentials:'include',headers:{Accept:'application/json'}});if(!response.ok){const body=await response.json().catch(()=>null);throw new Error(body?.error||`Download failed (${response.status})`);}const blob=await response.blob(),source=URL.createObjectURL(blob),link=document.createElement('a');link.href=source;link.download=`neos-portable-record-${path.split('/')[4]}.json`;link.click();URL.revokeObjectURL(source);}catch(failure){setError(apiErrorMessage(failure));}finally{setBusy(false);}}
 return <span><a href={url} aria-disabled={busy} className="text-primary underline hover:text-primary/80" onClick={event=>{event.preventDefault();void download();}}>{busy?'Preparing your private download…':children}</a>{error&&<span role="alert" className="block text-destructive">{error}</span>}</span>;
}
