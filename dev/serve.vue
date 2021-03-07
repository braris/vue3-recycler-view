<script lang="ts">
import { markRaw, ref, reactive } from "vue";
import Vue3RecyclerView from "@/vue3-recycler-view";
import ListItem, { DataItem } from "./list-item.vue";

export default {
  name: "ServeDev",
  components: {
    Vue3RecyclerView,
    ListItem
  },
  setup () {
    const items = ref(getData(10000));
    const extraProps = reactive({
      desc: "This is extra prop"
    });

    function buttonClick () {
      extraProps.desc = "* " +extraProps.desc + " *";
    }

    return {
      items,
      item: markRaw(ListItem),
      extraProps,

      buttonClick
    };
  }
};

function getData (count: number): DataItem[] {
  const data = [];
  for (let index = 0; index < count; index++) {
    data.push({
      id: index,
      text: random_data.substr(0, 10 + Math.random() * (random_data.length - 10))
    });
  }
  return data;
}

const random_data = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ornare fermentum dolor at tincidunt. Integer mi turpis, dignissim id vehicula vitae, porta sed est. Sed ipsum nisl, euismod id sem ut, vulputate fermentum urna. Donec pellentesque vehicula ipsum, sollicitudin tincidunt tortor vestibulum eu. Duis at tortor erat. Quisque sed tellus a diam porta tempus id in nibh. Mauris vehicula velit eget augue finibus, quis efficitur velit iaculis. Praesent nec vestibulum ipsum. Sed augue sem, dapibus ut posuere sit amet, pulvinar nec justo.
Nulla facilisi. Praesent porta quis lacus et porta. Vivamus eleifend elementum libero id pharetra. Proin in congue tortor. Suspendisse at diam malesuada, porta mauris in, commodo nisl. Donec ut ullamcorper orci, quis sagittis nulla. Morbi sem ipsum, molestie in imperdiet in, lacinia ac orci. Pellentesque enim mauris, pharetra sed nisi sed, vestibulum feugiat massa. Quisque ac est dignissim, tincidunt diam at, tincidunt purus. Donec rutrum sem vel purus tempor pretium.
In sagittis lectus at tortor mollis tristique. Suspendisse varius felis orci, sed mattis justo ultricies a. Praesent et elit placerat, porttitor quam a, rhoncus nulla. Quisque ante tellus, tincidunt eu turpis nec, vestibulum feugiat nibh. Nam a posuere ligula. Fusce vestibulum velit non vestibulum porta. Vivamus mattis quis leo vel vulputate.
Aliquam faucibus eros sit amet semper molestie. Vestibulum vel tellus suscipit, mattis mauris quis, viverra tortor. Pellentesque consequat, erat non porttitor egestas, ex ante facilisis elit, in feugiat diam mauris eget massa. In sit amet ex ut augue faucibus consequat. Aenean et nisi vitae urna tincidunt ullamcorper. Donec scelerisque pellentesque arcu et consectetur. Integer faucibus nisl sed pellentesque sagittis. Sed eget massa eros. Pellentesque eu libero feugiat purus dignissim interdum. Aliquam felis tortor, suscipit eget velit id, facilisis egestas dolor. Vivamus ultrices ultrices ipsum, accumsan condimentum metus egestas nec. Nam et ex metus. Praesent quis justo eget metus scelerisque semper pharetra in sapien. Morbi mattis faucibus risus nec interdum. Cras eleifend libero nulla, eu convallis est volutpat at. Proin aliquet felis sed enim fringilla, convallis dignissim libero tempus.
Vivamus pharetra, risus et porta rutrum, dolor ligula commodo purus, laoreet congue erat tellus quis ante. Phasellus sit amet tellus malesuada, finibus quam non, imperdiet ligula. Vivamus enim sapien, dignissim id diam bibendum, efficitur egestas metus. Sed vel lacus ut urna faucibus porttitor. Aenean porta tortor ut lectus luctus facilisis. Mauris id ipsum non ipsum mollis vehicula. Nam at commodo lorem, et feugiat tellus.
Aliquam elementum erat purus, nec sollicitudin odio hendrerit eget. Aliquam erat volutpat. Nulla non dui suscipit, dignissim eros sit amet, faucibus orci. Nullam tincidunt vehicula nisi, nec ornare nulla vehicula et. Donec volutpat odio eu porttitor ornare. Ut auctor semper velit, eu sodales nisi feugiat in. Mauris suscipit, libero nec efficitur sollicitudin, ante mauris viverra velit, nec consectetur eros nunc eu felis.
Nunc ac mauris ut neque cursus ultrices vel et nibh. Cras porttitor tempus justo non sagittis. Proin sollicitudin at lectus vitae sodales. Sed eget ex volutpat, suscipit tortor vitae, egestas nisi. Nam ligula est, suscipit sed dignissim rhoncus, ultrices et erat. Aliquam id.
`;

</script>

<template>
  <div id="app">
    <vue3-recycler-view
        :data-key="'id'"
        :data-sources="items"
        :data-component="item"
        :keeps="30"
        :extra-props="extraProps"

        class="list"
        style="height: 500px; overflow-y: auto;">
      <template v-slot:header>
        <h1>HEADER</h1>
      </template>

      <template v-slot:footer>
        <h3>FOOTER</h3>
      </template>
    </vue3-recycler-view>
    <div class="buttons">
      <button @click="buttonClick">Update list item's extra props</button>
    </div>
  </div>
</template>


<style scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 1em;
  padding: 1em;
}

.list {
  border: 1px solid lightgrey;
}

.buttons {
  margin-top: 20px;
}
</style>