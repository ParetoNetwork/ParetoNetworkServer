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
            let children = intel.rewardList.map(reward => ({name: reward.profile.alias, size: reward.reward, reward: reward.reward}));
            this.nodeData.children.push({
              name: intel.title,
              reward: intel.size,
              children
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