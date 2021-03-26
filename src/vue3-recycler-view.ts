import { h, onActivated, onMounted, onUnmounted, Ref, ref, SetupContext, VNode, watch } from "vue";
import { IdType, recyclerViewProps, RecyclerViewProps, SlotWrapperProps, WrapperListItemProps } from "@/props";
import { Range, RangeUpdate, Virtual } from "@/virtual";
import { EVENT_TYPE, ItemWrapper, SlotWrapper } from "@/wrappers";
import { ConcreteComponent } from "@vue/runtime-core";

const EMITTED_EVENT_ITEM_RESIZED = "resized";
const EMITTED_EVENT_SCROLL = "scroll";
const EMITTED_EVENT_TO_TOP = "toTop";
const EMITTED_EVENT_TO_BOTTOM = "toBottom";

const SLOT_TYPE = {
    HEADER: "header", // string value also use for aria role attribute
    FOOTER: "footer"
};

type DirectionKey = "scrollLeft" | "scrollTop"

function isHorizontal (props: RecyclerViewProps) {
    return props.direction === "horizontal";
}

function getDirectionKey (props: RecyclerViewProps): DirectionKey {
    return isHorizontal(props) ? "scrollLeft" : "scrollTop";
}

// noinspection JSUnusedGlobalSymbols
export default {
    name: "vue3-recycler-view",
    props: recyclerViewProps,
    emits: [EMITTED_EVENT_ITEM_RESIZED, EMITTED_EVENT_SCROLL, EMITTED_EVENT_TO_TOP, EMITTED_EVENT_TO_BOTTOM],
    setup (props: RecyclerViewProps, context: SetupContext) {
        const root: Ref = ref(null);
        const shepherd: Ref = ref(null);

        const range: Ref<Range> = ref(new Range());

        const virtual = installVirtual(props,
                range,
                r => (range.value = r)
        );

        function onScrollHandler (evt: Event) {
            onScroll(props, context, root.value, virtual, evt);
        }

        onActivated(() => {
            scrollToOffset(props, root.value, virtual.offset);
        });

        onMounted(() => {
            // set position
            if (props.start) {
                scrollToIndex(props, root.value, shepherd.value, virtual, props.start);
            } else if (props.offset) {
                scrollToOffset(props, root.value, props.offset);
            }

            // in page mode we bind scroll event to document
            if (props.pageMode) {
                updatePageModeFront(props, virtual, root.value);

                document.addEventListener("scroll", onScrollHandler, {
                    passive: false
                });
            }
        });

        onUnmounted(() => {
            virtual.destroy();
            if (props.pageMode) {
                document.removeEventListener("scroll", onScrollHandler);
            }
        });

        watch(() => props.dataSources.length, () => {
            virtual.updateParam({ uniqueIds: getUniqueIdFromDataSources(props) });
            virtual.handleDataSourcesChange();
        });
        watch(() => props.keeps, newValue => {
            virtual.updateParam({ keeps: newValue });
            virtual.handleSlotSizeChange();
        });
        watch(() => props.start, newValue => {
            scrollToIndex(props, root.value, shepherd.value, virtual, newValue);
        });
        watch(() => props.offset, newValue => {
            scrollToOffset(props, root.value, newValue);
        });
        return render(props, context, root, shepherd, virtual, range);
    }
};

function installVirtual (props: RecyclerViewProps, range: Ref<Range>, rangeUpdate: RangeUpdate): Virtual {
    const result = new Virtual({
        slotHeaderSize: 0,
        slotFooterSize: 0,
        keeps: props.keeps,
        estimateSize: props.estimateSize,
        buffer: Math.round(props.keeps / 3), // recommend for a third of keeps
        uniqueIds: getUniqueIdFromDataSources(props)
    }, rangeUpdate);

    // sync initial range
    range.value = result.getRange();
    return result;
}

function getUniqueIdFromDataSources (props: RecyclerViewProps): IdType[] {
    const dataKey = props.dataKey;
    return props.dataSources.map(
            (dataSource) => typeof dataKey === "function" ? dataKey(dataSource) : dataSource[dataKey]
    );
}

function onItemResized (context: SetupContext, virtual: Virtual, id: IdType, size: number) {
    virtual.saveSize(id, size);
    context.emit(EMITTED_EVENT_ITEM_RESIZED, id, size);
}

// event called when slot mounted or size changed
function onSlotResized (virtual: Virtual, type: string, size: number, hasInit: boolean) {
    if (type === SLOT_TYPE.HEADER) {
        virtual.updateParam({ slotHeaderSize: size });
    } else if (type === SLOT_TYPE.FOOTER) {
        virtual.updateParam({ slotFooterSize: size });
    }
    if (hasInit) {
        virtual.handleSlotSizeChange();
    }
}

// set current scroll position to a expectant offset
function scrollToOffset (props: RecyclerViewProps, root: HTMLElement, offset: number) {
    const directionKey = getDirectionKey(props);
    if (props.pageMode) {
        document.body[directionKey] = offset;
        document.documentElement[directionKey] = offset;
    } else {
        if (root) {
            root[directionKey] = offset;
        }
    }
}

// set current scroll position to a expectant index
function scrollToIndex (props: RecyclerViewProps, root: HTMLElement, shepherd: HTMLElement, virtual: Virtual, index: number) {
    // scroll to bottom
    if (index >= props.dataSources.length - 1) {
        scrollToBottom(props, root, shepherd);
    } else {
        const offset = virtual.getOffset(index);
        scrollToOffset(props, root, offset);
    }
}

// set current scroll position to bottom
function scrollToBottom (props: RecyclerViewProps, root: HTMLElement, shepherd: HTMLElement) {
    if (shepherd) {
        const horizontal = isHorizontal(props);
        const offset = shepherd[horizontal ? "offsetLeft" : "offsetTop"];
        scrollToOffset(props, root, offset);

        // check if it's really scrolled to the bottom
        // maybe list doesn't render and calculate to last range
        // so we need retry in next event loop until it really at bottom
        setTimeout(() => {
            const pageMode = props.pageMode;
            const directionKey = getDirectionKey(props);
            if (getOffset(root, pageMode, directionKey) + getClientSize(root, pageMode, horizontal) < getScrollSize(root, pageMode, horizontal)) {
                scrollToBottom(props, root, shepherd);
            }
        }, 3);
    }
}

// return current scroll offset
function getOffset (root: HTMLElement, pageMode: boolean, directionKey: DirectionKey): number {
    if (pageMode) {
        return document.documentElement[directionKey] || document.body[directionKey];
    } else {
        return root ? Math.ceil(root[directionKey]) : 0;
    }
}

// return client viewport size
function getClientSize (root: HTMLElement, pageMode: boolean, isHorizontal: boolean): number {
    const key = isHorizontal ? "clientWidth" : "clientHeight";
    if (pageMode) {
        return document.documentElement[key] || document.body[key];
    } else {
        return root ? Math.ceil(root[key]) : 0;
    }
}

// return all scroll size
function getScrollSize (root: HTMLElement, pageMode: boolean, isHorizontal: boolean): number {
    const key = isHorizontal ? "scrollWidth" : "scrollHeight";
    if (pageMode) {
        return document.documentElement[key] || document.body[key];
    } else {
        return root ? Math.ceil(root[key]) : 0;
    }
}

function onScroll (props: RecyclerViewProps, context: SetupContext, root: HTMLElement, virtual: Virtual, evt: Event) {
    const directionKey = getDirectionKey(props);
    const horizontal = isHorizontal(props);
    const offset = getOffset(root, props.pageMode, directionKey);
    const clientSize = getClientSize(root, props.pageMode, horizontal);
    const scrollSize = getScrollSize(root, props.pageMode, horizontal);

    // iOS scroll-spring-back behavior will make direction mistake
    if (offset < 0 || (offset + clientSize > scrollSize + 1) || !scrollSize) {
        return;
    }

    virtual.handleScroll(offset);
    emitEvent(props, context, virtual, offset, clientSize, scrollSize, evt);
}

// emit event in special position
function emitEvent (props: RecyclerViewProps, context: SetupContext, virtual: Virtual, offset: number, clientSize: number, scrollSize: number, evt: Event) {
    context.emit(EMITTED_EVENT_SCROLL, evt, virtual.getRange());

    if (virtual.isFront() && !!props.dataSources.length && (offset - props.topThreshold <= 0)) {
        context.emit(EMITTED_EVENT_TO_TOP);
    } else {
        if (virtual.isBehind() && (offset + clientSize + props.bottomThreshold >= scrollSize)) {
            context.emit(EMITTED_EVENT_TO_BOTTOM);
        }
    }
}

// when using page mode we need update slot header size manually
// taking root offset relative to the browser as slot header size
function updatePageModeFront (props: RecyclerViewProps, virtual: Virtual, root: HTMLElement) {
    if (root) {
        const rect = root.getBoundingClientRect();
        const defaultView = root.ownerDocument.defaultView;
        const offsetFront = isHorizontal(props) ? (rect.left + (defaultView?.pageXOffset ?? 0)) : (rect.top + (defaultView?.pageYOffset ?? 0));
        virtual.updateParam({ slotHeaderSize: offsetFront });
    }
}

function render (props: RecyclerViewProps, context: SetupContext, root: Ref, shepherd: Ref, virtual: Virtual, range: Ref<Range>) {
    return () => {
        const { header, footer } = context.slots;
        const { padFront, padBehind } = range.value;
        const {
            pageMode,
            rootTag,
            wrapTag,
            wrapClass,
            wrapStyle,
            headerTag,
            headerClass,
            headerStyle,
            footerTag,
            footerClass,
            footerStyle
        } = props;
        const horizontal = isHorizontal(props);
        const paddingStyle = { padding: horizontal ? `0px ${padBehind}px 0px ${padFront}px` : `${padFront}px 0px ${padBehind}px` };
        const wrapperStyle = wrapStyle ? Object.assign({}, wrapStyle, paddingStyle) : paddingStyle;

        // eslint-disable-next-line
        const componentProps: Record<string, any> = {
            ref: root,
            onScroll: (evt: Event) => !pageMode && onScroll(props, context, root.value, virtual, evt)
        };
        const children: VNode[] = [];
        // header slot
        if (header) {
            const slot: ConcreteComponent<SlotWrapperProps> = SlotWrapper;
            const slotProps: SlotWrapperProps = {
                tag: headerTag,
                horizontal,
                uniqueKey: SLOT_TYPE.HEADER,
                class: headerClass,
                style: headerStyle,
                [EVENT_TYPE.SLOT_RESIZE_HANDLER]:
                        (type: string, size: number, hasInit: boolean) => (onSlotResized(virtual, type, size, hasInit))
            };
            children.push(h(slot, slotProps, () => header()));
        }
        // main list
        children.push(h(wrapTag, {
            class: wrapClass,
            role: "group",
            style: wrapperStyle
        }, getRenderSlots(props, context, virtual, range)));

        // footer slot
        if (footer) {
            const slot: ConcreteComponent<SlotWrapperProps> = SlotWrapper;
            const slotProps: SlotWrapperProps = {
                tag: footerTag,
                horizontal,
                uniqueKey: SLOT_TYPE.FOOTER,
                class: footerClass,
                style: footerStyle,
                [EVENT_TYPE.SLOT_RESIZE_HANDLER]:
                        (type: string, size: number, hasInit: boolean) => (onSlotResized(virtual, type, size, hasInit))
            };
            children.push(h(slot, slotProps, () => footer()));
        }
        children.push(
                // an empty element use to scroll to bottom
                h("div", {
                    ref: shepherd,
                    style: {
                        width: horizontal ? "0px" : "100%",
                        height: horizontal ? "100%" : "0px"
                    }
                }));

        return h(rootTag, componentProps, children);
    };
}

// get the real render slots based on range data
// in-place patch strategy will try to reuse components as possible
// so those components that are reused will not trigger lifecycle mounted
function getRenderSlots (props: RecyclerViewProps, context: SetupContext, virtual: Virtual, range: Ref<Range>): VNode[] {
    const slots = [];
    const { start, end } = range.value;
    const {
        dataSources,
        dataKey,
        itemClass,
        itemTag,
        itemStyle,
        itemClassAdd,
        extraProps,
        dataComponent,
        itemScopedSlots
    } = props;
    for (let index = start; index <= end; index++) {
        const dataSource = dataSources[index];
        if (dataSource) {
            const uniqueKey = typeof dataKey === "function" ? dataKey(dataSource) : dataSource[dataKey];
            if (typeof uniqueKey === "string" || typeof uniqueKey === "number") {
                const itemProps: WrapperListItemProps = {
                    index,
                    tag: itemTag,
                    horizontal: isHorizontal(props),
                    uniqueKey: index - start,
                    source: dataSource,
                    extraProps: extraProps,
                    component: dataComponent,
                    scopedSlots: itemScopedSlots,
                    style: itemStyle,
                    class: `${itemClass}${itemClassAdd ? " " + itemClassAdd(index) : ""}`,
                    // listen item size change
                    [EVENT_TYPE.ITEM_RESIZE_HANDLER]: (id: IdType, size: number) => (onItemResized(context, virtual, id, size))
                };
                const item: ConcreteComponent<WrapperListItemProps> = ItemWrapper;
                const node = h(item, itemProps);
                slots.push(node);
            } else {
                console.warn(`Cannot get the data-key '${dataKey}' from data-sources.`);
            }
        } else {
            console.warn(`Cannot get the index '${index}' from data-sources.`);
        }
    }
    return slots;
}

