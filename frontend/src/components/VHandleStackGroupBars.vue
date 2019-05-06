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
        const transactionsRewards = res;
        let transactionByMonth = {};

        let intelContractDeposit = 0;
        transactionsRewards.forEach(transaction => {
          const date = new Date(transaction.dateCreated);
          const dateMonthString =  `${date.getMonth()}/${date.getFullYear()}`;

          if(!transactionByMonth[dateMonthString]){
            transactionByMonth[dateMonthString] = {
              reward: 0,
              create: 0,
              deposited: 0
            };
            transactionByMonth[dateMonthString][transaction.event] = transaction.amount;
          }else{
            transactionByMonth[dateMonthString][transaction.event] += transaction.amount;
          }

          if(transaction.event === 'create' || transaction.event === 'reward'){
            intelContractDeposit -= transaction.amount;
          }else if(transaction.event === 'deposited'){
            intelContractDeposit += transaction.amount
          }
          if(intelContractDeposit < 0) intelContractDeposit = 0;

          transactionByMonth[dateMonthString].intelContractDeposit = intelContractDeposit;
        });

        console.log(transactionByMonth);
      });
    }
  }
</script>

<style scoped>

</style>