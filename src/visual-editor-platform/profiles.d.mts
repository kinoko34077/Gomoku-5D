export type Owner='static-dom'|'react-model'|'scene-graph';
export type PageProfile={target:{appId:string;routeId:string;templateId:string;sourceRevision:string};
 ownership:Owner;adapter:string;operations:readonly string[];exports:readonly string[];
 sourceNodeMap:Readonly<Record<string,string>>;breakpoints:Readonly<Record<string,string>>};
export function resolvePageProfile(args:{
 target:PageProfile['target'];ownership:Owner;sourceNodeMap?:Record<string,string>;
 breakpoints?:Record<string,string>;requiredOperations?:string[];
}):PageProfile;
