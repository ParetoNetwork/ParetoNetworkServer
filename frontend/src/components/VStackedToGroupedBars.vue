<template>
  <div class="row">
    <div class="col text-left">
      <div class="row mx-0">
        <b class="title-content text-left"> Network Statistics </b>
      </div>
      <div id="d3-stacked-grouped-bars" class="cursor-pointer" @dblclick="createTransition" @mouseover="pauseTransition" @mouseleave="resumeTransition">
        <svg></svg>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'VStackedToGroupedBars',
    props: [
      "nodeData"
    ],
    data() {
      return {
        height: 150,
        width: 500,
        pickedChart: 'stacked',
        rect: [],
        y01z: [],
        y1Max: 0,
        yMax: 0,
        x: function(){},
        y: function(){},
        n: 5,
        m: 58,
        intervalFunction: {},
        chartTransitionPaused: false,
        intervalTransitionTime: 20000,
        margin: {top: 0, right: 0, bottom: 10, left: 0}
      };
    },
    mounted() {
      this.stackedToGroupedChart();
      this.setTimeTransition();
    },
    methods: {
      resumeTransition(){
        if(this.chartTransitionPaused) {
          this.chartTransitionPaused = false;
          this.setTimeTransition();
        }
      },
      pauseTransition(){
        if(!this.chartTransitionPaused) {
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
      responsivefy(svg) {
        var container = d3.select(svg.node().parentNode),
          width = Math.min(parseInt(svg.style("width")), this.width),
          height = Math.min(parseInt(svg.style("height")), this.height),
          aspect = width / height;

        svg.attr("viewBox", "0 0 " + width + " " + height)
          .attr("perserveAspectRatio", "xMinYMid")
          .call(resize);

        d3.select(window).on("resize." + container.attr("id"), resize);

        function resize() {
          var targetWidth = parseInt(container.style("width"));
          svg.attr("width", targetWidth);
          svg.attr("height", Math.round(targetWidth / aspect));
        }
      },
      stackedToGroupedChart(chartType) {
        const height = this.height;
        const width = this.width;


        let yz = d3.range(this.n).map(() => this.bumps(this.m));
        let xz = d3.range(this.m);

        this.y01z = d3.stack()
          .keys(d3.range(this.n))
          (d3.transpose(yz)) // stacked yz
          .map((data, i) => data.map(([y0, y1]) => [y0, y1, i]));

        this.y1Max = d3.max(this.y01z, y => d3.max(y, d => d[1]));

        this.x = d3.scaleBand()
          .domain(xz)
          .rangeRound([this.margin.left, width - this.margin.right])
          .padding(0.08);

        this.y = d3.scaleLinear()
          .domain([0, this.y1Max])
          .range([height - this.margin.bottom, this.margin.top]);

        const z = d3.scaleSequential(d3.interpolateBlues)
          .domain([-0.5 * this.n, 1.5 * this.n]);

        this.yMax = d3.max(yz, y => d3.max(y));

        const xAxis = svg => svg.append("g")
          .attr("transform", `translate(0,${height - this.margin.bottom})`)
          .call(d3.axisBottom(this.x).tickSizeOuter(0).tickFormat(() => ""));

        const svg = d3.select("#d3-stacked-grouped-bars svg")
          .attr("width", width)
          .attr("height", height)
          .call(this.responsivefy);

        this.rect = svg.selectAll("g")
          .data(this.y01z)
          .enter().append("g")
          .attr("fill", (d, i) => z(i))
          .selectAll("rect")
          .data(d => d)
          .join("rect")
          .attr("x", (d, i) => {
            return this.x(i);})
          .attr("y", height - this.margin.bottom)
          .attr("width", this.x.bandwidth())
          .attr("height", 0);

        svg.append("g")
          .call(xAxis);

        if(chartType === "stacked" || !chartType){
          this.transitionStacked();
        }else if(chartType === "grouped"){
          this.transitionGrouped();
        }
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
      transitionStacked(){
        this.y.domain([0, this.y1Max]);

        // console.log(rect);
        this.rect.transition()
          .duration(500)
          .delay((d, i) => i * 20)
          .attr("y", d => this.y(d[1]))
          .attr("height", d => this.y(d[0]) - this.y(d[1]))
          .transition()
          .attr("x", (d, i) => this.x(i))
          .attr("width", this.x.bandwidth());
      },
      transitionGrouped(){
        this.y.domain([0, this.yMax]);

        // console.log(rect);
        this.rect.transition()
          .duration(500)
          .delay((d, i) => i * 20)
          .attr("x", (d, i) => this.x(i) + this.x.bandwidth() / this.n * d[2])
          .attr("width", this.x.bandwidth() / this.n)
          .transition()
          .attr("y", d => this.y(d[1] - d[0]))
          .attr("height", d => this.y(0) - this.y(d[1] - d[0]));
      },
      setTimeTransition() {
        this.intervalFunction = setInterval(this.createTransition, this.intervalTransitionTime);
      }
  }
  }
</script>

<style scoped>

</style>