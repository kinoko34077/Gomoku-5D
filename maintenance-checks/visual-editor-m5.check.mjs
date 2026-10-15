import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePageProfile} from '../src/visual-editor-platform/profiles.mjs';
import {exportModelLayout} from '../src/visual-editor-platform/export.mjs';
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
