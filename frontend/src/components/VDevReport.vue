<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container position-relative px-lg-5 pb-100">
            <div class="row ">
                <div class="col-md-12">
                    <h1>Pareto Network reports</h1>

                </div>
            </div>
            <div class="row justify-content-center">
                <div class="col-md-6 pt-20">
                    <nav>
                        <div class="nav nav-tabs nav-fill" id="nav-tab" role="tablist">
                            <a class="nav-item nav-link active" id="nav-home-tab" data-toggle="tab" href="#nav-home" role="tab"  @click="change_tab(1)">Last Week</a>
                            <a class="nav-item nav-link" id="nav-profile-tab" data-toggle="tab" href="#nav-profile" role="tab"  @click="change_tab(2)">Last Month</a>
                        </div>
                    </nav>
                </div>
            </div>
            <div class="row" v-if="current_tab === 1">

                <div class="col-md-12 text-left">
                    <div class="intel-container pt-20 px-lg-5">
                        <ul>

                            <li><h3>Telegram Chat:  210</h3> </li>
                            <li><h3>Telegram Total:  24</h3> </li>
                            <li><h3>Telegram announcements:  114</h3> </li>
                            <li><h3>Number of contributors:  7</h3> </li>
                            <li><h3>Pull request:  24</h3> </li>

                        </ul>
                    </div>
                </div>
            </div>
            <div class="row" v-if="current_tab === 1">

                <div class="col-md-12 pt-10">


                    <div class="intel-container pt-20">
                        <h2>Commits</h2>

                        <ul>
                            <div class="small">
                                <bar-chart :chart-data="datacollection_commits_week" :options="options"></bar-chart>
                            </div>
                            <li><h3>Commits in total:  {{commits_week_count}}</h3> </li>


                        </ul>
                    </div>
                </div>
            </div>
            <div class="row" v-if="current_tab === 1">
                <div class="col-md-12 pt-10">

                    <div class="intel-container pt-20">
                        <h2>Transactions</h2>
                        <ul>
                            <div class="small">
                                <bar-chart :chart-data="datacollection_transactions_week" :options="options"></bar-chart>
                            </div>
                            <li><h3>Trasaccions:  {{transactions_week_count}}</h3></li>

                        </ul>

                    </div>
                </div>
            </div>


            <div class="row" v-if="current_tab === 2">

                <div class="col-md-12 text-left ">
                    <div class="intel-container pt-20 px-lg-5">
                        <ul>

                            <li><h3>Telegram Chat:  210</h3> </li>
                            <li><h3>Telegram Total:  24</h3> </li>
                            <li><h3>Telegram announcements:  114</h3> </li>
                            <li><h3>Number of contributors:  7</h3> </li>
                            <li><h3>Pull request:  44</h3> </li>

                        </ul>
                    </div>
                </div>
            </div>

            <div class="row mt-10" v-if="current_tab === 2">

                <div class="col-md-12 pt-10">


                    <div class="intel-container pt-20">
                        <h2>Commits</h2>
                        <div class="small">
                            <bar-chart :chart-data="datacollection_commits_month" :options="options"></bar-chart>
                        </div>
                        <ul>
                            <li><h3>Commits in total:  {{commits_month_count}} </h3></li>

                        </ul>
                    </div>
                </div>
            </div>
            <div class="row" v-if="current_tab === 2">
                <div class="col-md-12 pt-10">

                    <div class="intel-container pt-20">
                        <h2>Transactions</h2>
                        <ul>
                            <div class="small">
                                <bar-chart :chart-data="datacollection_transactions_month" :options="options"></bar-chart>
                            </div>
                            <li><h3>Trasaccions:  {{transactions_month_count}}</h3></li>

                        </ul>

                    </div>
                </div>
            </div>



        </div>
    </div>
</template>

<script>

    import ReportService from '../services/ReportService'
    import barChart from '../utils/charts/barChart'
    import moment from "moment";



    export default {
        name: 'VDevReport',
        created: function () {

            ReportService.report(
                res => {
                    console.log(res.data);
                    this.commits_week =  res.data.commits_week;
                    this.transactions_week =  res.data.transactions_week;
                    this.commits_week_count =  res.data.commits_week_count;
                    this.transactions_week_count =  res.data.transactions_week_count;
                    this.commits_month =  res.data.commits_month;
                    this.transactions_month =  res.data.transactions_month;
                    this.commits_month_count =  res.data.commits_month_count;
                    this.transactions_month_count =  res.data.transactions_month_count;
                    this.fillData();
                },
                error => {
                    console.log(error);
                }
            )


        },
        components: {
            barChart
        },
        data: function () {
            return {
                current_tab: 1,

                commits_week : [],
                transactions_week : [],
                commits_month : [],
                transactions_month : [],
                commits_week_count : 0,
                transactions_week_count : 0,
                commits_month_count : 0,
                transactions_month_count : 0,
                datacollection_commits_week: null,
                datacollection_commits_month: null,
                datacollection_transactions_week: null,
                datacollection_transactions_month: null,
                options: {
                    legend: {
                        display: false
                    },
                    scales: {
                        yAxes: [{
                            stacked: true,
                            ticks: {
                                stepSize: 1,
                                beginAtZero: true,
                                min: 0,
                            },
                        }],
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            };
        },
        computed: {

        },
        methods: {

            change_tab(tab){

                this.current_tab = tab
            },
            fillData () {

                let commits_week = this.commits_week;
                let transactions_week = this.transactions_week;
                let commits_month = this.commits_month;
                let transactions_month = this.transactions_month;

                let days_commits_week = [];
                let counts_commits_week = [];
                let days_commits_month = [];
                let counts_commits_month = [];

                let days_transactions_week = [];
                let counts_transactions_week = [];
                let days_transactions_month = [];
                let counts_transactions_month = [];


                for (var i = 0 ;  i < commits_week.length; i++) {
                    counts_commits_week.push(commits_week[i].count);
                    days_commits_week.push( moment(commits_week[i]._id.month + '/'+  commits_week[i]._id.day + '/' + commits_week[i]._id.year).format("DD MMM") );
                }
                for (var i = 0 ;  i < commits_month.length; i++) {
                    counts_commits_month.push(commits_month[i].count);
                    days_commits_month.push( moment(commits_month[i]._id.month + '/'+  commits_month[i]._id.day + '/' + commits_month[i]._id.year).format("DD MMM") );
                }
                for (var i = 0 ;  i < transactions_week.length; i++) {
                    counts_transactions_week.push(transactions_week[i].count);
                    days_transactions_week.push( moment(transactions_week[i]._id.month + '/'+  transactions_week[i]._id.day + '/' + transactions_week[i]._id.year).format("DD MMM") );
                }
                for (var i = 0 ;  i < transactions_month.length; i++) {
                    counts_transactions_month.push(transactions_month[i].count);
                    days_transactions_month.push( moment(transactions_month[i]._id.month + '/'+  transactions_month[i]._id.day + '/' + transactions_month[i]._id.year).format("DD MMM") );
                }



                this.datacollection_commits_week = {
                    labels: days_commits_week,
                    datasets: [
                        {
                            label:  'Commits',
                            backgroundColor: '#4df835',
                            data: counts_commits_week
                        }
                    ]
                }

                this.datacollection_commits_month = {
                    labels: days_commits_month,
                    datasets: [
                        {
                            label:  'Commits',
                            backgroundColor: '#4df835',
                            data: counts_commits_month
                        }
                    ]
                }
                this.datacollection_transactions_week = {
                    labels: days_transactions_week,
                    datasets: [
                        {
                            label:  'Transactions',
                            backgroundColor: '#185787',
                            data: counts_transactions_week
                        }
                    ]
                }
                this.datacollection_transactions_month = {
                    labels: days_transactions_month,
                    datasets: [
                        {
                            label:  'Transactions',
                            backgroundColor: '#185787',
                            data: counts_transactions_month
                        }
                    ]
                }
            },

        }
    };
</script>

<style scoped lang="scss">
    .intel-container{
        padding-bottom: 20px;
    }
    .pt-10{
        padding-top: 10px;
    }
    .pt-20{
        padding-top: 20px;
    }
    .pb-100{
        padding-bottom: 100px;
    }
    ul{
        list-style: none;
    }
    .small {
        max-width: 600px;
        margin:  50px auto;
    }

    h2{

        font-size: 20px;
    }
    h3 {

        font-size: 16px;
    }
</style>
