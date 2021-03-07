import { DefineComponent, Plugin, ConcreteComponent } from "vue";

declare const Vue3RecyclerView: DefineComponent<{}, {}, any> & { install: Exclude<Plugin["install"], undefined> };
export default Vue3RecyclerView;

export interface RecyclerViewProps {
    dataKey: string | Function;
    dataSources: Array<any>;
    dataComponent: ConcreteComponent<ListItemProps>;
    keeps: number;
    extraProps: object;
    estimateSize: number;
    direction: string;
    start: number;
    offset: number;
    topThreshold: number;
    bottomThreshold: number;
    pageMode: boolean;
    rootTag: string;
    wrapTag: string;
    wrapClass: string;
    wrapStyle: object;
    itemTag: string;
    itemClass: string;
    itemClassAdd: Function;
    itemStyle: object;
    headerTag: string;
    headerClass: string;
    headerStyle: object;
    footerTag: string;
    footerClass: string;
    footerStyle: object;
    itemScopedSlots: object;
}

export interface ListItemProps<T = object, P = object> {
    source: T;
    index: number;
    extraProps: P
}
