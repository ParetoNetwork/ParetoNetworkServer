<template>
    <div class="pareto-bg-dark main leaderView">
        <div class="container">
            <div class="row">
                <div class="col-6 d-flex align-items-center">
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
                            <button class="button-signin">SIGN</button>
                        </div>


                    </div>


                </div>
                <div class="col-6">
                    <h4>Leaderboard</h4>
                    <div class="" style="font-size: 12px">
                        <div class="table-area">
                            <table class="table text-left">
                                <thead>
                                <tr>
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
    .button-signin{
        margin: 5px;
        width: 50px;
        height: 25px;
        font-size: 10px;
        color: blue;
        border-radius: 4px;
        cursor: pointer;
        background-color: white;
        text-align: center;
        vertical-align: middle;
    }

</style>