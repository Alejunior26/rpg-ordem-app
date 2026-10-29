import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const fake=vi.hoisted(()=>({ user:{id:'00000000-0000-4000-8000-000000000001',email:'admin@example.test'},rpc:vi.fn(),queries:[] }));
vi.mock('./auth/AuthProvider',()=>({useAuth:()=>({user:fake.user,role:'admin',loading:false,signOut:vi.fn()})}));
vi.mock('./hooks/useMissionCombat',()=>({useMissionCombat:()=>({state:null,logs:[],error:'',refresh:vi.fn(),action:vi.fn(),appendLogs:vi.fn()})}));
vi.mock('./lib/supabase',()=>({supabase:{
  rpc:(...args)=>fake.rpc(...args),
  from:(table)=>{
    const query={table,filters:[]}; fake.queries.push(query);
    const builder={ select(){return this;},eq(key,value){query.filters.push([key,value]);return this;},order(){return this;},then(resolve){
      const mission={id:'00000000-0000-4000-8000-000000000010',name:'Missão A'};
      const chars=[
        {id:'00000000-0000-4000-8000-000000000020',owner_id:fake.user.id,name:'Agent A',mission_id:mission.id,revision:0,sheet_json:{nomePersonagem:'Agent A',pvAtual:11,setupComplete:true}},
        {id:'00000000-0000-4000-8000-000000000021',owner_id:fake.user.id,name:'Agent B',mission_id:mission.id,revision:0,sheet_json:{nomePersonagem:'Agent B',pvAtual:17,setupComplete:true}},
        {id:'00000000-0000-4000-8000-000000000022',owner_id:'foreign-owner',name:'Foreign Agent',mission_id:mission.id,revision:0,sheet_json:{nomePersonagem:'Foreign Agent',pvAtual:99,setupComplete:true}},
      ];
      let data=table==='missions'?[mission]:table==='characters'?chars:[];
      for(const [key,value] of query.filters) data=data.filter(x=>x[key]===value);
      return Promise.resolve({data,error:null}).then(resolve);
    }};return builder;
  },
}}));
beforeEach(()=>{ window.localStorage.clear(); fake.queries.length=0;fake.rpc.mockReset();fake.rpc.mockImplementation(async(name,args)=>({data:name==='asa_save_character'?{revision:args.p_expected_revision+1}:null,error:null}));});
afterEach(cleanup);
describe('character switching in the real application',()=>{
  it('keeps the administrator personal picker scoped to the owner and saves B then A with their own values',async()=>{
    render(<App/>);
    await screen.findByDisplayValue('Agent A');
    expect(screen.queryByDisplayValue('Foreign Agent')).toBe(null);
    fireEvent.click(screen.getAllByText('Selecionar')[1]);
    fireEvent.click(screen.getByText('Confirmar missão e personagem'));
    await waitFor(()=>expect(fake.rpc.mock.calls.some(([name,args])=>name==='asa_save_character'&&args.p_character_id.endsWith('21'))).toBe(true),{timeout:3000});
    const saveB=fake.rpc.mock.calls.filter(([name])=>name==='asa_save_character').at(-1)[1];
    expect(saveB.p_sheet.nomePersonagem).toBe('Agent B');expect(saveB.p_sheet.pvAtual).toBe(17);
    fireEvent.click(screen.getByText('Missão/Personagem'));
    fireEvent.click(screen.getAllByText('Selecionar')[0]);
    fireEvent.click(screen.getByText('Confirmar missão e personagem'));
    await waitFor(()=>expect(fake.rpc.mock.calls.some(([name,args])=>name==='asa_save_character'&&args.p_character_id.endsWith('20'))).toBe(true),{timeout:3000});
    const saveA=fake.rpc.mock.calls.filter(([name])=>name==='asa_save_character').at(-1)[1];
    expect(saveA.p_sheet.nomePersonagem).toBe('Agent A');expect(saveA.p_sheet.pvAtual).toBe(11);
  });
});
