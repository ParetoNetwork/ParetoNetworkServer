<template>
  <div>
    <div class="main wrapp pareto-blue-dark">
      <div class="container px-lg-5">
        <h1> Purchase </h1>
      </div>
    </div>
  </div>
</template>

<script>
  import PurchaseService from '../services/purchaseService';

  export default {
    name: "VPurchase",
    data(){
      return {

      }
    },
    mounted() {
      PurchaseService.generateAddress();
    }
  }
</script>

<style scoped>

</style>