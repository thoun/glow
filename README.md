# What is this project ? 
This project is an adaptation for BoardGameArena of game Glow edited by Bombyx.
You can play here : https://boardgamearena.com

# How to install the auto-build stack

## Install builders
Intall node/npm then `npm i` on the root folder to get builders.

## Auto build JS and CSS files
In VS Code, add extension https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave and then add to config.json extension part :
```json
        "commands": [
            {
                "match": ".*\\.ts$",
                "isAsync": true,
                "cmd": "npm run build:ts"
            },
            {
                "match": ".*\\.scss$",
                "isAsync": true,
                "cmd": "npm run build:scss"
            }
        ]
    }
```
If you use it for another game, replace `glow` mentions on package.json `build:scss` script and on tsconfig.json `files` property.

## Auto-upload builded files
Also add one auto-FTP upload extension (for example https://marketplace.visualstudio.com/items?itemName=lukasz-wronski.ftp-sync) and configure it. The extension will detected modified files in the workspace, including builded ones, and upload them to remote server.

## Hint
Make sure ftp-sync.json and node_modules are in .gitignore

TODO
 - Un moyen de trier ses dés par symbole (quand on en a pleins c'est parfois dur de lire)
 - Quand on passe le curseur sur nos cartes pendant la phase de relance des dés, mettre en surbrillance les dés qui sont liés à la carte (si c'est une carte qui donne +3 éclats pour chaque paire de même symbole, mettre en surbrillance les symboles qu'on trouve par paire dans nos dés)