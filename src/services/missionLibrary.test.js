// @vitest-environment node
import { beforeEach,it,expect,vi } from 'vitest';
const mock=vi.hoisted(()=>({old:null,upload:vi.fn(),remove:vi.fn(),download:vi.fn(),writes:[]}));
vi.mock('../lib/supabase',()=>({supabase:{
  from:()=>{let method,payload;return{select(){return this;},eq(){return this;},maybeSingle:async()=>({data:mock.old}),upsert(row){method='upsert';payload=row;return this;},update(row){method='update';payload=row;return this;},delete(){method='delete';return this;},then(resolve){mock.writes.push({method,payload});return Promise.resolve({error:null}).then(resolve);}};},
  storage:{from:()=>({upload:(...a)=>mock.upload(...a),remove:(...a)=>mock.remove(...a),download:(...a)=>mock.download(...a)})}
}}));
import { CHUNK_SIZE, readMaterialFile, uploadMaterialFile, validateImport } from './missionLibrary';
beforeEach(()=>{mock.old=null;mock.writes=[];vi.clearAllMocks();mock.upload.mockResolvedValue({data:{}});mock.remove.mockResolvedValue({data:{}});});
it('rolls back metadata and uploaded parts if a large PDF fails partway through',async()=>{
  mock.old={id:'old',parts:['old/path'],available:true};
  mock.upload.mockResolvedValueOnce({data:{}}).mockResolvedValueOnce({error:new Error('network')});
  const pdf=new Blob([new Uint8Array(CHUNK_SIZE+5)],{type:'application/pdf'});pdf.name='book.pdf';
  await expect(uploadMaterialFile('mission',{id:'book'},'pdf',pdf)).rejects.toThrow('network');
  expect(mock.upload).toHaveBeenCalledTimes(2);
  expect(mock.remove.mock.calls[0][0]).toHaveLength(1);
  expect(mock.writes.at(-1)).toEqual({method:'upsert',payload:mock.old});
  expect(mock.writes.some(w=>w.method==='update'&&w.payload.available)).toBe(false);
});
it('joins private chunks and rejects a truncated download',async()=>{
  mock.download.mockResolvedValueOnce({data:new Blob(['ab'])}).mockResolvedValueOnce({data:new Blob(['cd'])});
  const file={parts:['a','b'],total_size:4,mime_type:'application/pdf'};
  expect(await (await readMaterialFile(file)).text()).toBe('abcd');
  mock.download.mockResolvedValue({data:new Blob(['a'])});
  await expect(readMaterialFile(file)).rejects.toThrow('incompleto');
});
it('rejects importing a story pack into a neutral mission, or incomplete packages',()=>{
  const manifest={version:1,content_pack:'asa_tower_2077',files:[{code:'D1',key:'pdf',name:'one.pdf',size:4}]};
  expect(()=>validateImport(manifest,[],[],'generic')).toThrow('missão correta');
  expect(()=>validateImport(manifest,[],[{code:'D1'}],'asa_tower_2077')).toThrow('incompleto');
});
