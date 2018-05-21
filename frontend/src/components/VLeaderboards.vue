<template>
    <div class="pareto-bg-dark leaderView">
        <div class="container">
            <div class="row">
                <div class="col-6">
                    <div class="">
                        <span>
                                                Check your PARETO scores easily by signing your wallet address using Metamask or a
                    web3-enabled browser. Otherwise, sign manually.
                        </span>
                        <div class="d-flex">
                            <div class="">
                                <label for="wallet">
                                    Wallet Address
                                </label>
                                <input id="wallet" type="text">
                            </div>
                            <button class="btn btn-primary">SIGN</button>
                        </div>


                    </div>


                </div>
                <div class="col-6">
                    <h4>Leaderboard</h4>
                    <div class="" style="font-size: 12px">
                        <div class="table-area">
                            <table class="table text-left">
                                <thead>
                                <tr >
                                    <th width="55px">
                                        Rank
                                    </th>
                                    <th width="123px">
                                        Score
                                    </th>
                                    <th width="332px">
                                        Address
                                    </th>
                                </tr>
                                </thead>
                            </table>
                            <div class="" style="position: relative; overflow: auto; height: 70vh; width: 100%;">
                                <table class="table table-responsive-lg">
                                    <tbody>
                                    <tr v-for="rank in leader" :key="rank.address">
                                        <td>{{rank.rank}}</td>
                                        <td>{{rank.score}}</td>
                                        <td>{{rank.address}}</td>
                                    </tr>
                                    </tbody>
                                </table>

                            </div>
                        </div>
                    </div>

                    <!--<div class="table-responsive">-->

                    <!--<table class="table">-->
                    <!--<thead>-->
                    <!--<tr>-->
                    <!--<th>-->
                    <!--Rank-->
                    <!--</th>-->
                    <!--<th>-->
                    <!--Score-->
                    <!--</th>-->
                    <!--<th>-->
                    <!--Address-->
                    <!--</th>-->
                    <!--</tr>-->
                    <!--</thead>-->
                    <!--<tbody class="">-->
                    <!--<tr v-for="rank in leader" :key="rank.address">-->
                    <!--<td>{{rank.rank}}</td>-->
                    <!--<td>{{rank.score}}</td>-->
                    <!--<td>{{rank.address}}</td>-->
                    <!--</tr>-->
                    <!--</tbody>-->
                    <!--</table>-->
                    <!--</div>-->
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import LeaderboardService from '../services/leaderboardService';

    export default {
        name: 'VLeaderboards',
        data: function () {
            return {leader: []};
        },
        mounted: function () {
            return LeaderboardService.getLeaderboard({rank: 1, limit: 100, page: 0}, res => {
                this.leader = res;
            }, error => {
                alert(error);
            });
        }
    };
</script>

<style scoped>
    .leaderView {
        min-height: 100vh;
    }

    .table-fixed thead {
        width: 97%;
    }

    .table-fixed tbody {
        height: 70vh;
        overflow-y: auto;
        width: 100%;
        position: relative;
    }

    .table-fixed thead, .table-fixed tbody, .table-fixed tr, .table-fixed td, .table-fixed th {
    }

    .table-fixed tbody td, .table-fixed thead > tr > th {
    }
</style>