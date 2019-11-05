<template>
  <div>
    <VChartStackedToGroupedBars v-if="loaded" :stackedBarData="stackedBarData" :monthsInformation="monthsInformation" :monthsNumber="monthsNumber"></VChartStackedToGroupedBars>
  </div>
</template>

<script>
  import chartService from '../services/chartService';
  import VChartStackedToGroupedBars from './VChartStackedToGroupedBars';

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
      VChartStackedToGroupedBars: VChartStackedToGroupedBars
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

        this.loaded = true;
      });
    }
  }
</script>

<style scoped>

</style>