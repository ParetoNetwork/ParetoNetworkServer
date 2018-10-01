<template>
    <div class="main wrapp font-body-regular">
        <notifications group="auth" position="bottom right"/>
        <div class="container pt-5">
            <div class="mt-2">
                <div class="row">
                    <div class="col-12 col-lg-4 mb-4">
                        <div class="text-left">
                            <div class="border p-4">
                                <h1 class="font-body font-weight-bold"> Pareto Calculator </h1>
                                <div class="mt-3">
                                    <p class="text-left"> How to use </p>
                                    <ul>
                                        <li>Lorem</li>
                                        <li>Ipsum</li>
                                        <li>Castus</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-lg-7 offset-lg-1">
                        <div class="text-left">
                            <div class="border p-4">
                                <form>
                                    <div class="form-group font-body">
                                        <h2 class="font-weight-bold">Your Block: {{address.block}}</h2>
                                        <h2 class="font-weight-bold">Your Score: {{address.score}}</h2>
                                    </div>
                                    <div class="form-group row mt-4">
                                        <label class="col-sm-2 col-form-label">Add Score</label>
                                        <div class="col-sm-6">
                                            <input type="text" class="form-control">
                                        </div>
                                    </div>
                                    <div class="form-group row">
                                        <label class="col-sm-2 col-form-label">Add Block</label>
                                        <div class="col-sm-6">
                                            <input type="text" class="form-control">
                                        </div>
                                    </div>
                                    <div class="form-group row mt-4">
                                        <div class="col-sm-6 offset-3 offset-md-2">
                                            <button class="btn btn-success"> Calculate </button>
                                            <div class="mt-3">
                                                <label class="pareto-label font-weight-bold m-0 text-left"> Result: {{newPareto}} </label>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import dashboardService from "../services/dashboardService";

    export default {
        name: 'VScoreCalculator',
        components: {},
        data : function () {
            return {
                address : {},
                newPareto : 0.0
            };
        },
        mounted: function () {
            this.loadAddress();

        },
        methods: {
            loadAddress: function () {
                dashboardService.getAddress(res => {
                    this.address = res;
                   // console.log(this.address)
                }, () => {
                    this.$notify({
                        group: 'error',
                        type: 'error',
                        duration: 10000,
                        text: error });
                });
            }
        }
    }
</script>
<style>
    .wrapp {
        color: black;
        font-size: 14px;
    }
</style>