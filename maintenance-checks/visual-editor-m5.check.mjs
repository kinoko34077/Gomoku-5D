import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePageProfile} from '../src/visual-editor-platform/profiles.mjs';
import {exportModelLayout,exportStaticHtml} from '../src/visual-editor-platform/export.mjs';
import {newDocument} from '../src/visual-editor-platform/core.mjs';
const target={appId:'gomoku5d',routeId:'main',templateId:'isolated-demo',sourceRevision:'layout-demo-v1'};
const profile=resolvePageProfile({target,ownership:'react-model',requiredOperations:['structure.move']});
test('M5 React model chooses owner strategy and strips non-layout payload',()=>{
 const layout={rootId:'root',revision:1,nodes:{
  root:{id:'root',type:'panel',parentId:null,children:['card'],gameSecret:{score:999}},
  card:{id:'card',type:'card',parentId:'root',children:[],gameSecret:{board:'PRIVATE'}}}};
 const result=exportModelLayout(layout,profile);
 assert.equal(profile.adapter,'owner-model');
 assert.equal(result.layoutRevision,1);
 assert.equal(JSON.stringify(result).includes('gameSecret'),false);
 assert.throws(()=>resolvePageProfile({target,ownership:'react-model',requiredOperations:['style.safe']}),{code:'UNSUPPORTED_CAPABILITY'});
 layout.nodes.card.parentId='missing';
 assert.throws(()=>exportModelLayout(layout,profile),{code:'PARENT_MISMATCH'});
});

test('M5 shared static exporter denies false data-id despite React model isolation',()=>{
  const staticProfile=resolvePageProfile({target,ownership:'static-dom',sourceNodeMap:{title:'title'}});
  const doc=newDocument(target);
  doc.nodes.title={base:{color:'#123456'}};
  const render=source=>exportStaticHtml(doc,staticProfile,{source,expectedSource:source,expectedSourceRevision:target.sourceRevision});
  const fake='<html><head></head><body><h1 data-id="title">wrong</h1></body></html>';
  assert.throws(()=>render(fake),{code:'SOURCE_IDENTITY_CONFLICT'});
  const real='<html><head></head><body><h1 id = "title">real</h1></body></html>';
  assert.match(render(real),/data-ve-export="v1"/);
});
