<script lang="ts">
import { PropType } from "vue";

export interface DataItem {
    id: number;
    text: string;
}

export default {
    name: "list-item",
    props: {
        source: {
            required: true,
            type: Object as PropType<DataItem>
        }
    }
};
</script>

<template>
    <div class="item">
        <div>#{{ source.id }}</div>
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
</style>