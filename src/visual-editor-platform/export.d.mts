import type {LayoutModel} from './model-adapter.mjs';
import type {PageProfile} from './profiles.mjs';
export function exportModelLayout(model:LayoutModel,profile:PageProfile):{
 schemaVersion:number;kind:string;status:'REVIEW_REQUIRED';ownership:string;
 target:PageProfile['target'];layoutRevision:number;rootId:string;
 nodes:Record<string,{id:string;type:string;parentId:string|null;children:string[]}>;
 warning:string;
};
