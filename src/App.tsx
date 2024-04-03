import { Component } from "solid-js";
import { ipcRenderer, ipcMain } from 'electron'

import background from './assets/soulbinder.png';

const App: Component = () => {
  //@ts-expect-error
  const appVersion = window.require ? window.require('electron').remote.app.getVersion() : 'DEV';
  return (
    <div class="w-screen h-screen flex flex-col" style={{
      background: `url(${background}) no-repeat center center fixed`,
      "background-size": "cover"
    }}>
      <div class="w-full h-full">
        <h1 class="w-full text-[1rem] text-white font-bold p-4 drop-shadow-md bg-black/50 flex justify-between">Mushroom Launcher <span>{appVersion}</span></h1>

      </div>
      <div class="w-full h-[16%]">
        <div class="w-full h-full flex items-center px-4 gap-4">
          <BottomButton text="LAUNCH" color="bg-yellow-600" />
          <BottomButton text="PATCH" />
          <BottomButton text="INSTALL CLIENT" />
          <BottomButton text="GITHUB" />
        </div>
      </div>
    </div>
  );
};

const BottomButton = (props: { text: string; color?: string; }) => {
  return <span class={`${props.color ? props.color : 'bg-slate-800'} p-3 rounded-md text-white cursor-pointer hover:bg-slate-600`}>{props.text}</span>
};

export default App;
