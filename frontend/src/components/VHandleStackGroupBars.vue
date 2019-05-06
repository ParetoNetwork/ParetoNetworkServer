<template>
  <div>
    <VStackedToGroupedBars></VStackedToGroupedBars>
  </div>
</template>

<script>
  import chartService from '../services/chartService';
  import VStackedToGroupedBars from './VStackedToGroupedBars';

  export default {
    name: "VHandleStackGroupBars",
    components: {
      VStackedToGroupedBars
    },
    mounted() {
      chartService.getStackedGroupedInformation(function(res){
        console.log(res);
      });
    }
  }
</script>

<style scoped>

</style>