import { h, onBeforeUnmount, onMounted, onUpdated, Ref, ref, SetupContext } from "vue";
import { ExtraProps, ItemProps, itemProps, SlotProps, slotProps } from "@/props";

function useWrapper (props: SlotProps, context: SetupContext) {
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
            context.emit(props.event, props.uniqueKey, newSize);
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
    setup (props: ItemProps, context: SetupContext) {
        const { elementRef } = useWrapper(props, context);
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
    setup (props: SlotProps, context: SetupContext) {
        const { tag, uniqueKey } = props;
        const { elementRef } = useWrapper(props, context);

        const rawProps = {
            key: uniqueKey,
            ref: elementRef,
            role: uniqueKey
        };
        return () => h(tag, rawProps, context.slots.default ? context.slots.default() : undefined);
    }
};
