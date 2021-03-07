<script lang="ts">
import { PropType, ref, watch } from "vue";
import { ListItemProps } from "@/props";

export interface DataItem {
  id: number;
  text: string;
}

interface ExtraProps {
  desc: string;
}

export default {
  name: "list-item",
  props: {
    source: {
      required: true,
      type: Object as PropType<DataItem>
    },
    extraProps: {
      required: true,
      type: Object as PropType<ExtraProps>
    }
  },
  setup (props: ListItemProps<DataItem, ExtraProps>) {
    const counter = ref(0);

    watch(() => props.extraProps.desc, (value, oldValue) => {
      console.log(`Desc changed from ${oldValue} to ${value}`);
      counter.value = counter.value + 1;
    });

    return {
      counter
    };
  }
};
</script>

<template>
  <div class="item">
    <div>#{{ source.id }}</div>
    <div class="extra">{{ extraProps.desc }}
      <div class="message" v-if="counter">
        Counter was changed {{ counter }} times
      </div>
    </div>
    <div>{{ source.text }}</div>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid lightgrey;
  padding: 1em;
}

.extra {
  font-weight: bold;
  font-size: 1.1em;
  margin: 10px 0;
}

.message {
  font-weight: normal;
  font-style: italic;
  font-size: 0.7em;
  color: gray;
}
</style>