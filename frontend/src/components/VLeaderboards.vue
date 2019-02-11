<template>
    <div class="pareto-bg-dark main leaderView">
        <notifications group="auth" position="bottom right"/>
        <div class="container">
            <div class="row">
                <div class="col-md-6 font-body"
                     style="padding-top: 30px; padding-bottom: 30px; display: flex; align-items: center;">
                    <div>
                        <div class="row" style="color: #ffffff; justify-content: center;">
                            <!-- <p class="font-body text-left" style="padding: 35px; font-size: 12px; font-weight: bold">
                                Check
                                your <b>PARETO</b> scores
                                easily by signing your wallet address using Metamask or a web3-enabled browser.
                                Otherwise, sign manually.</p>
                            <br/>
                            <br/>
                            <br/> -->
                            <!-- hidden by default unless metamask connect -->
                            <form id="lookup" style="margin: 5px;">
                                <div class="group">
                                    <div class="d-flex flex-column justify-content-center">

                                        <label class="font-weight-bold m-0 text-left" for="lookup-input">Search
                                            by Rank/Score/Address</label>

                                        <input id="lookup-input" type="text" name="address"
                                               v-on:keydown.enter.prevent="changeRoute(searchValue)"
                                               v-bind:placeholder="address || null"
                                               onfocus="this.placeholder = ''"
                                               v-model="searchValue"
                                               class="font-weight-bold">
                                    </div>
                                    <span class="highlight"></span>
                                    <span class="bar"></span>
                                </div>
                            </form>
                            <!-- <button v-on:click="showModal()" id="lookupSignButton"  type="button" class="mt-5"
                                    data-loading-text="<i class='fa fa-circle-o-notch fa-spin'></i> Calculating"
                                    form="lookup"
                            >Sign
                            </button> -->
                            <button type="button" id="lookupSignButton" class="mt-5" @click="changeRoute(searchValue)">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>

                        <div class="row"
                             style="word-wrap:break-word; overflow-wrap: break-word; justify-content: center;">
                            <!-- <div id="rank-logo-holder" class="mr-2"><img id="rank-logo"
                                                                         src="../assets/images/pareto-logo-mark-color.svg"
                                                                         alt="Pareto Logo">
                            </div> -->
                            <div id="score-counter" class="d-flex">
                                <div class="row" v-bind:style="{ fontSize: changeFontSize(score) + 'px'  }">
                                    <div class="col-md-1 col-xs-1 text-left"><i class="fa fa-star"
                                                                                style="color: #fca130;"></i></div>
                                    <div class="col-md col-xs">
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
                                        <i class="fa fa-globe"></i>
                                    </th>
                                    <th width="123px" class="th-header">
                                        <i class="fa fa-star" style="color: #fca130;"></i>
                                    </th>
                                    <th class="th-header address-header" width="250px">
                                        Address
                                    </th>
                                    <th style="text-align: right;"><i class="fa fa-external-link-square-alt"></i></th>
                                </tr>
                                </thead>
                            </table>
                            <div id="leaderboard-table"
                                 style="position: relative; overflow: auto; height: 70vh; width: 100%;"
                                 v-on:scroll="onScroll">
                                <VShimmerLeaderboard v-if="!leader.length"></VShimmerLeaderboard>
                                <table v-else class="table table-responsive-lg position-relative">
                                    <div>
                                        <tbody id="table-leaderboard">
                                        <tr
                                                v-for="rank in leader"
                                                :key="rank.address"
                                                v-bind:class="{ 'table-row-highlight': tableRowHighlight(rank)}"
                                                v-bind:id="rank.rank"
                                        >
                                            <td style="width: 55px; text-align: left;">
                                                {{rank.rank}}
                                            </td>
                                            <td style="width: 123px;">
                                                <ICountUp
                                                        :startVal="countUp.startVal"
                                                        :endVal="parseFloat(rank.score)"
                                                        :decimals="decimalsLength(rank.score)"
                                                        :duration="randomNumber(3,6)"
                                                        :options="countUp.options"
                                                        @ready="onReady"></ICountUp>
                                                <i v-bind:class="changeHistoricalSymbol(rank.lscore)"></i>
                                            </td>
                                            <td class="break-line" style="width: 400px; text-align: left;">
                                                {{rank.address}}
                                            </td>
                                            <td><a v-bind:href="etherscan+'/address/'+rank.address" target="_blank"><i
                                                    class="fa fa-external-link-alt"></i></a></td>
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
    import Profile from '../services/profileService';
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
                routeParams: {
                    valids: ['address', 'rank', 'score', 'q'],
                    param: '',
                    value: ''
                },
                leader: [],
                rank: 0,
                lastRank: 100,
                lastScore: 0,
                score: 0,
                etherscan: window.localStorage.getItem('etherscan'),
                address: '',
                textSize: 100,
                page: 0,
                busy: false,
                loading: true,
                updated: 0,
                table: '',
                row: '',
                searchValue: '',
                socketActivity: true,
                scroll: {
                    distance: 0,
                    active: false
                },
                socketParams: {
                    rank: '',
                    limit: '',
                    page: ''
                }
            };
        },
        watch: {
            'score': function (newScore, oldScore) {
                this.lastScore = oldScore;
            },
            $route(to, from) {
                this.leaderFromUrlParams(to);
                this.init();
            },
            'scroll.distance': function (value) {
                let top = this.row.offsetTop + this.row.offsetHeight;
                let bottom = this.row.offsetTop - this.table.offsetHeight;

                let inRange = (value < top && value > bottom);

                if (!inRange && this.scroll.active === false) {

                    let button = $('#button-scroll-up');

                    if (value < top) {
                        button.removeClass("fa-arrow-up").addClass("fa-arrow-down");
                    } else {
                        button.removeClass("fa-arrow-down").addClass("fa-arrow-up");
                    }

                    button.stop(true, true).fadeIn();
                    this.scroll.active = true;
                } else if (inRange && this.scroll.active === true) {

                    let button = $('#button-scroll-up');
                    button.stop(true, true).fadeOut();
                    this.scroll.active = false;
                } else if (!inRange) {
                    this.scroll.active = true;
                }
            }
        },
        computed: {
            ...mapState(['madeLogin',
                'showModalSign',
                'showModalLoginOptions',
                'showModalLedgerNano',
                'ws'
            ])
        },
        mounted: function () {
            this.leaderFromUrlParams(this.$route);
            this.getAddress();
        },
        updated: function () {
            this.updated++;

            this.$nextTick(function () {
                let table = document.getElementById("leaderboard-table");
                if (table) this.table = table;

                let row = document.getElementsByClassName("table-row-highlight")[0];
                if (row) this.row = row;

                if (this.updated == 2 && this.address) {
                    this.scrollBack();
                }
            });
        },
        methods: {
            getAddress() {
                Profile.updateConfig(res => {
                    this.etherscan = window.localStorage.getItem('etherscan')
                });
                return DashboardService.getAddress(data => {
                    this.init(data);
                    this.randomFlash();
                }, () => {
                    this.loading = false;
                    this.infiniteScrollFunction();
                    this.randomFlash();
                });
            }, getLeaderboard: function (withParam) {//withParam means a manual search
                this.$store.state.makingRequest = true;
                this.busy = true;
                let params = {};

                try {
                    if (withParam) {
                        params = {limit: 100, page: 0};
                        params[this.routeParams.param] = this.routeParams.value;
                        this.leader = [];
                        this.updated = 0;
                    } else {
                        if(this.leader[this.leader.length-1]){
                            this.rank = parseInt(this.leader[this.leader.length-1].rank) + 4;
                        }
                        params = {rank: this.rank, limit: 100, page: 0};
                    }

                    this.socketParams = params;
                }catch (e) {
                    console.log(e);
                }

                LeaderboardService.getLeaderboard(params, res => {
                    try
                    {
                        this.$store.state.makingRequest = false;
                        this.leader = [...this.leader, ...res];
                        this.busy = false;

                        //If we search a score, and there isn't one, we look for the nearest score
                        //It will always be the third position inside response, except if the score is inside the first 3 positions
                        if(withParam && this.routeParams.param === 'score'){
                            if(this.leader[3].rank <= 4){
                                let absDiff = 0;
                                let found = 0;

                                this.leader.forEach( rank => {
                                    let rankDiff = rank.score;

                                    if(Math.abs(rankDiff-this.routeParams.value) < Math.abs(absDiff-this.routeParams.value)){
                                        found = rank.score;
                                    }
                                    absDiff = rankDiff;
                                });

                                this.routeParams.value = this.score = found
                            }else{
                                this.routeParams.value = this.score = this.leader[3].score;
                            }
                        }

                        if (withParam) {
                            setTimeout(() => {
                                this.scrollBack();
                            }, 100);
                        }

                        //This means the search param didn't get any results, so we look for the default leaderboard
                        if (this.leader.length < 1 && withParam) {
                            this.busy = true;
                            this.rank = 1;
                            this.page = 0;
                            this.getLeaderboard();
                            this.$notify({
                                group: 'notification',
                                type: 'error',
                                duration: 10000,
                                title: 'Leaderboard',
                                text: "The parameter doesn't exist"
                            });
                            return;
                        }

                        if (this.leader.length < 1) return;
                        //this means the server brings only so few results that the list isn't scrollable, so we look for any other results above
                        if (this.leader[0].rank > 1 && this.leader.length < 30) {
                            this.getLeaderboardTop(this.leader[0].rank - 100, true);
                        }
                    }catch (e) {
                        console.log(e)
                    }
                }, error => {
                    let errorText = error.message ? error.message : error;
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        title: 'Leaderboard',
                        text: errorText
                    });
                });
            },
            //Search leaderboard values above the ones we have
            getLeaderboardTop(rank, withParam) {
                this.$store.state.makingRequest = true;
                this.table.scrollTop += 2;
                this.busy = true;
                let minimunLimit = 100;
                if (this.leader[0].rank < 100) minimunLimit = this.leader[0].rank - 1;

                this.socketParams = {rank: rank, limit: 100, page: 0};

                LeaderboardService.getLeaderboard({rank: rank, limit: minimunLimit, page: 0}, res => {
                    this.$store.state.makingRequest = false;
                    this.busy = false;

                    this.leader = [...res, ...this.leader];

                    if (withParam) {
                        setTimeout(() => {
                            this.scrollBack();
                        }, 100);
                    }
                }, error => {
                    let errorText = error.message ? error.message : error;
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        title: 'Leaderboard',
                        text: errorText
                    });
                });
            },
            //If route has params Ex: leaderbord?rank=123, this method will show the values over the current user rank
            leaderFromUrlParams(route) {
                let routeSplit = route.fullPath.split('?')[1];
                try {
                    if (routeSplit) {
                        let params = routeSplit.split('=');
                        if (this.routeParams.valids.indexOf(params[0]) >= 0) {
                            this.routeParams.param = params[0];
                            this.routeParams.value = params[1].split(/[^a-z0-9,.+]+/gi)[0];

                            if(this.routeParams.param === 'q' && (this.routeParams.value.indexOf(',') >=0 || this.routeParams.value.indexOf('.') >=0))
                                this.routeParams.param = 'score';

                            if(this.routeParams.param === 'score') this.routeParams.value = this.routeParams.value.split(',').join('');
                        } else {
                            this.$notify({
                                group: 'notification',
                                type: 'error',
                                duration: 10000,
                                title: 'Leaderboard',
                                text: 'Url parameter not found'
                            });
                        }
                    }
                }catch (e) {
                    console.log(e)
                }
            },
            authLogin() {
                if (this.madeLogin) {
                    Auth.postSign(() => {
                        this.getAddress()
                    }, error => {
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: errorText
                        });
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
                        let errorText = error.message ? error.message : error;
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Leaderboard',
                            text: errorText
                        });
                        this.stopLogin();
                    });
                }
            },//This method reload the leader according to the address or rank of the button search
            changeRoute: function (value) {
                let paramType = '';
                if (value.split(/[^a-z]+/g).length > 2) {
                    paramType = 'address';
                } else if(value.indexOf(".") >= 0 || value.indexOf(',')>=0){
                    paramType = 'score';
                } else {
                    paramType = 'rank';
                }

                this.page = 0;
                this.leader = [];
                this.lastRank = 100;


                this.leaderFromUrlParams({fullPath: `?${paramType}=${value}`});
                this.init();
            },
            changeFontSize: function (score) {
                let lastScoreLength = 0;

                let textLength = score.toString().length;
                if (score < 1){
                    this.textSize = 100 - (score.length - 4) * 4;
                    lastScoreLength = 100 - (this.lastScore.toString().length - 4) * 4;
                }
                else{
                    this.textSize = 100 - textLength * 4;
                    lastScoreLength = 100 - this.lastScore.toString().length * 4;
                }

                return Math.min(lastScoreLength, this.textSize);
            },
            changeHistoricalSymbol: function (symbol) {
                if (symbol === '-') return 'fa fa-chevron-down historical-down';
            },
            infiniteScrollFunction: function () {
                if (!this.loading) this.getLeaderboard();
            },
            onScroll: function () {

                let bottomReached = false;

                if (this.table) {
                    this.scroll.distance = this.table.scrollTop;
                    bottomReached = (this.scroll.distance + this.table.offsetHeight + 10 >= this.table.scrollHeight);
                }

                if (this.leader.length < 1) return;

                if (this.table.scrollTop === 0 && this.leader[0].rank > 1 && !this.busy) {
                    this.getLeaderboardTop(this.leader[0].rank - 100, false);
                }

                if (bottomReached && !this.busy) {
                    this.infiniteScrollFunction();
                }
            },
            scrollBack: function () {
                if (this.row && this.table) {
                    this.table.scrollTop = this.row.offsetTop;
                    //this.row.scrollIntoView();
                    this.scroll.distance = this.table.scrollTop;
                }
            },
            showModal() {
                this.$store.state.showModalLoginOptions = true;
            },
            tableRowHighlight(rank) {
                let param = this.routeParams.param;
                let value = this.routeParams.value;

                if (param === 'q') {
                    if (value.split(/[^a-z]+/g).length > 2) {
                        param = 'address';
                    } else if (value.indexOf(".") >= 0 || value.indexOf(",") >= 0) {
                        param = 'score';
                    } else {
                        param = 'rank';
                    }
                }

                let found = param ? (rank[param] == this.routeParams.value) : (rank.address === this.address || (rank.rank == 1 && !this.address));

                if(param === 'score'){
                    const parsedScore = Math.floor(rank[param]);
                    const parsedRankScore = Math.floor(this.routeParams.value.split(',').join(''));

                    found = parsedScore === parsedRankScore;
                }

                if (found) {
                    this.rank = rank.rank;
                    this.address = rank.address;
                    this.score = rank.score;
                }
                return found;
            },
            overrideOnMessage() {
                let wsa = this.ws;
                this.ws.onmessage = (data) => {
                    wsa.send(JSON.stringify({rank: this.leader[0].rank, limit: this.leader.length, page: 0}));
                    try {
                        const info = JSON.parse(data.data);

                        if (info.data.address) {
                            this.score = info.data.score;
                        } else {
                            if (!info.data.action) {
                                this.socketActivity = true;
                                let socketIndex = 0;
                                let socketRanking = info.data;
                                let firstRank = socketRanking[socketIndex].rank;

                                this.leader = this.leader.map(item => {

                                    let rank = parseFloat(item.rank);
                                    let socketRank;
                                    if (socketIndex < 100) socketRank = parseFloat(socketRanking[socketIndex].rank);

                                    if (rank === socketRank && item.score !== socketRanking[socketIndex].score){

                                        let bigNumber = item.score > 100 && socketRanking[socketIndex].score > 100;
                                        let change = Math.abs(item.score-socketRanking[socketIndex].score);

                                        if(item.score != socketRanking[socketIndex].score ){
                                            if(bigNumber){
                                                if(change > 10){
                                                    this.rowFlashLight(rank, 'high-flash');
                                                }else if (change > 0.1){
                                                    this.rowFlashLight(rank, 'light-flash');
                                                }
                                            }else{
                                                this.rowFlashLight(rank, 'light-flash');
                                            }
                                        }

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
            },
            randomFlash(){
                setTimeout(()=>{
                    if(this.socketActivity === true){
                        this.socketActivity = false;
                    }else{
                        if (this.row && this.table) {
                            let graphicPosition = (this.table.scrollTop + this.table.offsetHeight ) / this.table.scrollHeight;
                            let leaderPosition = Math.floor(graphicPosition*this.leader.length);

                            let cap = 50;
                            for(let index = leaderPosition-50; index < leaderPosition + 50; index++){
                                if(this.leader[index]){
                                    let luckyNumber = this.randomNumber(0, 100);

                                    if(luckyNumber < cap){
                                        this.rowFlashLight(index, 'light-flash');
                                        cap /= 2;
                                    }else{
                                        cap = 50;
                                    }
                                }
                            }
                        }
                    }
                    this.randomFlash();
                }, this.randomNumber(8000, 20000));
            },
            rowFlashLight (rank, animationType) {
                $('#' + rank).bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){
                    $(this).removeClass(animationType);
                }).addClass(animationType);
            },
            socketConnection() {
                let params = {rank: this.rank, limit: 100, page: this.page};
                if (!this.ws) {
                    this.iniWs();
                    let wss = this.ws;
                    this.ws.onopen = function open() {
                        wss.send(JSON.stringify(params));
                    };
                }
                this.overrideOnMessage();
            },
            init: function (profile) {
                this.loading = false;

                if (this.routeParams.param) {
                    this[this.routeParams.param] = this.routeParams.value;
                    this.busy = true;
                    this.getLeaderboard(true);
                } else {
                    this.rank = profile.rank <= 0 ? 0.0 : profile.rank;
                    this.address = profile.address;
                    this.score = profile.score;
                    this.infiniteScrollFunction();
                }

                this.socketConnection();
                // profile.score = Number(profile.score);
                // this.score = Number(profile.score.toFixed(5));
                this.changeFontSize(this.score);
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

    .historical-up {
        color: green;
    }

    .historical-down {
        color: red;
    }

    .table-fixed tbody {
        height: 70vh;
        overflow-y: auto;
        width: 100%;
        position: relative;
    }

    .table-row-highlight {
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

    #button-scroll-up {
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

    @keyframes high-flash {
        0% {
            background: #6aba82;
        }
        100% {
            background: none;
        }
    }

    .high-flash {
        animation:  high-flash 2s;
    }

    @keyframes light-flash {
        0% {
            background: #9ff677;
        }
        100% {
            background: none;
        }
    }

    .light-flash {
        animation:  high-flash 1s;
    }
</style>