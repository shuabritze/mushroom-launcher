import { Component } from "solid-js";

import background from './assets/soulbinder.png';

const App: Component = () => {
  return (
    <div class="w-screen h-screen relative">
      <div class="w-full h-full flex flex-col" style={{
        background: `url(${background}) no-repeat center center fixed`,
        "background-size": "cover"
      }}>
        <div class="w-full h-full flex flex-col pb-[6rem] text-white">
          <h1 class="w-full text-[1rem] font-bold p-4 drop-shadow-md bg-black/50 flex justify-between">Mushroom Launcher <span>{`v1.0.0`}</span></h1>
          <div class="w-1/2 h-full p-4 overflow-hidden">
            <div class="bg-black/50 w-full h-full rounded-md flex flex-col overflow-hidden">
              <div class="text-center bg-black/50 cursor-pointer text-sm h-[3rem] flex items-center justify-center">Add Server +</div>
              <div class="overflow-y-auto no-scrollbar">
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={true} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 3 super long server name', ip: '192.168.0.2 super long ip', port: '6000', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
                <ServerListItem server={{ name: 'Test 1', ip: '127.0.0.1', port: '6969', online: false }} selected={false} />
                <ServerListItem server={{ name: 'Test 2', ip: '192.168.0.1', port: '6000', online: true }} selected={false} />
              </div>
            </div>
          </div>
          <div class="px-4 text-xs w-1/2 cursor-pointer">
            <div class="bg-black/50 p-2 rounded-md">
              <div class="text-white text-nowrap overflow-y-auto no-scrollbar">{`No Install Location Set`}</div>
              <div class="text-blue-400 underline">Change Install Location</div>
            </div>
          </div>
        </div>
        <div>
        </div>
      </div>

      <div class="absolute bottom-6 flex flex-wrap h-[2rem] gap-3 px-4 items-center">
        <BottomButton text="LAUNCH" color="bg-yellow-600" />
        <BottomButton text="PATCH" />
        <BottomButton text="INSTALL CLIENT" />
        <BottomButton text="GITHUB" link="https://github.com/shuabritze/mushroom-launcher" />
      </div>
    </div>
  );
};

// A list item with online status, server name, server ip:port and a delete button X
const ServerListItem = (props: { server: { name: string, ip: string, port: string, online: boolean }, selected: boolean }) => {
  return <div class={`flex justify-around gap-2 cursor-pointer hover:bg-black/50 transition-colors duration-300 ${props.selected ? ' bg-black/75' : ''}`} onClick={() => { props.selected = !props.selected }}>
    <div class="w-6/12 text-sm pl-2 overflow-hidden text-ellipsis text-nowrap">{props.server.name}</div>
    <div class="w-6/12 text-xs flex items-center text-nowrap overflow-hidden text-ellipsis">{props.server.ip}:{props.server.port}</div>
    <div class="w-1/12 flex items-center"><span class={`w-4 h-4 flex rounded-full ${props.server.online ? 'bg-green-500' : 'bg-red-500'}`}></span></div>
    <div class="text-red-500 w-6">X</div>
  </div>
};

const BottomButton = (props: { text: string; color?: string; link?: string; }) => {
  return <a href={props.link ?? "#"} target="_blank"><span class={`${props.color ? props.color : 'bg-slate-800'} p-3 rounded-md text-white cursor-pointer hover:bg-slate-600`}>{props.text}</span></a>
};

export default App;
