<template>
  <div>
    <VStackedToGroupedBars v-if="loaded" :stackedBarData="stackedBarData" :monthsInformation="monthsInformation" :monthsNumber="monthsNumber"></VStackedToGroupedBars>
  </div>
</template>

<script>
  import chartService from '../services/chartService';
  import VStackedToGroupedBars from './VStackedToGroupedBars';

  export default {
    name: "VHandleStackGroupBars",
    data: function(){
      return {
        months: 7,
        monthsInformation: [],
        monthsNumber: [],
        loaded: false,
        intelMonthData: []
      }
    },
    components: {
      VStackedToGroupedBars
    },
    props: [
      "stackedBarData"
    ],
    mounted() {
      chartService.getStackedGroupedInformation((res)=>{
        for(let i = this.months - 1; i >= 0; i--){
          let date = new Date();
          date.setMonth(date.getMonth() - i);
          this.monthsNumber.push(date.getMonth());
          const dateMonthString =  `${date.getMonth()}/${date.getFullYear()}`;
          this.monthsInformation.push(res[dateMonthString]);
        }

        console.log(this.monthsInformation);
        console.log(this.monthsNumber);
        this.loaded = true;
      });
    }
  }
</script>

<style scoped>

</style>