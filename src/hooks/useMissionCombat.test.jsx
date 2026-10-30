import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMissionCombat } from './useMissionCombat';
const fake = vi.hoisted(() => ({rpc:vi.fn(),from:vi.fn(),removeChannel:vi.fn(),channels:[]}));
vi.mock('../lib/supabase',()=>({supabase:{rpc:(...a)=>fake.rpc(...a),from:(...a)=>fake.from(...a),removeChannel:(...a)=>fake.removeChannel(...a),channel:(name)=>{const c={name,on(){return this;},subscribe(){return this;}};fake.channels.push(c);return c;}}}));
const state=(mission_id='a',version=1,rodada=1)=>({mission_id,version,rodada,reset_at:'2026-01-01',participants:[],turn_order:[],turn_done_by:[],turn_index:0});
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
beforeEach(()=>{
  fake.rpc.mockReset();fake.from.mockReset();fake.removeChannel.mockClear();fake.channels=[];
  fake.rpc.mockImplementation(async(n,p)=>({data:state(p.p_mission_id)}));
  fake.from.mockImplementation(()=>({select(){return this;},eq(){return this;},gte(){return this;},order(){return this;},lt(){return this;},limit:async()=>({data:[]})}));
});
afterEach(cleanup);
it('locks double actions synchronously and forwards the current version; conflict refreshes without claiming success',async()=>{
  const {result}=renderHook(()=>useMissionCombat('a'));
  await waitFor(()=>expect(result.current.state?.version).toBe(1));
  const pending=deferred(); fake.rpc.mockImplementation((n,p)=>p.p_event==='READ'?Promise.resolve({data:state('a',3,2)}):pending.promise);
  let first,second;
  act(()=>{first=result.current.action('TURN_DONE',{userId:'owner',round:1});second=result.current.action('TURN_DONE',{userId:'owner',round:1});});
  expect(await second).toBe(false);expect(result.current.busy).toBe(true);
  expect(fake.rpc.mock.calls.at(-1)[1]).toEqual({p_mission_id:'a',p_event:'TURN_DONE',p_payload:{userId:'owner',round:1},p_expected_version:1});
  await act(async()=>{pending.resolve({error:{code:'40001'}});expect(await first).toBe(false);});
  expect(result.current.state.version).toBe(3);expect(result.current.error).toContain('A mesa mudou');expect(result.current.busy).toBe(false);
});
it.each(['success','failure'])('ignores late %s from mission A after changing to B and does not unlock a B action',async(outcome)=>{
  const {result,rerender}=renderHook(({mission})=>useMissionCombat(mission),{initialProps:{mission:'a'}});
  await waitFor(()=>expect(result.current.state?.mission_id).toBe('a'));
  const oldAction=result.current.action, oldAppend=result.current.appendLogs, pendingA=deferred(),pendingB=deferred();
  fake.rpc.mockImplementation((n,p)=>p.p_event==='READ'?Promise.resolve({data:state(p.p_mission_id)}):p.p_mission_id==='a'?pendingA.promise:pendingB.promise);
  let a,b;act(()=>{a=result.current.action('TURN_DONE',{});});
  rerender({mission:'b'});
  expect(result.current.logs).toEqual([]);expect(result.current.error).toBe('');
  await waitFor(()=>expect(result.current.state?.mission_id).toBe('b'));
  act(()=>{b=result.current.action('TURN_DONE',{});});
  await act(async()=>{pendingA.resolve(outcome==='success'?{data:state('a',4)}:{error:{code:'40001'}});expect(await a).toBe(false);});
  expect(result.current.busy).toBe(true);expect(result.current.error).toBe('');expect(result.current.state.mission_id).toBe('b');
  expect(await oldAction('RESET',{})).toBe(false);expect((await oldAppend([])).error).toBeTruthy();
  await act(async()=>{pendingB.resolve({data:state('b',2)});await b;});
  expect(result.current.state.version).toBe(2);expect(fake.removeChannel).toHaveBeenCalledTimes(1);
});
it('does not accept a delayed READ older than an acknowledged action',async()=>{
  const {result}=renderHook(()=>useMissionCombat('a'));await waitFor(()=>expect(result.current.state).toBeTruthy());
  const delayed=deferred();fake.rpc.mockImplementation((n,p)=>p.p_event==='READ'?delayed.promise:Promise.resolve({data:state('a',3)}));
  let reading;act(()=>{reading=result.current.refresh();});
  await act(async()=>{await result.current.action('TURN_DONE',{});});
  await act(async()=>{delayed.resolve({data:state('a',2)});await reading;});
  expect(result.current.state.version).toBe(3);
});
it('handles thrown network errors and clears the pending lock',async()=>{
  const {result}=renderHook(()=>useMissionCombat('a'));await waitFor(()=>expect(result.current.state).toBeTruthy());
  fake.rpc.mockRejectedValue(new Error('offline'));
  await act(async()=>expect(await result.current.action('TURN_DONE',{})).toBe(false));
  expect(result.current.busy).toBe(false);expect(result.current.error).toContain('não foi confirmada');
});
it('paginates history under the mission and reset boundary and preserves older entries on refresh',async()=>{
  const queries=[];
  let page=Array.from({length:100},(_,i)=>({id:200-i,mission_id:'a',created_at:'2026-02-01',acao:'Ação'}));
  fake.from.mockImplementation(()=>{const q=[];queries.push(q);return {select(){return this;},eq(...a){q.push(['eq',...a]);return this;},gte(...a){q.push(['gte',...a]);return this;},lt(...a){q.push(['lt',...a]);return this;},order(){return this;},limit:async()=>({data:page})};});
  const {result}=renderHook(()=>useMissionCombat('a'));await waitFor(()=>expect(result.current.logs.length).toBe(100));
  page=[{id:100,mission_id:'a',acao:'Anterior'}];
  await act(async()=>{await result.current.loadMoreLogs();});
  expect(queries.at(-1)).toEqual([['eq','mission_id','a'],['gte','created_at','2026-01-01'],['lt','id',101]]);
  expect(result.current.logs.length).toBe(101);expect(result.current.hasMoreLogs).toBe(false);
  page=[{id:201,mission_id:'a',acao:'Nova'}];await act(async()=>{await result.current.refresh();});
  expect(result.current.logs.length).toBe(102);expect(result.current.logs.at(-1).id).toBe(100);
});
it('discards old history and a late log insert after a reset',async()=>{
  const {result}=renderHook(()=>useMissionCombat('a'));await waitFor(()=>expect(result.current.state).toBeTruthy());
  const pending=deferred();fake.from.mockReturnValue({insert(){return this;},select:()=>pending.promise});
  let insert;act(()=>{insert=result.current.appendLogs([{acao:'old'}]);});
  fake.rpc.mockResolvedValue({data:{...state('a',2),reset_at:'2026-03-01'}});
  await act(async()=>{await result.current.action('RESET',{});});
  await act(async()=>{pending.resolve({data:[{id:1,acao:'old'}]});expect((await insert).error).toBeTruthy();});
  expect(result.current.logs).toEqual([]);expect(result.current.logBusy).toBe(false);
});
