import { h, onBeforeUnmount, onMounted, onUpdated, Ref, ref, SetupContext } from "vue";
import { ExtraProps, ItemProps, itemProps, SlotProps, slotProps } from "@/props";

export const EVENT_TYPE = {
    ITEM: "item_resize",
    ITEM_RESIZE_HANDLER: "onItem_resize",
    SLOT: "slot_resize",
    SLOT_RESIZE_HANDLER: "onSlot_resize",
};

function useWrapper (props: SlotProps, context: SetupContext, event: string) {
    const shapeKey = props.horizontal ? "offsetWidth" : "offsetHeight";
    const elementRef: Ref = ref(null);
    let resizeObserver: ResizeObserver | undefined;
    let currentSize = -1;

    function getCurrentSize () {
        return elementRef.value ? elementRef.value[shapeKey] : 0;
    }

    function dispatchSizeChange () {
        const newSize = getCurrentSize();
        if (newSize !== currentSize) {
            currentSize = newSize;
            context.emit(event, props.uniqueKey, newSize);
        }
    }

    onMounted(() => {
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
                dispatchSizeChange();
            });
            resizeObserver.observe(elementRef.value);
        }
    });

    // since component will be reused, so dispatch when updated
    onUpdated(() => {
        dispatchSizeChange();
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
export const Item = {
    name: "virtual-list-item",
    props: itemProps,
    emits: [EVENT_TYPE.ITEM],
    setup (props: ItemProps, context: SetupContext) {
        const { elementRef } = useWrapper(props, context, EVENT_TYPE.ITEM);
        const {
            tag,
            component
        } = props;
        return () => {
            const extraProps: ExtraProps = {
                source: props.source,
                index: props.index
            };
            return h(tag, {
                key: props.uniqueKey,
                ref: elementRef,
                role: "listitem"
            }, [h(component, extraProps)]);
        };
    }
};

// wrapping for slot
// noinspection JSUnusedGlobalSymbols
export const Slot = {
    props: slotProps,
    emits: [EVENT_TYPE.SLOT],
    setup (props: SlotProps, context: SetupContext) {
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
