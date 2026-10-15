import {useState} from 'react';
import {ModelLayoutSession} from './model-adapter.mjs';
import {resolvePageProfile} from './profiles.mjs';
import {exportModelLayout} from './export.mjs';
import type {LayoutModel, LayoutOperation, VisualNode} from './model-adapter.mjs';

// Explicit page ownership chooses shared model adapter; no game state is exposed.
const pilotProfile=resolvePageProfile({
 target:{appId:'gomoku5d',routeId:'main',templateId:'isolated-demo',sourceRevision:'layout-demo-v1'},
 ownership:'react-model',requiredOperations:['structure.move','structure.duplicate','structure.remove']
});
// M4 pilot: this declarative tree contains only layout test cards, never game cells.
export const initialPilotModel: LayoutModel = {
  rootId: 'root', revision: 0, nodes: {
    root: {id:'root',parentId:null,type:'root',children:['panel'],capabilities:['structure.accept'],acceptTypes:['panel']},
    panel: {id:'panel',parentId:'root',type:'panel',children:['title','subtitle','footer'],capabilities:['structure.accept'],acceptTypes:['card']},
    title: {id:'title',parentId:'panel',type:'card',children:[],capabilities:['structure.move','structure.duplicate','structure.remove']},
    subtitle: {id:'subtitle',parentId:'panel',type:'card',children:[],capabilities:['structure.move','structure.duplicate','structure.remove']},
    footer: {id:'footer',parentId:'panel',type:'card',children:[],capabilities:['structure.move','structure.duplicate','structure.remove']},
  }
};
const describeCard = (id:string) => id === 'title' ? '見出し' : id === 'subtitle' ? '副見出し' : id === 'footer' ? '補足' : '複製 '+id;

export function PilotCardList({model,selected,onSelect}:{
  model:LayoutModel;selected?:string;onSelect?:(id:string)=>void
}) {
  return <div role="group" aria-label="編集対象カード" className="space-y-1.5">
    {model.nodes.panel.children.map(id =>
      <button type="button" key={id} data-ve-id={id}
        className={`w-full rounded border px-3 py-2 text-left text-xs ${id===selected?'border-emerald-300 bg-emerald-900/50':'border-slate-600 bg-slate-800'}`}
        aria-pressed={id===selected} onClick={()=>onSelect?.(id)}>
        {describeCard(id)}
      </button>)}
  </div>;
}

/** Separate, opt-in React owned layout model. Game state and UIOverlay never receive these actions. */
export default function ReactModelPilot() {
  const [snapshot,setSnapshot] = useState<LayoutModel>(initialPilotModel);
  const [session] = useState(()=>new ModelLayoutSession({
    initialModel: initialPilotModel,
    commitModel: async (next:LayoutModel) => {setSnapshot(next);},
    factory: (source:VisualNode,id:string): VisualNode => ({
      ...source,id,parentId:source.parentId,children:[]
    })
  }));
  const [selected,setSelected]=useState('title');
  const [status,setStatus]=useState('カードを選択して配置を変更できます');
  const current=snapshot.nodes[selected];
  const siblings=snapshot.nodes.panel.children;
  const idx=siblings.indexOf(selected);
  const capability=(name:string)=>pilotProfile.operations.includes(name)&&Boolean(current?.capabilities.includes(name));
  async function apply(operations: LayoutOperation[]): Promise<boolean> {
    try {
      await session.transact({expectedRevision:session.model.revision,operations});
      setStatus('レイアウトのみ更新しました');
      return true;
    } catch(e) {setStatus('操作不可: '+(e instanceof Error?e.message:String(e)));return false;}
  }
  function reorder(dir:number) {
    const pos=idx+dir;
    if(pos<0||pos>=siblings.length)return;
    const beforeId=dir<0?siblings[pos]:(siblings[idx+2]??null);
    void apply([{kind:'move',nodeId:selected,parentId:'panel',beforeId}]);
  }
  function duplicate() {
    let n=1;
    while(snapshot.nodes[`copy-${n}`])n++;
    void apply([{kind:'duplicate',nodeId:selected,newId:`copy-${n}`}]);
  }
  function remove(){
    const next=siblings[idx+1]??siblings[idx-1]??'';
    void apply([{kind:'remove',nodeId:selected}]).then(ok=>{if(ok)setSelected(next);});
  }
  async function history(direction:'undo'|'redo'){
    try{
      await session[direction]();
      setStatus(direction==='undo'?'レイアウト変更を取り消しました':'レイアウト変更をやり直しました');
    }catch(e){setStatus(e instanceof Error?e.message:String(e));}
  }
  function exportLayout(){
    try {
      const proposal=exportModelLayout(session.model,pilotProfile);
      const blob=new Blob([JSON.stringify(proposal,null,2)],{type:'application/json;charset=utf-8'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='gomoku-layout-proposal.json';
      document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),2000);
      setStatus('配置情報のみ書き出しました。ゲーム状態・ソースは未変更です');
    }catch(e){setStatus('書出し不可: '+(e instanceof Error?e.message:String(e)));}
  }
  return <aside data-ve-adapter={pilotProfile.adapter} aria-label="Reactレイアウト編集試験" data-ve-model-pilot="1"
    className="pointer-events-auto fixed right-3 top-3 z-[200] w-64 max-w-[85vw] rounded-xl border border-emerald-700/70 bg-slate-950/95 p-3 text-slate-100 shadow-2xl">
    <div className="mb-2 text-sm font-semibold">レイアウト編集 · 試験</div>
    <PilotCardList model={snapshot} selected={selected} onSelect={setSelected}/>
    <div className="mt-2 grid grid-cols-2 gap-1">
      <button type="button" data-action="up" disabled={!current||idx===0||!capability('structure.move')} onClick={()=>reorder(-1)}>前へ</button>
      <button type="button" data-action="down" disabled={!current||idx===siblings.length-1||!capability('structure.move')} onClick={()=>reorder(1)}>後へ</button>
      <button type="button" data-action="duplicate" disabled={!current||!capability('structure.duplicate')} onClick={duplicate}>複製</button>
      <button type="button" data-action="remove" disabled={!current||!capability('structure.remove')} onClick={remove}>削除</button>
      <button type="button" data-action="undo" disabled={!session.canUndo} onClick={()=>void history('undo')}>元に戻す</button>
      <button type="button" data-action="redo" disabled={!session.canRedo} onClick={()=>void history('redo')}>やり直し</button>
      <button type="button" data-action="export-layout" onClick={exportLayout}>配置JSONを書出し</button>
    </div>
    <p role="status" className="mt-2 text-xs text-emerald-200">{status}</p>
    <p className="mt-1 text-[10px] text-slate-400">ゲーム盤面・対局履歴は変更しません。URL指定時のみ表示。</p>
  </aside>;
}
