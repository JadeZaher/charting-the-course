import { resolveInternalPath } from './internal-path';
export function portableRecordPath(href:string|undefined):string|null{const path=resolveInternalPath(href);return path&&/^\/api\/v1\/exit\/[0-9a-f-]{36}\/portable-record$/.test(path)?path:null;}
