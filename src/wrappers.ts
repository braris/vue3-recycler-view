import { h, onBeforeUnmount, onMounted, onUpdated, Ref, ref, SetupContext } from "vue";
import { itemProps, ListItemProps, SlotWrapperProps, slotWrapperProps, WrapperListItemProps } from "@/props";

export const EVENT_TYPE = {
    ITEM: "item_resize",
    ITEM_RESIZE_HANDLER: "onItem_resize",
    SLOT: "slot_resize",
    SLOT_RESIZE_HANDLER: "onSlot_resize",
};

function useWrapper (props: SlotWrapperProps, context: SetupContext, event: string) {
    const shapeKey = props.horizontal ? "offsetWidth" : "offsetHeight";
    const elementRef: Ref = ref(null);
    let resizeObserver: ResizeObserver | undefined;
    let currentSize = -1;

    function getCurrentSize () {
        return elementRef.value ? elementRef.value[shapeKey] : 0;
    }

    function dispatchSizeChange (newSize: number | undefined) {
        const nSize: number = !newSize ? getCurrentSize() : newSize;
        if (nSize !== currentSize) {
            currentSize = nSize;
            context.emit(event, props.uniqueKey, nSize);
        }
    }

    onMounted(() => {
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver((entries) => {
                if (entries.length != 0) {
                    const entry = entries[0];
                    const size = props.horizontal ? entry.borderBoxSize[0].inlineSize : entry.borderBoxSize[0].blockSize;
                    dispatchSizeChange(size);
                }

            });
            resizeObserver.observe(elementRef.value);
        }
    });

    // since component will be reused, so dispatch when updated
    onUpdated(() => {
        if (!resizeObserver) {
            dispatchSizeChange(undefined);
        }
    });

    onBeforeUnmount(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = undefined;
        }
    });

    return {
        elementRef
    };
}

// noinspection JSUnusedGlobalSymbols
export const ItemWrapper = {
    name: "virtual-list-item",
    props: itemProps,
    emits: [EVENT_TYPE.ITEM],
    setup (props: WrapperListItemProps, context: SetupContext) {
        const { elementRef } = useWrapper(props, context, EVENT_TYPE.ITEM);
        const {
            tag,
            component
        } = props;
        return () => {
            const componentProps: ListItemProps = {
                index: props.index,
                source: props.source,
                extraProps: props.extraProps ?? {}
            };
            return h(tag, {
                key: props.uniqueKey,
                ref: elementRef,
                role: "listitem"
            }, [h(component, componentProps)]);
        };
    }
};

// wrapping for slot
// noinspection JSUnusedGlobalSymbols
export const SlotWrapper = {
    props: slotWrapperProps,
    emits: [EVENT_TYPE.SLOT],
    setup (props: SlotWrapperProps, context: SetupContext) {
        const { tag, uniqueKey } = props;
        const { elementRef } = useWrapper(props, context, EVENT_TYPE.SLOT);

        const rawProps = {
            key: uniqueKey,
            ref: elementRef,
            role: uniqueKey
        };
        return () => h(tag, rawProps, context.slots.default ? context.slots.default() : undefined);
    }
};
