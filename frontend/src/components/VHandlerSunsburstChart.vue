<template>
  <VChartSunburst v-if="nodeData.children.length > 0" :nodeData="nodeData" :loggedUser="loggedUser" :pos="pos"></VChartSunburst>
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
      "user", "pos", "sunsburstData", "loggedUser"
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
      getChartInformation(data){
          if(data){
              this.nodeData = {
                  name: '',
                  children: []
              };
              let maxValue =0;
              const res = data.reduce( (it, intel, index)=>{
                  if(!it[intel.address]){
                      it[intel.address] = intel.createdBy;
                      it[intel.address].name = it[intel.address].aliasSlug || it[intel.address].address.substring(0, 7) + "...";
                      it[intel.address].children = [];
                      it[intel.address].reward = 0;
                  }
                  it[intel.address].children.push({
                      name: intel.title.substring(0, Math.min(intel.title.length, 10)),
                      title: intel.title,
                      reward: intel.totalReward,
                      id: intel.id,
                      children: (intel.rewardsTransactions && intel.rewardsTransactions.length > 0)? intel.rewardsTransactions.map( r =>
                      {
                          maxValue = maxValue < r.amount? r.amount: maxValue;
                         return {name: r.amount + "", reward: r.amount}
                      }) : []
                  });
                  it[intel.address].reward = it[intel.address].reward + intel.totalReward;
                  return it;
              } ,{});

              function compare(a,b){
                  return b.reward - a.reward;
              }
              const q1 = maxValue/4;
              const q2 = 2*q1;
              const q3 = 3*q1;
              const tnodes = Object.keys( res).length;
              this.nodeData.children =  Object.values( res).sort(compare).slice(0, Math.min(4,tnodes)).map( (it, index)=>{
                  const tnodes = it.children.length;
                  it.children = it.children.sort(compare).slice(0, Math.min(10,tnodes)).map( (it, index)=>{
                      const tnodes = it.children.length;
                      it.children = it.children.sort(compare).slice(0, Math.min(10,tnodes)).map( (it, index)=>{


                          it.size = it.reward < q1 ? 1: (it.reward < q2 ? 2: (it.reward < q3 ? 3:4 )) ;
                          return it
                      } );

                     // it.size =    it.children.reduce((it,item, index)=>{ console.log(item); return it + item.size},0);
                      it.size =    it.children && it.children.length ?   it.size: 1;
                      return it
                  } );
               //   it.size =  it.children.reduce((it,item, index)=>{ return it + item.size},0);
               //   it.size =   it.size?   it.size: (index +1);
                  return it} );
          }
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