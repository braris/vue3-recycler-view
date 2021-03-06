import { DefineComponent, Plugin } from 'vue';

declare const Vue3RecyclerView: DefineComponent<{}, {}, any> & { install: Exclude<Plugin['install'], undefined> };
export default Vue3RecyclerView;
