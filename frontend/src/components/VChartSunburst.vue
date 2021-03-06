<template>
  <div class="row">
    <div class="col text-left">
      <b class="title-content text-left d-lg-none d-xl-block"> Explorer </b>
      <div id="d3-sunburst">
        <svg></svg>
      </div>
    </div>
  </div>
</template>
<script>
  import * as d3 from "d3";

  export default {
    name: 'VChartSunburst',
    props: [
      "nodeData", "loggedUser"
    ],
    data() {
      return {
        height: 400,
        width: 400,
        row: document.getElementById("chart-row").offsetWidth,
        root: null
      };
    },
    mounted() {
      this.sunschart(this.$router, this.$notify);

    },
    methods: {
        iniAnimation(){
            if(!this.loggedUser){
                setTimeout( ()=>{
                    try{
                        d3.select('#d3-sunburst svg g path').dispatch('click');
                        setTimeout( ()=>{
                            try{
                                d3.select('#d3-sunburst svg g circle').dispatch('click');
                                if(!this.loggedUser){
                                    this.iniAnimation();
                                }
                            }catch (e) { }
                        },2000)
                    }catch (e) { }
                },10000)
            }

        },
      responsivefy(svg) {
        var container = d3.select(svg.node().parentNode),
          width = parseInt(svg.style("width")),
          height = parseInt(svg.style("height")),
          aspect = width / height;

        svg.attr("viewBox", "0 0 " + width + " " + height)
          .attr("perserveAspectRatio", "xMinYMid")
          .call(resize);

        d3.select(window).on("resize." + container.attr("id"), resize);

        function resize() {
          var targetWidth = parseInt(container.style("width"));
          var roundedHeightAspect = Math.round(targetWidth / aspect);
          svg.attr("width", Math.min(targetWidth, width));
          svg.attr("height", Math.min(roundedHeightAspect, height));
        }

      },
      sunschart(router, notify) {

        const data = this.nodeData;

        var width = this.width,
          height = this.height,
          radius = width / 6;

        let color;

        //color = d3.scaleOrdinal(['#5EAFC6', '#FE9922', '#93c464', '#75739F']);
        color = d3.scaleOrdinal(["#a88fca", "#d78dce", "#fd95b5", "#feae95", "#edd38b", "#d0f5a3", "#9df8a8", "#83ebc8", "#83ebc8", "#95aae7"]);

        var format = d3.format(",d");


        this.root = d3.hierarchy(data)  // <-- 1
          .sum(function (d) {
            return d.size
          });

        var partition = d3.partition()  // <-- 1
          .size([2 * Math.PI, this.root.height + 1]);

        partition(this.root);

        this.root.each(d => d.current = d);
        var format = d3.format(",d");

        var arc = d3.arc()
          .startAngle(d => d.x0)
          .endAngle(d => d.x1)
          .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
          .padRadius(radius * 1.5)
          .innerRadius(d => d.y0 * radius)
          .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        const svg = d3.select("#d3-sunburst svg")
          .attr("width", width)
          .attr("height", height)
          .style("font", "10px sans-serif")
          .style("display", "block")
          .style("margin", "auto")
          .call(this.responsivefy)
          .style("opacity", 0);


        svg.transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .style("opacity", 1);


        const g = svg.append("g")
          .attr("transform", `translate(${width / 2},${width / 2})`);

        const path = g.append("g")
          .selectAll("path")
          .data(this.root.descendants().slice(1))
          .join("path")
          .attr("fill", d => {
            while (d.depth > 1) d = d.parent;
            return color(d.data.address);
          })
          .attr("stroke", d => arcVisible(d.current) ? '#ead6f3' : 'none')
          .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 1 : 0.6) : 0)
          .attr("d", d => arc(d.current));

        path.append("title")
          .text(d => `${d.ancestors().map(d => d.data.name).reverse().join(" ")}`);

        path.filter(d => d.children)
          .style("cursor", "pointer")
          .on("click", d => click(d));

        const label = g.append("g")
          .attr("pointer-events", "none")
          .attr("text-anchor", "middle")
          .style("user-select", "none")
          .selectAll("text")
          .data(this.root.descendants().slice(1))
          .join("text")
          .attr("dy", "0.35em")
          .attr("fill-opacity", d => +labelVisible(d.current))
          .attr("transform", d => labelTransform(d.current))
          .text(d => d.data.name);

        const parent = g.append("circle")
          .datum(this.root)
          .attr("r", radius)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .on("click", click);

        function textFits(d) {
          const CHAR_SPACE = 6;

          const deltaAngle = x(d.x1) - x(d.x0);
          const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
          const perimeter = r * deltaAngle;

          return d.data.name.length * CHAR_SPACE < perimeter;
        }

        const root = this.root;

        function click(p) {
          parent.datum(p.parent || root);

          root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
          });

          const t = g.transition().duration(750);

          // Transition the data on all arcs, even the ones that aren’t visible,
          // so that if this transition is interrupted, entering arcs will start
          // the next transition from the desired position.
          path.transition(t)
            .tween("data", d => {
              const i = d3.interpolate(d.current, d.target);
              return t => d.current = i(t);
            })
            .filter(function (d) {
              return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("stroke", d => arcVisible(d.target) ? '#ead6f3' : 'none')
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 1 : 0.6) : 0)
            .attrTween("d", d => () => arc(d.current));

          label.filter(function (d) {
            return +this.getAttribute("fill-opacity") || labelVisible(d.target);
          }).transition(t)
            //.attr("stroke", d => arcVisible(d.target) ? '#ead6f3' : 'none')
            .attr("fill-opacity", d => +labelVisible(d.target))
            .attrTween("transform", d => () => labelTransform(d.current));
        }

        function arcVisible(d) {
          return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }

        function labelVisible(d) {
          return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        function labelTransform(d) {
          const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
          const y = (d.y0 + d.y1) / 2 * radius;
          return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }

        function redirect(d) {
          if (d.data.type === "profile") {
            let param = d.data.slug || d.data.address;
            if (param) {
              router.push('/intel/' + param);
            } else {
              notify({
                group: 'notification',
                type: 'error',
                duration: 10000,
                title: 'Redirection',
                text: 'Could not redirect to user profile'
              });
            }
          }
        }

      //animate's sunburst chart on initial render, once, everytime.
      d3.select('#d3-sunburst svg g path').dispatch('click');

      setTimeout( ()=>{
        try{
          d3.select('#d3-sunburst svg g circle').dispatch('click');
        }catch (e) { }
      },1000)

      if(!this.loggedUser){

        this.iniAnimation();
       }
      }
    },
    watch: {
      row(val) {
      },
      nodeData() {
          d3.selectAll("#d3-sunburst svg > *")
              .transition()
              .duration(400)
              .ease(d3.easeLinear)
              .style("opacity", 0)
              .on("end",  () => {
                  d3.selectAll("#d3-sunburst svg > *").remove();
                  this.sunschart(this.$router, this.$notify);
              })

      }
    }
  };
</script>

<style>
</style>
