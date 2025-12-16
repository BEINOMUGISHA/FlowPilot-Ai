import React, { useEffect, useRef, useState } from 'react';
import { select, pie, arc, interpolate, scaleBand, axisBottom, scaleLinear, max, axisLeft } from 'd3';
import { Task } from '../types';

interface ChartProps {
  tasks: Task[];
}

export const PriorityChart: React.FC<ChartProps> = React.memo(({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    try {
      setError(null);
      // Data Prep (Pending tasks only usually makes sense for workload)
      const counts = {
        high: tasks.filter(t => t.priority === 'high' && t.status === 'pending').length,
        medium: tasks.filter(t => t.priority === 'medium' && t.status === 'pending').length,
        low: tasks.filter(t => t.priority === 'low' && t.status === 'pending').length,
      };
      const total = counts.high + counts.medium + counts.low;
      
      const data = [
        { label: 'High', value: counts.high, color: '#f43f5e' }, // rose-500
        { label: 'Medium', value: counts.medium, color: '#f59e0b' }, // amber-500
        { label: 'Low', value: counts.low, color: '#6366f1' }, // indigo-500
      ].filter(d => d.value > 0);

      // Dimensions
      const width = 300;
      const height = 300;
      const radius = Math.min(width, height) / 2;
      const innerRadius = radius * 0.65;

      // Clear
      const svg = select(svgRef.current);
      svg.selectAll("*").remove();
      
      svg.attr("viewBox", `0 0 ${width} ${height}`)
         .attr("class", "w-full h-full max-h-[250px]");
         
      const g = svg.append("g")
         .attr("transform", `translate(${width / 2},${height / 2})`);

      // Pie Layout
      const pieGenerator = pie<any>().value(d => d.value).sort(null);
      const arcGenerator = arc<any>().innerRadius(innerRadius).outerRadius(radius);
      const hoverArcGenerator = arc<any>().innerRadius(innerRadius).outerRadius(radius + 5);

      // Draw
      if (total === 0) {
         g.append("circle")
          .attr("r", radius)
          .attr("fill", "transparent")
          .attr("stroke", "#e2e8f0")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4 4");

         g.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("class", "fill-slate-400 dark:fill-slate-500 font-medium")
          .text("No pending tasks");
         return;
      }

      const arcs = g.selectAll("arc")
        .data(pieGenerator(data))
        .enter()
        .append("g")
        .attr("class", "arc cursor-pointer");

      arcs.append("path")
        .attr("d", arcGenerator)
        .attr("fill", d => d.data.color)
        .attr("stroke", "white") // or bg color
        .style("stroke-width", "2px")
        .on("mouseover", function(event, d) {
          select(this).transition().duration(200).attr("d", hoverArcGenerator);
        })
        .on("mouseout", function(event, d) {
          select(this).transition().duration(200).attr("d", arcGenerator);
        })
        .transition().duration(750).attrTween("d", function(d) {
            const i = interpolate(d.startAngle+0.1, d.endAngle);
            return function(t) {
                d.endAngle = i(t);
                return arcGenerator(d) || "";
            }
        });

      // Center Text
      g.append("text")
       .attr("text-anchor", "middle")
       .attr("dy", "-0.8em")
       .attr("class", "fill-slate-500 dark:fill-slate-400 font-medium text-xs uppercase tracking-wider")
       .text("Pending");
       
      g.append("text")
       .attr("text-anchor", "middle")
       .attr("dy", "0.6em")
       .attr("class", "fill-slate-800 dark:fill-slate-200 font-bold text-4xl")
       .text(total);
    } catch (err) {
      console.error("PriorityChart Error:", err);
      setError("Chart Error");
    }

  }, [tasks]);

  if (error) return <div className="text-xs text-slate-400 text-center py-10">Unable to load chart</div>;

  return <svg ref={svgRef} />;
});

export const CategoryChart: React.FC<ChartProps> = React.memo(({ tasks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
     if (!svgRef.current) return;
     
     try {
       setError(null);
       const counts: Record<string, number> = {};
       tasks.forEach(t => {
           const cat = t.category || 'Other';
           counts[cat] = (counts[cat] || 0) + 1;
       });
       
       let data = Object.entries(counts)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6); // Top 6

       if (data.length === 0) data = [{label: 'None', value: 0}];

       const margin = { top: 20, right: 20, bottom: 40, left: 40 };
       const width = 400 - margin.left - margin.right;
       const height = 250 - margin.top - margin.bottom;

       const svg = select(svgRef.current);
       svg.selectAll("*").remove();

       svg.attr("viewBox", `0 0 400 250`)
          .attr("class", "w-full h-full max-h-[250px]");
          
       const g = svg.append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

       // X Axis
       const x = scaleBand()
          .range([0, width])
          .domain(data.map(d => d.label))
          .padding(0.3);
          
       g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(axisBottom(x).tickSize(0))
        .selectAll("text")
          .style("text-anchor", "middle")
          .attr("dy", "1.5em")
          .attr("class", "fill-slate-500 dark:fill-slate-400 font-medium text-[10px] sm:text-xs");

       g.select(".domain").attr("class", "stroke-slate-200 dark:stroke-slate-700");

       // Y Axis
       const y = scaleLinear()
          .domain([0, max(data, d => d.value) || 1])
          .range([height, 0]);
          
       const yAxis = g.append("g")
        .call(axisLeft(y).ticks(5).tickSize(-width))
        
       yAxis.selectAll("text").attr("class", "fill-slate-400 text-xs");
       yAxis.select(".domain").remove();
       yAxis.selectAll(".tick line")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-dasharray", "2,2")
            .attr("class", "dark:stroke-slate-700");

       // Bars
       g.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
          .attr("x", d => x(d.label) || 0)
          .attr("y", height) // start at bottom
          .attr("width", x.bandwidth())
          .attr("height", 0) // start with 0 height
          .attr("fill", "url(#barGradient)")
          .attr("rx", 6)
          .transition()
          .duration(800)
          .attr("y", d => y(d.value))
          .attr("height", d => height - y(d.value));

       // Gradient Definition
       const defs = svg.append("defs");
       const gradient = defs.append("linearGradient")
          .attr("id", "barGradient")
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "0%")
          .attr("y2", "100%");
       gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1"); // indigo-500
       gradient.append("stop").attr("offset", "100%").attr("stop-color", "#818cf8"); // indigo-400
     } catch (err) {
       console.error("CategoryChart Error:", err);
       setError("Chart Error");
     }

  }, [tasks]);
  
  if (error) return <div className="text-xs text-slate-400 text-center py-10">Unable to load chart</div>;

  return <svg ref={svgRef} />;
});