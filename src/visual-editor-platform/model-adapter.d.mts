export type VisualNode = {
 id:string;parentId:string|null;type:string;children:string[];
 capabilities:string[];acceptTypes?:string[];
};
export type LayoutModel = {rootId:string;revision:number;nodes:Record<string,VisualNode>};
export type LayoutOperation =
 | {kind:'move';nodeId:string;parentId:string;beforeId?:string|null}
 | {kind:'duplicate';nodeId:string;newId:string}
 | {kind:'remove';nodeId:string};
export type LayoutTransaction = {expectedRevision:number;operations:LayoutOperation[]};
export function planModelTransaction(model:LayoutModel,tx:LayoutTransaction,options?:{
 factory?:(node:VisualNode,newId:string)=>VisualNode;
}):LayoutModel;
export class ModelLayoutSession {
 constructor(options:{
  initialModel:LayoutModel;
  commitModel:(next:LayoutModel,previous:LayoutModel)=>void|Promise<void>;
  factory?:(node:VisualNode,newId:string)=>VisualNode;
  historyLimit?:number;
 });
 get model():LayoutModel;
 get busy():boolean;
 get canUndo():boolean;
 get canRedo():boolean;
 transact(tx:LayoutTransaction):Promise<LayoutModel>;
 undo():Promise<LayoutModel>;
 redo():Promise<LayoutModel>;
}
