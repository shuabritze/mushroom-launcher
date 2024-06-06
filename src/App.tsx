import { Component, For, Show, createSignal, onMount } from "solid-js";

import background from './assets/soulbinder.png';
import { ipcRenderer } from "electron";

type ServerEntry = {
  id: string;
  ip: string;
  port: number;
  online: boolean;
  name: string;
}

declare global {
  interface Window {
    openClientDialog: () => string | undefined;
    getClientLocation: () => string | undefined;
    getServerList: () => Promise<ServerEntry[]>;
    addServerToList: (ip: string, port: number, name: string) => void;
    removeServerFromList: (ip: string, port: number) => void;
  }
}

const openClientDialog = () => {
  return ipcRenderer.sendSync('select-client-dir');
}

const getClientLocation = () => {
  return ipcRenderer.sendSync('get-client-location');
};

const getServerList = () => {
  return ipcRenderer.sendSync('get-server-list');
};

const addServerToList = (ip: string, port: number, name: string) => {
  return ipcRenderer.sendSync('add-server-to-list', ip, port, name);
};

const removeServerFromList = (id: string) => {
  return ipcRenderer.sendSync('remove-server-from-list', id);
};

const AddServerModal = (props: { onClose: () => void, addServer: (ip: string, port: number, name: string) => void }) => {
  const [ip, setIp] = createSignal('');
  const [port, setPort] = createSignal(0);
  const [name, setName] = createSignal('');

  return <div class="w-full h-full flex flex-col items-center justify-center absolute top 0 left-0 bg-black/50 z-10">
    <div class="w-full h-full flex flex-col items-center justify-center bg-black/50 p-4 rounded-md">
      <div class="w-full h-full flex flex-col items-center justify-center">
        <div class="w-full h-full flex flex-col items-center justify-center">
          <div class="text-center text-white text-2xl">Add Server</div>
          <input class="w-full h-full p-4 overflow-hidden" type="text" placeholder="IP" value={ip()} onInput={(e) => setIp(e.currentTarget.value)} />
          <input class="w-full h-full p-4 overflow-hidden" type="number" placeholder="Port" value={port()} onInput={(e) => setPort(parseInt(e.currentTarget.value))} />
          <input class="w-full h-full p-4 overflow-hidden" type="text" placeholder="Name" value={name()} onInput={(e) => setName(e.currentTarget.value)} />
          <button class="w-full h-full p-4 overflow-hidden bg-yellow-200" onClick={() => props.addServer(ip(), port(), name())}>Add</button>
          <button class="w-full h-full p-4 overflow-hidden bg-gray-400" onClick={() => props.onClose()}>Cancel</button>
        </div>
      </div>
    </div>
  </div>
}


const App: Component = () => {
  const [clientUrl, setClientUrl] = createSignal('');
  const [serverList, setServerList] = createSignal<ServerEntry[]>([]);
  const [selectedServer, setSelectedServer] = createSignal<ServerEntry | undefined>(undefined);

  const [showAddServerModal, setShowAddServerModal] = createSignal(false);

  const addServer = (ip: string, port: number, name: string) => {
    addServerToList(ip, port, name);
    setServerList(getServerList());
    setShowAddServerModal(false);
  };

  const removeServer = (id: string) => {
    removeServerFromList(id);
    setServerList(getServerList());
  };

  onMount(() => {
    setClientUrl(getClientLocation());
    setServerList(getServerList());
    if (serverList().length > 0) {
      setSelectedServer(serverList()[0]);
    }
  });

  return (
    <div class="w-screen h-screen relative">
      <Show when={showAddServerModal()}>
        <AddServerModal onClose={() => setShowAddServerModal(false)} addServer={addServer} />
      </Show>
      <div class="w-full h-full flex flex-col" style={{
        background: `url(${background}) no-repeat center center fixed`,
        "background-size": "cover"
      }}>
        <div class="w-full h-full flex flex-col pb-[6rem] text-white">
          <h1 class="w-full text-[1rem] font-bold p-4 drop-shadow-md bg-black/50 flex justify-between">Mushroom Launcher <span>{`v1.0.2`}</span></h1>
          <div class="w-1/2 h-full p-4 overflow-hidden">
            <div class="bg-black/50 w-full h-full rounded-md flex flex-col overflow-hidden">
              <div class="text-center bg-black/50 cursor-pointer text-sm h-[3rem] flex items-center justify-center" onClick={() => setShowAddServerModal(true)}>Add Server +</div>
              <div class="overflow-y-auto no-scrollbar">
                <For each={serverList()}>
                  {(server) => <ServerListItem server={server} selected={selectedServer() === server} onSelect={(server) => setSelectedServer(server)} onDelete={(server) => removeServer(server.id)} />}
                </For>
              </div>
            </div>
          </div>
          <div class="px-4 text-xs w-1/2 cursor-pointer" onClick={() => {
            const result = openClientDialog();
            if (result) {
              setClientUrl(result);
            }
          }}>
            <div class="bg-black/50 p-2 rounded-md">
              <div class="text-white text-nowrap overflow-y-auto no-scrollbar">{clientUrl() || `No Install Location Set`}</div>
              <div class="text-blue-400 underline">Change Install Location</div>
            </div>
          </div>
        </div>
        <div>
        </div>
      </div>

      <div class="absolute bottom-6 flex flex-wrap h-[2rem] gap-3 px-4 items-center">
        <BottomButton text="LAUNCH" color="bg-yellow-600" link={`maple:${selectedServer()?.ip}:${selectedServer()?.port}`} />
        <BottomButton text="PATCH" link={`patch:${clientUrl()}`} />
        <BottomButton text="INSTALL CLIENT" link={`download:${clientUrl()}`} />
        <BottomButton text="GITHUB" link="https://github.com/shuabritze/mushroom-launcher" />
      </div>
    </div>
  );
};

// A list item with online status, server name, server ip:port and a delete button X
const ServerListItem = (props: { server: ServerEntry, selected: boolean, onSelect: (server: ServerEntry) => void, onDelete: (server: ServerEntry) => void }) => {
  return <div class={`flex justify-around gap-2 cursor-pointer hover:bg-black/50 transition-colors duration-300 ${props.selected ? ' bg-black/75' : ''}`} onClick={() => { props.onSelect(props.server) }}>
    <div class="w-6/12 text-sm pl-2 overflow-hidden text-ellipsis text-nowrap">{props.server.name}</div>
    <div class="w-6/12 text-xs flex items-center text-nowrap overflow-hidden text-ellipsis">{props.server.ip}:{props.server.port}</div>
    <div class="w-1/12 flex items-center"><span class={`w-4 h-4 flex rounded-full ${props.server.online ? 'bg-green-500' : 'bg-red-500'}`}></span></div>
    <div class="text-red-500 w-6" onClick={() => { props.onDelete(props.server) }}>X</div>
  </div>
};

const BottomButton = (props: { text: string; color?: string; link?: string; }) => {
  return <a href={props.link ?? "#"} target="_blank"><span class={`${props.color ? props.color : 'bg-slate-800'} p-3 rounded-md text-white cursor-pointer hover:bg-slate-600`}>{props.text}</span></a>
};

export default App;
