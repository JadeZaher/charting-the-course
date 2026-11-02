import { ADMIN_TASKS } from './admin-tasks';

export interface SupportNavigation { organization:string; kind:string; search:string; page:number; advanced:boolean; tab:'resources'|'admins' }
export function supportNavigationKey(owner:string,path:string):string|null {
  return owner && ['/admin','/admin/node-admins',...ADMIN_TASKS.map(task=>`/admin/${task.key}`)].includes(path) ? `neos:support-navigation:${owner}:${path}` : null;
}
export function readSupportNavigation(raw:string|null):SupportNavigation|null {
  try {
    const value=JSON.parse(raw || 'null');
    if(!value || typeof value!=='object' || Object.keys(value).some(key=>!['organization','kind','search','page','advanced','tab'].includes(key)))return null;
    if(typeof value.organization!=='string'||(value.organization!==''&&!/^[0-9a-f-]{36}$/.test(value.organization))||typeof value.kind!=='string'||!/^([a-z][a-z0-9_]*)?$/.test(value.kind)||typeof value.search!=='string'||value.search.length>500||!Number.isInteger(value.page)||value.page<1||value.page>10000||typeof value.advanced!=='boolean'||!['resources','admins'].includes(value.tab))return null;
    return value;
  } catch { return null; }
}
