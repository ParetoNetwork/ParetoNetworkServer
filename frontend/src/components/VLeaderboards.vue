<template>
    <div class="pareto-bg-dark main leaderView">
        <notifications group="auth" position="bottom right"/>
        <div class="container">
            <div class="row">
                <div class="col-md-6 font-body"
                     style="padding-top: 30px; padding-bottom: 30px; display: flex; align-items: center;">
                    <div>
                        <div class="row" style="color: #ffffff; justify-content: center;">
                            <p class="font-body text-left" style="padding: 35px; font-size: 12px; font-weight: bold">
                                Check
                                your <b>PARETO</b> scores
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
                            <button v-on:click="showModal()" id="lookupSignButton" type="button" class="mt-5"
                                    data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Calculating"
                                    form="lookup"
                            >Sign
                            </button>
                        </div>

                        <div class="row"
                             style="word-wrap:break-word; overflow-wrap: break-word; justify-content: center;">
                            <div id="rank-logo-holder" class="mr-2"><img id="rank-logo"
                                                                         src="../assets/images/pareto-logo-mark-color.svg"
                                                                         alt="Pareto Logo for Ranking">
                            </div>
                            <div id="score-counter" class="d-flex">
                                <div class="iCountUp d-flex align-items-center" v-bind:style="{ fontSize: textSize + 'px'  }">
                                    <ICountUp
                                            v-if="score"
                                            :startVal="countUp.startVal"
                                            :endVal="parseFloat(score)"
                                            :decimals="decimalsLength(score + '')"
                                            :duration="randomNumber(3,6)"
                                            :options="countUp.options"
                                            @ready="onReady"
                                    />
                                    <span v-else>
                                        0
                                    </span>
                                </div>
                            </div>
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
                    <h4 class="font-body font-weight-bold mb-3">Leaderboard</h4>
                    <div class="" style="font-size: 12px">
                        <div class="table-area">

                            <table class="table text-left position-relative">
                                <!-- <button class="btn btn-success mt-1" id="button-scroll-up" @click="scrollBack()"> <i class="fa"></i> Scroll Back </button> -->
                                <thead>
                                <tr>
                                    <th width="55px" class="th-header">
                                        Rank
                                    </th>
                                    <th width="123px" class="th-header">
                                        Score
                                    </th>
                                    <th class="th-header address-header" width="250px">
                                        Address
                                    </th>
                                    <th style="text-align: right;"><i class="fa fa-external-link-square"></i></th>
                                </tr>
                                </thead>
                            </table>
                            <div id="leaderboard-table" style="position: relative; overflow: auto; height: 70vh; width: 100%;" v-on:scroll="onScroll">
                                <VShimmerLeaderboard v-if="!leader.length"></VShimmerLeaderboard>
                                <table v-else class="table table-responsive-lg position-relative">
                                    <div>
                                        <tbody id="table-leaderboard">
                                        <tr
                                                v-for="rank in leader"
                                                :key="rank.address"
                                                v-bind:class="{ 'table-row-highlight': (rank.address === address || (rank.rank == 1 && !address))}"
                                                v-bind:id="rank.rank"
                                        >
                                            <td style="width: 55px; text-align: left;">{{rank.rank}}</td>
                                            <!--<td>{{rank.score}}</td>-->
                                            <td style="width: 123px; text=align: left;">
                                                <ICountUp
                                                        :startVal="countUp.startVal"
                                                        :endVal="parseFloat(rank.score)"
                                                        :decimals="decimalsLength(rank.score)"
                                                        :duration="randomNumber(3,6)"
                                                        :options="countUp.options"
                                                        @ready="onReady"></ICountUp>
                                            </td>
                                            <td class="break-line" style="width: 400px; text-align: left;">{{rank.address}}</td>
                                            <td><a v-bind:href="'https://etherscan.io/address/'+rank.address" target="_blank"><i class="fa fa-external-link"></i></a></td>
                                        </tr>
                                        </tbody>
                                    </div>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <ModalSignIn v-if="showModalSign"></ModalSignIn>
        <LoginOptions :redirectRoute="'/leaderboards'" v-if="showModalLoginOptions"></LoginOptions>
        <ModalLedgerNano v-if="showModalLedgerNano"></ModalLedgerNano>
    </div>
</template>

<script>
    import LeaderboardService from '../services/leaderboardService';
    import DashboardService from '../services/dashboardService';
    import Auth from '../services/authService';
    import {mapMutations, mapState} from 'vuex';
    import ModalSignIn from './VModalManualSigIn';

    import ICountUp from 'vue-countup-v2';
    import infiniteScroll from 'vue-infinite-scroll';
    import LoginOptions from "./Modals/VLoginOptions";
    import ModalLedgerNano from "./Modals/VModalLedgerNano";
    import VShimmerLeaderboard from "./Shimmer/LeaderboardView/VShimmerLeaderboard";

    import {countUpMixin} from '../mixins/countUp';

    export default {
        name: 'VLeaderboards',
        mixins: [countUpMixin],
        components: {
            ModalLedgerNano,
            LoginOptions,
            ModalSignIn,
            VShimmerLeaderboard,
            ICountUp
        },
        directives: {
            infiniteScroll,
            scroll: {
                inserted: function (el, binding) {
                    let f = function (evt) {
                        if (binding.value(evt, el)) {
                            window.removeEventListener('scroll', f)
                        }
                    };
                    window.addEventListener('scroll', f)
                }
            }
        },
        data: function () {
            return {
                leader: [],
                rank: 0,
                lastRank : 100,
                score: 0,
                address: '',
                textSize : 100,
                page: 0,
                busy: false,
                loading : true,
                updated: 0,
                table : '',
                row : '',
                scroll : {
                    distance: 0,
                    active: false
                },
                socketParams : {
                    rank: '',
                    limit: '',
                    page: ''
                }
            };
        },
        watch: {
            'scroll.distance' : function (value) {

                let top = this.row.offsetTop + this.row.offsetHeight;
                let bottom = this.row.offsetTop - this.table.offsetHeight;

                let inRange = (value < top && value > bottom);

                if ( !inRange && this.scroll.active === false) {

                    let button = $('#button-scroll-up');

                    if (value < top){
                        button.removeClass( "fa-arrow-up" ).addClass( "fa-arrow-down" );
                    }else{
                        button.removeClass( "fa-arrow-down" ).addClass( "fa-arrow-up" );
                    }

                    button.stop(true, true).fadeIn();
                    this.scroll.active = true;
                } else if( inRange && this.scroll.active === true){

                    let button = $('#button-scroll-up');
                    button.stop(true, true).fadeOut();
                    this.scroll.active = false;
                } else if ( !inRange ) {
                    this.scroll.active = true;
                }
            }
        },
        computed: {...mapState(['madeLogin',
                'showModalSign',
                'showModalLoginOptions',
                'showModalLedgerNano',
                'ws'
            ])
        },
        mounted: function () {
            this.getAddress();
        },
        updated: function() {
            this.updated++;
            this.$nextTick(function () {
                let table = document.getElementById("leaderboard-table");
                if(table) this.table = table

                let row = document.getElementsByClassName("table-row-highlight")[0];
                if(row) this.row = row;

                if(this.updated == 2 && this.address){
                    this.scrollBack();
                }
            })
        },
        methods: {
            getAddress() {
                return DashboardService.getAddress(data => {
                    this.init(data);
                }, () => {
                    this.loading = false;
                    this.infiniteScrollFunction();
                });
            }, getLeaderboard: function () {
                this.$store.state.makingRequest = true;

                this.socketParams = { rank: this.rank, limit: 100, page: this.page};
                LeaderboardService.getLeaderboard({rank: this.rank, limit: 100, page: this.page}, res => {
                    this.$store.state.makingRequest = false;
                    this.leader = [...this.leader,... res];
                    this.busy = false;
                    this.page += 100;
                }, error => {
                    let errorText= error.message? error.message : error;
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        title: 'Leaderboard',
                        text: errorText });
                });
            }, authLogin() {
                if (this.madeLogin) {
                    Auth.postSign(() => {
                        this.getAddress()
                    }, error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: errorText });
                    });
                } else {
                    this.loadingLogin();
                    Auth.signSplash(data => {
                        this.leader = [];
                        this.page = 0;
                        DashboardService.getAddress(res => {
                            this.init(res);
                            this.$store.dispatch({
                                type: 'login',
                                address: {address: res, dataSign: {signType: 'Metamask', pathId: ''}},
                            });
                        }, () => {
                            this.loading = false;
                            this.infiniteScrollFunction();
                        });


                    }, error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Leaderboard',
                            text: errorText });
                        this.stopLogin();
                    });
                }
            },
            changeFontSize : function ( score ) {

                let textLength = score.toString().length;
                if (score < 1)
                    this.textSize = 100 - (score.length - 4)*4;
                else
                    this.textSize = 100 - textLength*4;
            },
            infiniteScrollFunction: function(){
                this.busy = true;
                if(!this.loading) this.getLeaderboard();
            },
            onScroll: function(){

                let bottomReached = false;

                if(this.table){
                    this.scroll.distance = this.table.scrollTop;
                    bottomReached = (this.scroll.distance + this.table.offsetHeight >= this.table.scrollHeight);
                }
                if(this.table.scrollTop === 0 && this.leader[0].rank > 1 && !this.busy){

                    this.$store.state.makingRequest = true;
                    this.table.scrollTop += 2;
                    this.busy = true;
                    let minimunLimit = 100;
                    if(this.leader[0].rank < 100) minimunLimit = this.leader[0].rank-1;

                    this.socketParams = { rank: this.rank-this.lastRank, limit: 100, page: 0};

                    LeaderboardService.getLeaderboard({rank: this.rank-this.lastRank, limit: minimunLimit, page: 0}, res => {
                        this.$store.state.makingRequest = false;
                        this.lastRank += 100;
                        this.busy = false;
                        this.leader = [... res,...this.leader];
                    }, error => {
                        let errorText= error.message? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Leaderboard',
                            text: errorText });
                    });
                }

                if(bottomReached && !this.busy){
                    this.infiniteScrollFunction();
                }
            },
            scrollBack: function () {
                if(this.row){
                    this.row.scrollIntoView();
                    this.scroll.distance = this.table.scrollTop;
                }
            },
            showModal () {
                this.$store.state.showModalLoginOptions = true;
            },
            overrideOnMessage(){
                let wsa = this.ws;
                this.ws.onmessage = (data) => {
                    wsa.send(JSON.stringify(this.socketParams));
                    try {
                        const info = JSON.parse(data.data);
                        // console.log(info);
                        if (info.data.address) {
                            this.score = info.data.score;
                        } else {
                            if (!info.data.action){
                                let socketIndex = 0;
                                let socketRanking = info.data;
                                let firstRank = socketRanking[socketIndex].rank;

                                this.leader = this.leader.map(item => {

                                    let rank = parseFloat(item.rank);
                                    let socketRank;
                                    if (socketIndex < 100) socketRank = parseFloat(socketRanking[socketIndex].rank);

                                    if (rank >= firstRank && rank < (firstRank + 99) && rank === socketRank) {
                                        item.score = socketRanking[socketIndex].score;
                                        socketIndex++;
                                    }
                                    return item;
                                });
                            }
                        }

                    } catch (e) {
                        console.log(e);
                    }
                };
            } ,
            socketConnection () {
                let params = {rank: this.rank, limit: 100, page: this.page};
                if (!this.ws) {
                    Auth.getSocketToken(res => {

                        this.iniWs();
                        let wss = this.ws;
                        this.ws.onopen = function open() {
                            wss.send(JSON.stringify(params));
                        };
                        this.overrideOnMessage();
                    });
                }else{
                    this.overrideOnMessage();
                }
            },
            init : function(profile){
                this.rank = profile.rank <= 0 ? 0.0 : profile.rank;
                this.address = profile.address;
                this.score = profile.score;
                this.loading = false;

                this.socketConnection();
                // profile.score = Number(profile.score);
                // this.score = Number(profile.score.toFixed(5));
                this.changeFontSize(this.score);
                this.infiniteScrollFunction();
            },
            ...mapMutations(
                ['login', 'loadingLogin', 'stopLogin', 'iniWs']
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

    .table-row-highlight{
        background-color: #5a6268;
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

    #button-scroll-up{
        position: absolute;
        right: 70px;
        top: 0px;
        display: none;
        font-size: 13px;
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

    .th-header {
        text-align: center;
    }

</style>