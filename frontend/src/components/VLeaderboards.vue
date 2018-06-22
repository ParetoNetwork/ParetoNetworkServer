<template>
    <div class="pareto-bg-dark main leaderView">
        <div class="container">
            <div class="row">
                <div class="col-md-6 font-body"
                     style="padding-top: 30px; padding-bottom: 30px; display: flex; align-items: center;">
                    <div>
                        <div class="row" style="color: #ffffff; justify-content: center;">

                            <p class="font-body text-left" style="padding: 35px; font-size: 12px; font-weight: bold">
                                Check
                                your<b>PARETO</b> scores
                                easily by signing your wallet address using Metamask or a web3-enabled browser.
                                Otherwise, sign manually.</p>
                            <br/>
                            <br/>
                            <br/>
                            <!-- hidden by default unless metamask connect -->
                            <form id="lookup" style="margin: 5px;">
                                <div class="group">
                                    <div class="d-flex flex-column justify-content-center">

                                        <label class="pareto-label font-weight-bold m-0 text-left" for="lookup-input">Wallet
                                            Address</label>

                                        <input id="lookup-input" type="text" name="address" readonly="readonly"
                                               v-bind:value="address || null" class="font-weight-bold">
                                    </div>
                                    <span class="highlight"></span>
                                    <span class="bar"></span>
                                </div>
                            </form>
                            <button v-on:click="authLogin()" id="lookupSignButton" type="button" class="mt-5"
                                    data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Calculating"
                                    form="lookup"
                            >Sign
                            </button>
                        </div>

                        <div class="row"
                             style="word-wrap:break-word; overflow-wrap: break-word; justify-content: center;">
                            <div id="rank-logo-holder"><img id="rank-logo"
                                                            src="../assets/images/pareto-logo-mark-color.svg"
                                                            alt="Pareto Logo for Ranking">
                            </div>
                            <div>&nbsp;</div>
                            <div id="score-counter">{{rank}}</div>
                        </div>
                        <div id="address-metrics" class="row"
                             style="word-wrap:break-word; overflow-wrap: break-word; justify-content: center; opacity: 0">
                            <div id="rank-text">You rank:&nbsp;</div>
                            <div id="rank-counter" style="font-weight: bold;">0
                            </div>
                            <div id="rank-text-cont">&nbsp;out of&nbsp;</div>
                            <div id="rank-total">0</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
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
                                    <th class="address-header" width="250px">
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
                                        <td class="break-line">{{rank.address}}</td>
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
    import DashboardService from '../services/dashboardService';
    import Auth from '../services/authService';
    import {mapMutations} from 'vuex';

    export default {
        name: 'VLeaderboards',
        data: function () {
            return {leader: [], rank: 0, address: ''};
        },
        computed: {},
        mounted: function () {
            LeaderboardService.getLeaderboard({rank: 1, limit: 100, page: 0}, res => {
                this.leader = res;
            }, error => {
                alert(error);
            });
            this.getAddress();
        },
        methods: {
            getAddress() {
                return DashboardService.getAddress(data => {
                    this.rank = data.rank <= 0 ? 0.0 : data.rank;
                    this.address = data.address;
                }, () => {

                });
            }, authLogin() {
                this.loadingLogin();
                Auth.signSplash(data => {
                    this.rank = data.rank <= 0 ? 0.0 : data.rank;
                    this.address = data;
                    this.$store.dispatch({
                        type: 'login',
                        address: data
                    });
                    Auth.postSign(() => {
                    });
                }, error => {
                    alert(error);
                    this.stopLogin();
                });
            }, ...mapMutations(
                ['login', 'loadingLogin', 'stopLogin']
            )
        }
    };
</script>

<style scoped lang="scss">


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

    .button-signin {
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

    #rank-logo {
        width: 100px;

        @media (max-width: 767px) {
            width: 40px;

        }

    }

    #lookup-input {
        padding: 10px 10px 10px 5px;
        display: block;
        width: 350px;
        border: none;
        background-color: #040f1e;
        border-bottom: 1px solid #757575;
        color: white;
    }

    #lookupSignButton {
        margin: 5px;
        width: 50px;
        height: 25px;

        -webkit-appearance: button;

        border-radius: 5px;
        border: 2px solid #fff;
        background: #fff;
        display: inline-block;
        line-height: 20px;
        text-transform: uppercase;
        color: blue;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
        -webkit-transition: all .2s;
        -o-transition: all .2s;
        transition: all .2s;
        overflow: visible;
    }

    #score-counter {
        font-size: 100px;
        overflow-wrap: break-word;
    }

    #rank-logo-holder {
        padding-top: 30px;
    }

    .break-line {
        word-break: break-all;
    }

    .address-header {
        @media (max-width: 500px) {
            width: 150px;
        }
    }

</style>
