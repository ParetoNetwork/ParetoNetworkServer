<template>
  <VChartSunburst v-if="nodeData.children.length > 0" :nodeData="nodeData" :pos="pos"></VChartSunburst>
</template>

<script>
  import VChartSunburst from './VChartSunburst';
  import profileService from '../services/profileService';

  export default {
    components: {
      VChartSunburst
    },
    props: [
      "user", "pos"
    ],
    data() {
      return {
        nodeData: {
          name: '',
          children: []
        }
      }
    },
    name: "VHandlerSunsburstChart",
    methods: {
      getChartInformation() {
        profileService.getChartInfo(res => {
          this.nodeData.name = this.user.alias;
          res.forEach(intel => {
            let children = intel.rewardList.map(reward => (
                {
                  type: 'profile',
                  name: reward.profile.alias || reward.profile.address.substring(0, 5),
                  slug: reward.profile.aliasSlug,
                  address: reward.profile.address,
                  size: reward.reward,
                  reward: reward.reward
                })
            );
            this.nodeData.children.push({
              name: intel.title,
              reward: intel.size,
              type: 'intel',
              children
            })
          });
        }, error => {

        });
      }
    },
    watch: {
      user() {
        //Loads chart information when user props loads
        this.getChartInformation()
      }
    }
  }
</script>

<style scoped>

</style>