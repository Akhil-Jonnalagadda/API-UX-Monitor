import { useEffect, useRef } from "react";
import * as d3 from "d3";

function LatencyChart({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse dates
    const parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
    const chartData = data
      .filter((d) => d.latencyMs !== null)
      .map((d) => ({
        timestamp: parseTime(d.timestamp) || new Date(d.timestamp),
        latency: d.latencyMs,
      }));

    if (chartData.length === 0) return;

    // Scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(chartData, (d) => d.timestamp))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.latency) * 1.1])
      .range([height, 0]);

    // Line generator
    const line = d3
      .line()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.latency))
      .curve(d3.curveMonotoneX);

    // Add X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Add Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Latency (ms)");

    // Add line
    svg
      .append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#0066cc")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add dots
    svg
      .selectAll("dot")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.timestamp))
      .attr("cy", (d) => y(d.latency))
      .attr("r", 3)
      .attr("fill", "#0066cc")
      .attr("opacity", 0.6)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 5).attr("opacity", 1);

        // Tooltip
        const tooltip = svg
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${x(d.timestamp)},${y(d.latency) - 10})`,
          );

        tooltip
          .append("rect")
          .attr("x", -40)
          .attr("y", -25)
          .attr("width", 80)
          .attr("height", 20)
          .attr("fill", "#333")
          .attr("rx", 4);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .text(`${d.latency}ms`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 3).attr("opacity", 0.6);
        svg.selectAll(".tooltip").remove();
      });
  }, [data]);

  return (
    <div className="chart-container">
      <h5>Latency Over Time</h5>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default LatencyChart;
