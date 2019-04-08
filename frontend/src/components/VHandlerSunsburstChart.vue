<template>
  <VChartSunburst v-if="nodeData.children.length > 0" :nodeData="nodeData"></VChartSunburst>
</template>

<script>
  import VChartSunburst from './VChartSunburst';
  import profileService from '../services/profileService';

  export default {
    components: {
      VChartSunburst
    },
    props: [
      "user"
    ],
    data(){
      return {
        nodeData: {
          name: '',
          children: []
        }
      }
    },
    name: "VHandlerSunsburstChart",
    methods: {
      getChartInformation(){
        profileService.getChartInfo(res =>{
          this.nodeData.name = this.user.alias;
          res.forEach(intel => {
            this.nodeData.children.push({
              name: intel.title,
              size: intel.totalReward
            })
          });
        }, error => {

        });
      }
    },
    watch: {
      user(){
        //Loads chart information when user props loads
        this.getChartInformation()
      }
    }
  }
</script>

<style scoped>

</style>