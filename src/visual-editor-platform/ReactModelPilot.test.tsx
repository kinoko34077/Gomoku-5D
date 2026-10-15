import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {PilotCardList,initialPilotModel} from './ReactModelPilot';
import {ModelLayoutSession,planModelTransaction} from './model-adapter.mjs';
import type {LayoutModel,VisualNode} from './model-adapter.mjs';

describe('M4 declarative React-owned visual model pilot',()=>{
  it('changes React visible order only through model commits; never touches game state',async()=>{
    const sampleGame={moveCount:7,phase:3,undoHistory:[1,2]};
    let model:LayoutModel=structuredClone(initialPilotModel);
    const session=new ModelLayoutSession({initialModel:model,commitModel:async(next)=>{model=next;}});
    const before=renderToStaticMarkup(<PilotCardList model={model} />);
    expect(before.indexOf('data-ve-id="title"')).toBeLessThan(before.indexOf('data-ve-id="footer"'));
    await session.transact({expectedRevision:0,operations:[{kind:'move',nodeId:'footer',parentId:'panel',beforeId:'title'}]});
    const after=renderToStaticMarkup(<PilotCardList model={model} />);
    expect(after.indexOf('data-ve-id="footer"')).toBeLessThan(after.indexOf('data-ve-id="title"'));
    expect(sampleGame).toEqual({moveCount:7,phase:3,undoHistory:[1,2]});
    await session.undo();
    expect(renderToStaticMarkup(<PilotCardList model={model} />)).toBe(before);
  });
  it('rejects unsafe game mutations and duplicate identities before render',()=>{
    const initial=structuredClone(initialPilotModel);
    expect(()=>planModelTransaction(initial,{expectedRevision:0,operations:[{kind:'remove',nodeId:'root'}]})).toThrow();
    expect(()=>planModelTransaction(initial,{expectedRevision:0,operations:[{kind:'duplicate',nodeId:'title',newId:'footer'}]})).toThrow();
    expect(()=>planModelTransaction(initial,{expectedRevision:9,operations:[{kind:'move',nodeId:'title',parentId:'panel'}]})).toThrow();
    expect(initial.nodes.panel.children).toEqual(['title','subtitle','footer']);
  });
  it('duplicates a safe card with an app factory and independently undoes the edit',async()=>{
    let rendered:LayoutModel=structuredClone(initialPilotModel);
    const factory=(node:VisualNode,id:string):VisualNode=>({...node,id,children:[]});
    const session=new ModelLayoutSession({initialModel:rendered,commitModel:next=>{rendered=next;},factory});
    await session.transact({expectedRevision:0,operations:[{kind:'duplicate',nodeId:'title',newId:'copy-1'}]});
    expect(rendered.nodes.panel.children).toEqual(['title','copy-1','subtitle','footer']);
    await session.undo();
    expect(rendered.nodes['copy-1']).toBeUndefined();
    await session.redo();
    expect(rendered.nodes['copy-1'].parentId).toBe('panel');
  });
});
