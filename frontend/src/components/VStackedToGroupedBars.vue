<template>
  <div class="row align-items-xl-end height-dynamic">
    <div class="col text-left">
      <div class="row mx-0">
        <b class="title-content text-left"> Network </b>
      </div>
      <div id="d3-stacked-grouped-bars" class="cursor-pointer position-relative" @dblclick="createTransition"
           @mouseover="pauseTransition"
           @mouseleave="resumeTransition">
        <svg></svg>
      </div>
    </div>
  </div>
</template>

<script>
  import profileService from '../services/profileService';
  import IntelService from '../services/IntelService';
  import {mapState} from 'vuex';
  import * as d3 from "d3";

  export default {
    name: 'VStackedToGroupedBars',
    props: [
      "stackedBarData", "monthsNumber", "monthsInformation"
    ],
    computed: {
      ...mapState(['address', 'signType'])
    },
    data() {
      return {
        height: 180,
        width: 500,
        pickedChart: 'stacked',
        rect: [],
        y01z: [],
        y1Max: 0,
        yMax: 0,
        x: function () {
        },
        y: function () {
        },
        n: 4,
        m: 7,
        intervalFunction: {},
        chartTransitionPaused: false,
        intervalTransitionTime: 8000,
        margin: {top: 30, right: 0, bottom: 20, left: 40},
        networkInformation: {},
        dates: [],
        weekDays: [],
        responsifyWidth: 0,
        responsifyHeight: 0,
        currentBalance: 0,
        chartInfoData: {}
      };
    },
    mounted() {
      this.setTimeTransition();
      this.drawChart(this.monthsInformation);
    },
    methods: {
      resumeTransition() {
        if (this.chartTransitionPaused) {
          this.chartTransitionPaused = false;
          this.setTimeTransition();
        }
      },
      pauseTransition() {
        if (!this.chartTransitionPaused) {
          this.chartTransitionPaused = true;
          clearInterval(this.intervalFunction);
        }
      },
      createTransition() {
        if (this.pickedChart === "stacked") {
          this.transitionGrouped();
          this.pickedChart = "grouped";
        } else {
          this.transitionStacked();
          this.pickedChart = "stacked";
        }
      },
      drawChart(data) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        this.weekDays = this.monthsNumber.map((month) => months[month]);

        let datesArray = [];
        for (let i = 0; i < this.n; i++) {
          datesArray[i] = [];
          for (let j = 0; j < this.m; j++) {
            datesArray[i][j] = 0;
          }
        }

        for (let i = 0; i < this.m; i++) {
          datesArray[0][i] = data[i].reward || 0;
          datesArray[1][i] = data[i].create;
          datesArray[2][i] = data[i].deposited;
          datesArray[3][i] = data[i].intelContractDeposit < 0? 0 : data[i].intelContractDeposit;
        }

        this.stackedToGroupedChart(datesArray, this.pickedChart);
      },
      responsivefy(svg) {
        let container = d3.select(svg.node().parentNode),
          width = Math.min(parseInt(svg.style("width")), this.width),
          height = Math.min(parseInt(svg.style("height")), this.height),
          aspect = width / height;

        svg.attr("viewBox", "0 0 " + width + " " + height)
          .attr("perserveAspectRatio", "xMinYMid")
          .call(resize);

        d3.select(window).on("resize." + container.attr("id"), resize);

        function resize() {
          let targetWidth = parseInt(container.style("width"));
          svg.attr("width", targetWidth);
          svg.attr("height", Math.round(targetWidth / aspect));
        }
      },
      stackedToGroupedChart(data, chartType) {
        let LABELS = ["Rewards", "Intel", "Staked", "Total"];
        const height = this.height;
        const width = this.width;

        let yz = data;
        let xz = d3.range(this.m);

        this.y01z = d3.stack()
          .keys(d3.range(this.n))
          (d3.transpose(yz))
          .map((data, i) => data.map(([y0, y1], j) => [y0, y1, i, j]));

        this.y1Max = d3.max(this.y01z, y => d3.max(y, d => d[1]));

        this.x = d3.scaleBand()
          .domain(xz)
          .rangeRound([this.margin.left, width - this.margin.right])
          .padding(0.08);

        let scaleY = [];
        for (let i = 0; i < 5; i++) {
          scaleY.push(this.y1Max * i / 5);
        }

        this.y = d3.scaleLinear()
          .domain([0, this.y1Max])
          .range([height - this.margin.bottom, this.margin.top]);

        const z = d3.scaleSequential(d3.interpolateBlues)
          .domain([-0.5 * this.n, 1.5 * this.n]);

        this.yMax = d3.max(yz, y => d3.max(y));

        const xAxis = svg => svg.append("g")
          .attr("transform", `translate(0,${height - this.margin.bottom})`)
          .call(d3.axisBottom(this.x).tickSizeOuter(0).tickFormat((i) => this.weekDays[i]));

        const yAxis = svg => svg.append("g")
          .attr("transform", `translate(${this.margin.left},0)`)
          .call(d3.axisLeft(this.y).ticks(8, "s"));

        const svg = d3.select("#d3-stacked-grouped-bars svg")
          .attr("width", width)
          .attr("height", height)
          .call(this.responsivefy);

        let divTooltip = d3.select("#d3-stacked-grouped-bars").append("div").attr("class", "toolTip");

        this.rect = svg.selectAll("g")
          .data(this.y01z)
          .enter().append("g")
          .attr("fill", (d, i) => z(i))
          .selectAll("rect")
          .data(d => d)
          .join("rect")
          .attr("x", (d, i) => {
            return this.x(i) - this.margin.left;
          })
          .attr("y", height - this.margin.bottom - this.margin.top)
          .attr("width", this.x.bandwidth())
          .attr("height", 0);

        this.rect.on("mouseover", function (d) {
          let type = '';
          switch (d[2]) {
            case 0 :
              type = 'Rewards';
              break;
            case 1:
              type = 'Intel';
              break;
            case 2 :
              type = 'Staked';
              break;
            case 3:
              type = 'Total';
              break;
          }

          let coords = {
            x: this.getAttribute("x"),
            y: this.getAttribute("y"),
          };

          const newSvg = $("#d3-stacked-grouped-bars svg")[0];
          let svgDim = {
            width: parseInt(newSvg.attributes.width.value),
            height: parseInt(newSvg.attributes.height.value),
          };

          divTooltip.style("left", (coords.x * svgDim.width / width - 30) + "px")
            .style("top", (coords.y * svgDim.height / height - 30) + "px")
            .style("display", "inline-block")
            .html(type +  ": " + (
              data[d[2]][d[3]])
              //+ "<br> Total Balance: " + data[3][d[3]]
            )
            .style("opacity", .9);
        }).on("mouseout", function () {
          divTooltip.style("opacity", 0);
        });

        svg.append("g")
          .call(xAxis);

        svg.append("g")
          .call(yAxis);

        let drawLegend = (data) => {
          let legend = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("transform", (d, i) => {
              return `translate(${i * -70},0)`;
            });

          legend.append("circle")
            .attr("r",  5)
            .attr("cx", width - 15)
            .attr("cy", 10)
            .attr("fill", (d, i) => z(i));

          legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .attr("fill", "white")
            .text(d => {
              return d;
            });
        };

        drawLegend(LABELS);

        if (chartType === "stacked" || !chartType) {
          this.transitionStacked();
        } else if (chartType === "grouped") {
          this.transitionGrouped();
        }

        setTimeout(this.createTransition, 2000);
      },
      bumps(m) {
        const values = [];

        // Initialize with uniform random values in [0.1, 0.2).
        for (let i = 0; i < m; ++i) {
          values[i] = 0.1 + 0.1 * Math.random();
        }

        // Add five random bumps.
        for (let j = 0; j < 5; ++j) {
          const x = 1 / (0.1 + Math.random());
          const y = 2 * Math.random() - 0.5;
          const z = 10 / (0.1 + Math.random());
          for (let i = 0; i < m; i++) {
            const w = (i / m - y) * z;
            values[i] += x * Math.exp(-w * w);
          }
        }

        // Ensure all values are positive.
        for (let i = 0; i < m; ++i) {
          values[i] = Math.max(0, values[i]);
        }

        return values;
      },
      transitionStacked() {
        this.y.domain([0, this.y1Max]);

        this.rect.transition()
          .duration(500)
          .delay((d, i) => {
            return i * 20
          })
          .attr("y", d => this.y(d[1]))
          .attr("height", d => this.y(d[0]) - this.y(d[1]))
          .transition()
          .attr("x", (d, i) => this.x(i))
          .attr("width", this.x.bandwidth());
      },
      transitionGrouped() {
        this.y.domain([0, this.yMax]);

        this.rect.transition()
          .duration(500)
          .delay((d, i) => {
            return i * 20
          })
          .attr("x", (d, i) => this.x(i) + this.x.bandwidth() / this.n * d[2])
          .attr("width", this.x.bandwidth() / this.n)
          .transition()
          .attr("y", d => this.y(d[1] - d[0]))
          .attr("height", d => this.y(0) - this.y(d[1] - d[0]));
      },
      setTimeTransition() {
        this.intervalFunction = setInterval(this.createTransition, this.intervalTransitionTime);
      }
    },
    watch: {
      'monthsInformation': function (newData) {
        this.drawChart(this.monthsInformation);
      }
    }
  }
</script>

<style>
  .toolTip {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    position: absolute;
    display: none;
    width: auto;
    height: auto;
    background: none repeat scroll 0 0 white;
    border: 0 none;
    border-radius: 8px 8px 8px 8px;
    box-shadow: -3px 3px 15px #888888;
    color: black;
    font: 12px sans-serif;
    padding: 5px;
    text-align: center;
  }

  /* the delta in height is 4vh for every 1000px, can this be put into a Sass formula? */
  @media (min-height: 800px){
    .height-dynamic {
      height: 28vh;
    }
  }
  @media (min-height: 900px){
    .height-dynamic {
      height: 34vh;
    }
  }
  @media (min-height: 1000px){
    .height-dynamic {
      height: 38vh;
    }
  }
  @media (min-height: 1100px){
    .height-dynamic {
      height: 42vh;
    }
  }
  @media (min-height: 1200px){
    .height-dynamic {
      height: 46vh;
    }
  }
  @media (min-height: 1300px){
    .height-dynamic {
      height: 48vh;
    }
  }
</style>