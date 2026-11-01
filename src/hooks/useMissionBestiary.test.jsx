import { renderHook,waitFor,cleanup } from '@testing-library/react';
import { afterEach,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({query:vi.fn()}));
vi.mock('../lib/supabase',()=>({supabase:{from:(...a)=>mock.query(...a)}}));
import { useMissionBestiary } from './useMissionBestiary';
afterEach(()=>{cleanup();vi.clearAllMocks();});
it('never requests a story catalogue for a generic mission or a player',()=>{
  const {result,rerender}=renderHook(({manager,pack})=>useMissionBestiary('test',manager,pack),{initialProps:{manager:true,pack:'generic'}});
  expect(result.current.entries[0].id).toBe('training-sentinel');
  rerender({manager:false,pack:'asa_tower_2077'});
  expect(result.current.entries).toEqual([]);expect(mock.query).not.toHaveBeenCalled();
});
it('discards a late story response after switching to a neutral mission',async()=>{
  let finish;
  mock.query.mockReturnValue({select(){return this;},eq(){return new Promise(resolve=>{finish=resolve;});}});
  const {result,rerender}=renderHook(({id,pack})=>useMissionBestiary(id,true,pack),{initialProps:{id:'story',pack:'asa_tower_2077'}});
  rerender({id:'test',pack:'generic'});
  finish({data:[{data:{id:'hidden-boss'}}]});
  await waitFor(()=>expect(result.current.entries[0].id).toBe('training-sentinel'));
  expect(result.current.entries.some(m=>m.id==='hidden-boss')).toBe(false);
});
