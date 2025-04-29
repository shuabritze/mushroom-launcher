# Mushroom Launcher

A launcher for a certain mushroom game.

Installation:
1. Download the latest release here: https://github.com/shuabritze/mushroom-launcher/releases
2. Install the launcher
3. Open the launcher and select your existing MS2 install location OR select a new empty folder to download the client files to.
4. (optional) If you need to install the client, click on Install and wait for the command window to finish (May take a while to download 13gb~)
5. After downloading or selecting the install folder, click on Patch, this will add Maple2.dll to your installation
6. Add a new server (ip, port, and name in order)
7. Select the server by clicking on it then click on Launch
8. Maple away!

# Help! Windows says this is a virus!
Mushroom Launcher is fully open source, you can build it yourself, however this is just the nature of a program that modifies another program at runtime.

## Mod Creation
- Enable "Mod Developer" mode
- Click "Create Mod" in the mods tab
- Enter ID, Name, and a URL (doesn't need to exist yet)
- Browse to the mod folder after creation
- Add replacement files (Currently only XML under /Data/Xml)
- For example to replace stringcommon.xml
-         /mods/<modId>/Data/Xml/string/stringcommon.xml

- After adding files click "Add Local Files"
- Upload the mod folder to the URL, ensure that the mod isn't disabled.
- The launcher will hash check each file and ensure that it only downloads changed mod files on update.

## 🛫 Dev quick start

1. Clone Repo
2. Install pnpm
3. Run `pnpm install`
4. Run `pnpm start`
