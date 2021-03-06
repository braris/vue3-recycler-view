import { PropType } from "vue";
import { ConcreteComponent } from "@vue/runtime-core";

/**
 * props declaration for default, item and slot component
 */

export type IdType = number | string;

export const virtualProps = {
    dataKey: {
        type: [String, Function],
        required: true
    },
    dataSources: {
        type: Array,
        required: true
    },
    dataComponent: {
        type: [Object, Function],
        required: true
    },

    keeps: {
        type: Number,
        default: 30
    },
    extraProps: {
        type: Object
    },
    estimateSize: {
        type: Number,
        default: 50
    },

    direction: {
        type: String,
        default: "vertical" // the other value is horizontal
    },
    start: {
        type: Number,
        default: 0
    },
    offset: {
        type: Number,
        default: 0
    },
    topThreshold: {
        type: Number,
        default: 0
    },
    bottomThreshold: {
        type: Number,
        default: 0
    },
    pageMode: {
        type: Boolean,
        default: false
    },
    rootTag: {
        type: String,
        default: "div"
    },
    wrapTag: {
        type: String,
        default: "div"
    },
    wrapClass: {
        type: String,
        default: ""
    },
    wrapStyle: {
        type: Object
    },
    itemTag: {
        type: String,
        default: "div"
    },
    itemClass: {
        type: String,
        default: ""
    },
    itemClassAdd: {
        type: Function
    },
    itemStyle: {
        type: Object
    },
    headerTag: {
        type: String,
        default: "div"
    },
    headerClass: {
        type: String,
        default: ""
    },
    headerStyle: {
        type: Object
    },
    footerTag: {
        type: String,
        default: "div"
    },
    footerClass: {
        type: String,
        default: ""
    },
    footerStyle: {
        type: Object
    }
};

export interface VirtualProps {
    dataKey: string | Function;
    // eslint-disable-next-line
    dataSources: Array<any>;
    dataComponent: ConcreteComponent<ExtraProps>;
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

export const slotProps = {
    event: {
        type: String
    },
    uniqueKey: {
        type: [String, Number]
    },
    tag: {
        type: String
    },
    horizontal: {
        type: Boolean
    }
};

export interface SlotProps {
    event: string;
    uniqueKey: string | number;
    tag: string;
    horizontal: boolean;

    [index: string]: any;
}

export const itemProps = {
    index: {
        type: Number
    },
    event: {
        type: String
    },
    tag: {
        type: String
    },
    horizontal: {
        type: Boolean
    },
    source: {
        type: Object
    },
    component: {
        type: [Object, Function]
    },
    uniqueKey: {
        type: [String, Number]
    },
    extraProps: {
        type: Object as PropType<ExtraProps>,
        default: {}
    },
    scopedSlots: {
        type: Object,
        default: {}
    }
};

export interface ExtraProps {
    source?: object;
    index?: number;
}

export interface ItemProps extends SlotProps {
    index: number;
    source: object;
    component: ConcreteComponent<ExtraProps>;
    extraProps: ExtraProps;
    scopedSlots: object;
}
