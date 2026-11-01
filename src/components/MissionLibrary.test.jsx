import React from 'react';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { beforeEach,afterEach,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({load:vi.fn(),update:vi.fn(),download:vi.fn()}));
vi.mock('../services/missionLibrary',()=>({loadLibrary:(...args)=>mock.load(...args),readMaterialFile:(...args)=>mock.download(...args),uploadMaterialFile:vi.fn(),validateImport:vi.fn()}));
vi.mock('../lib/supabase',()=>({supabase:{from:()=>({update:value=>{mock.update(value);return{eq(){return this;},then(resolve){return Promise.resolve({error:null}).then(resolve);}};}})}}));
import MissionLibrary from './MissionLibrary';
const clue={id:'clue',code:'D01',title:'Foto encontrada',kind:'photo',body:'Eu queria guardar um dia bom.',gm_only:false,released:false,sort_order:1,files:[],notes:{scene:'C10',place:'Gaveta fechada',note:'Explicação reservada'}};
beforeEach(()=>{mock.load.mockReset();mock.update.mockReset();mock.load.mockResolvedValue([clue]);});
afterEach(cleanup);
it('shows GM locations, flips the photo and explicitly delivers the individual item',async()=>{
  render(<MissionLibrary missionId="a" missionName="Story" manager contentPack="asa_tower_2077"/>);
  await screen.findByText('Onde encontrar: Gaveta fechada');
  fireEvent.click(screen.getByRole('button',{name:'Virar fotografia'}));
  expect(screen.getByText(clue.body)).toBeTruthy();
  mock.load.mockResolvedValue([{...clue,released:true}]);
  fireEvent.click(screen.getByRole('button',{name:'Entregar aos jogadores'}));
  await screen.findByRole('button',{name:'Recolher dos jogadores'});
  expect(mock.update).toHaveBeenCalledWith({released:true});
});
it('shows no hidden titles or import controls in a new neutral mission',async()=>{
  mock.load.mockResolvedValue([]);
  render(<MissionLibrary missionId="new" missionName="Test" manager/>);
  await screen.findByText('Nenhum material nesta missão');
  expect(screen.queryByText('Foto encontrada')).toBeNull();
  expect(screen.queryByLabelText('Arquivos do pacote da campanha')).toBeNull();
});
it('does not offer GM notes or release controls to a player',async()=>{
  mock.load.mockResolvedValue([{...clue,released:true,notes:undefined}]);
  render(<MissionLibrary missionId="a" missionName="Story" manager={false}/>);
  await screen.findByRole('button',{name:'Virar fotografia'});
  expect(mock.load).toHaveBeenCalledWith('a',false);
  expect(screen.queryByText(/Gaveta fechada/)).toBeNull();
  expect(screen.queryByRole('button',{name:'Recolher dos jogadores'})).toBeNull();
});
it('keeps complete GM books without a delivery button',async()=>{
  mock.load.mockResolvedValue([{...clue,kind:'book',gm_only:true}]);
  render(<MissionLibrary missionId="a" manager/>);
  await screen.findByText(clue.body);
  expect(screen.queryByRole('button',{name:'Entregar aos jogadores'})).toBeNull();
});
