<template>
  <div id="d3-svg">
    <svg></svg>
  </div>
</template>

<script>

  export default {
    name: 'VChartSunburst',
    props: [
      "nodeData"
    ],
    data() {
      return {
        height: 450,
        width: 450,
        row: document.getElementById("chart-row").offsetWidth
      };
    },
    mounted() {
      this.height = this.width = this.row;
      this.sunschart(this.$router, this.$notify);
    },
    methods: {
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
          svg.attr("width", targetWidth);
          svg.attr("height", Math.round(targetWidth / aspect));
        }
      },
      sunschart(router, notify) {
        const nodeData = this.nodeData;

        var width = this.width,
          height = this.height,
          radius = (Math.min(width, height) / 2);

        let color;
        //color = d3.scaleOrdinal(['#5EAFC6', '#FE9922', '#93c464', '#75739F']);
        color = d3.scaleOrdinal(["#a88fca", "#d78dce", "#fd95b5", "#feae95", "#edd38b", "#d0f5a3", "#9df8a8", "#83ebc8", "#83ebc8", "#95aae7"]);

        var x = d3.scaleLinear()
          .range([0, 2 * Math.PI]);

        var y = d3.scaleSqrt()
          .range([0, radius]);

        var partition = d3.partition();

        var root = d3.hierarchy(nodeData)
          .sum(function (d) {
            return d.size
          });

        partition(root);

        root.each(d => d.current = d);
        var format = d3.format(",d");

        var r = 50;
        var prof = 3;

        var arc = d3.arc()
          .startAngle(function (d) {
            return Math.min(2 * Math.PI, x(d.x0));
          })
          .endAngle(function (d) {
            return Math.min(2 * Math.PI, x(d.x1));
          })
          .innerRadius(d => d.y0 * radius)
          .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

        var svg = d3.select("#d3-svg svg")
          .attr("width", width)
          .attr("height", height)
          .style("font", "9px sans-serif")
          .call(this.responsivefy);

        var g = svg.append("g")
          .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

        const path = g.append("g")
          .selectAll("path")
          .data(root.descendants())
          .enter().append('g').attr("class", "node").append('path')
          .attr("d", arc)
          .style('stroke', '#ead6f3')
          .style("fill", function (d) {
            if(!d.parent) return '';
            return color((d.children ? d : d.parent).data.name);
          })
          .attr("fill-opacity", d => d.children ? 0.8 : 1)
          /*.attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)*/
          .style("cursor", function (d) {
            return d.children ? "pointer" : "default"
          })
          .on("click", d => click(d));

        path.append("title")
          .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

        path.filter(d => d.children)
          .style("cursor", "pointer")
          .on("click", d => click(d));

        g.selectAll(".node")
          .append("text")
          .attr("class", "name")
          .style("fill", "#000")
          .attr("transform", d => labelTransform(d))
          .attr("dx", "-20") // radius margin
          .attr("dy", ".35em") // rotation align
          .attr("cursor", function (d) {
            return d.children ? "pointer" : "default"
          })
          .text(function (d) {
            return d.data.name;
          })
          .attr('display', d => textFits(d) ? null : 'none')
          .on("click", d => click(d));

        g.selectAll(".node")
          .append("text")
          .attr("class", "sizeText")
          .style("fill", "#000")
          .attr("transform", d => labelTransform(d))
          .attr("dx", "-20") // radius margin
          .attr("dy", "20") // rotation align
          .attr("cursor", "pointer")
          .text(function (d) {
            if(d.data.reward)
              return 'Reward: ' + d.data.reward;
          })
          .attr('display', d => textFits(d) ? null : 'none');

        function textFits(d) {
          const CHAR_SPACE = 6;

          const deltaAngle = x(d.x1) - x(d.x0);
          const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
          const perimeter = r * deltaAngle;

          return d.data.name.length * CHAR_SPACE < perimeter;
        }

        function click(p) {
          const text = svg.selectAll(".name");
          text.transition().attr("display", 'none');

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
            .filter(function(d) {
              return +this.getAttribute("fill-opacity") || arcVisible(d.target);
            })
            .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attrTween("d", d => () => arc(d.current));

          // svg.selectAll(".sizeText")
          //   .transition().attr("display", 'none');
          //
          // svg.transition()
          //   .duration(750)
          //   .tween("scale", function () {
          //     var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
          //       yd = d3.interpolate(y.domain(), [d.y0, 1]),
          //       yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
          //     return function (t) {
          //       x.domain(xd(t));
          //       y.domain(yd(t)).range(yr(t));
          //     };
          //   })
          //   .selectAll(".node path")
          //   .attrTween("d", function (e) {
          //     setTimeout(() => {
          //       if (e.x0 >= d.x0 && e.x0 < (d.x1)) {
          //         const text = d3.select(this.parentNode).selectAll(".name").attr('display', d => textFits(d) ? null : 'none');
          //         const sizeText = d3.select(this.parentNode).selectAll(".sizeText").attr('display', d => textFits(d) ? null : 'none');
          //         const path = d3.select(this.parentNode).selectAll("path")._groups[0][0];
          //
          //         const sizeTransition = sizeText.transition().duration(750);
          //
          //         //Transition for the size label (rewards)
          //         sizeTransition.attr("transform", labelTransform(path.__data__));
          //         text.transition().duration(750).attr("transform", labelTransform(path.__data__));
          //       }
          //     }, 750);
          //     return function () {
          //       return arc(e);
          //     };
          //   });
        }

        function labelTransform(d) {
          const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
          return `translate(` + arc.centroid(d) + `)`;
        }

        function arcVisible(d) {
          return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }


        function redirect(d){
          if(d.data.type === "profile"){
            let param = d.data.slug || d.data.address;
            if(param){
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
      }
    },
    watch: {
      row(val){
        console.log(val)
      }
    }
  };
</script>

<style>
</style>
