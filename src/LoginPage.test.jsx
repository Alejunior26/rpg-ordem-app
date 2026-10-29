import React from 'react';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { afterEach,it,expect,vi } from 'vitest';
import LoginPage from './LoginPage';
const auth=vi.hoisted(()=>({signIn:vi.fn(),signUp:vi.fn(),resetPassword:vi.fn()}));
vi.mock('./auth/AuthProvider',()=>({useAuth:()=>auth}));
afterEach(cleanup);
it('submits the labelled login form and reports errors inline',async()=>{
  auth.signIn.mockResolvedValue({error:{message:'Invalid login credentials'}});
  render(<LoginPage/>);
  fireEvent.change(screen.getByLabelText('E-mail'),{target:{value:'agent@example.test'}});
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'sample-password'}});
  fireEvent.submit(screen.getByRole('form',{name:'Entrar no A.S.A'}));
  await waitFor(()=>expect(auth.signIn).toHaveBeenCalledWith('agent@example.test','sample-password'));
  expect(await screen.findByText('E-mail ou senha incorretos.')).toBeTruthy();
});
