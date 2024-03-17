# PMR-Tracker

- This is a tracker for the Paper Mario 64 Randomizer found here: https://pm64randomizer.com/
- The tracker itself is hosted at: https://pmr-tracker.christianlegge.dev/

## Features

### Tracker Logic

Automatically highlights star spirits that are available (without glitches) when all requirements are met. Also supports dungeon entrance shuffle!

### Seed Import

Import seed id's directly from the randomizer website to configure the tracker appropriately for each seed the end user generates.

### Map Tracker

This was the first tracker for Paper Mario Randomizer that has a checklist of every available item spawn location in the game in a very detailed map format.

## Building

### Dependencies

- [NodeJS](https://nodejs.org/en) (v18+)
- [Recommended] [PNpm](https://pnpm.io/)

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

The above was included in the project readme by default. My actual recommendation is Vim, but if you can use that you don't need me to tell you about it.

### Project Setup

```sh
$ git clone https://github.com/christianlegge/pmr-tracker.git
# or
$ git clone git@github.com:christianlegge/pmr-tracker.git
# or
$ gh repo clone christianlegge/pmr-tracker
# ...then
$ cd pmr-tracker
```

### Install Node Dependencies

```sh
$ pnpm install
# or
$ npm install
```

### Compile and Hot-Reload for Development

```sh
$ pnpm dev
# or
$ npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
$ pnpm build
# or
$ npm run build
```

### Format with [Prettier](https://prettier.io/)

```sh
$ pnpm format
# or
$ npm run format
```

### Lint with [ESLint](https://eslint.org/)

```sh
$ pnpm lint
# or
$ npm run lint
```

### Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Contributing

Anyone is welcome to submit features and bug fixes as pull requests. For anyone that wants to submit changes or new features, all you have to do is:

- Create a fork on github
- Submit a pull request from your own branch
- Be descriptive in what you changed and consistent with existing code
- ...
- It will probably get merged unless there's major issues!

### Extra Credits

Thanks to the following for major feature contributions:

- MarioManTaw
- MythicFrog

