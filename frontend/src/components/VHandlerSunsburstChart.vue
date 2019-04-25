<template>
  <VChartSunburst v-if="nodeData.children.length > 0" :nodeData="nodeData" :pos="pos"></VChartSunburst>
</template>

<script>
  import VChartSunburst from './VChartSunburst';
  import profileService from '../services/profileService';
  import { mapState } from 'vuex';

  export default {
    components: {
      VChartSunburst
    },
    props: [
      "user", "pos", "sunsburstData"
    ],
    computed: {
        ...mapState(["firstContent"]),
    },
    data() {
      return {
        nodeData: {
          name: '',
          children: []
        }
      }
    },
    name: "VHandlerSunsburstChart",
    mounted(){
      if(this.sunsburstData){
        this.nodeData = this.sunsburstData;
      }

      if(this.user){
        this.getChartInformation();
      }
    },
    methods: {
      getChartInformation(data) {
          if(data){
              this.nodeData = {
                  name: '',
                  children: []
              };
              const res = data.reduce( (it, intel, index)=>{
                  if(!it[intel.address]){
                      it[intel.address] = intel.createdBy;
                      it[intel.address].name = it[intel.address].aliasSlug || "No Alias";
                      it[intel.address].children = [];
                  }
                  it[intel.address].children.push({
                      name: intel.title.substring(0, Math.min(intel.title.length, 10)),
                      title: intel.title,
                      reward: intel.reward,
                      id: intel.id,
                      size: intel.reward,
                      children: (intel.rewardsTransactions.length > 0)? intel.rewardsTransactions.map( r => ({name: r.aliasSlug || "No Alias", reward: r.amount, size: r.amount})) : []
                  });
                  return it;
              } ,{});

              this.nodeData.children =  Object.values( res);
          }


        // profileService.getChartInfo(res => {
        //   this.nodeData = {
        //     name: '',
        //     children: []
        //   };
        //
        //   res.forEach(profile => {
        //     profile.name = profile.alias || profile.address;
        //     profile.children = profile.intels.map( intel => {
        //       intel.name = intel.title.substring(0, 10);
        //       intel.size = 4;
        //
        //       intel.children = (intel.rewards.length > 0)? intel.rewards.map( r => ({name: r.intelAddress.substring(0, 10), reward: r.amount, size: 4})) : [];
        //       // console.log()
        //       return intel;
        //       // intel.children = intel.rewards.forEach( res )
        //     });
        //   });
        //
        //   this.nodeData.children = res;
        //   // res.forEach(intel => {
        //   //   let children = intel.rewardList.map(reward => (
        //   //       {
        //   //         type: 'profile',
        //   //         name: reward.profile.alias || reward.profile.address.substring(0, 5),
        //   //         slug: reward.profile.aliasSlug,
        //   //         address: reward.profile.address,
        //   //         size: reward.reward,
        //   //         reward: reward.reward
        //   //       })
        //   //   );
        //   //   this.nodeData.children.push({
        //   //     name: intel.title,
        //   //     reward: intel.size,
        //   //     type: 'intel',
        //   //     children
        //   //   })
        //   // });
        // }, error => {
        //
        // });
        //   }


      }
    },
    watch: {
      user() {
        //Loads chart information when user props loads
        //this.getChartInformation();
      },
      firstContent(newValue, oldValue) {
          this.getChartInformation(newValue);

      },
    }
  }
</script>

<style scoped>

</style>