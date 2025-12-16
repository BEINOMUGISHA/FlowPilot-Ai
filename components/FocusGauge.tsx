import React, { useEffect, useRef, useState } from 'react';
import { select, scaleLinear, arc, interpolate } from 'd3';

interface FocusGaugeProps {
  score: number; // 0 to 100
}

export const FocusGauge: React.FC<FocusGaugeProps> = ({ score }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    try {
      setError(null);
      const width = 180;
      const height = 180;
      const radius = Math.min(width, height) / 2;
      const innerRadius = radius - 15;

      const svg = select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous
      
      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

      // Scale for color
      const colorScale = scaleLinear<string>()
        .domain([0, 50, 100])
        .range(["#ef4444", "#f59e0b", "#4f46e5"]);

      // Background Arc Generator
      const bgArcGenerator = arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .startAngle(0)
        .endAngle(2 * Math.PI)
        .cornerRadius(10);

      g.append("path")
        .attr("d", bgArcGenerator({}))
        .style("fill", "#f1f5f9");

      // Foreground Arc Generator
      const fgArcGenerator = arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(radius)
        .startAngle(0)
        .cornerRadius(10);

      const path = g.append("path")
        .datum({ endAngle: 0 })
        .style("fill", colorScale(score))
        .attr("d", fgArcGenerator);

      // Animation
      path.transition()
        .duration(1500)
        .attrTween("d", (d: any) => {
          const i = interpolate(d.endAngle, (score / 100) * 2 * Math.PI);
          return (t: number) => {
            d.endAngle = i(t);
            return fgArcGenerator(d) || "";
          };
        });

      // Center Text (Score)
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.1em")
        .style("font-size", "2.5rem")
        .style("font-weight", "700")
        .style("fill", "#1e293b")
        .text(score);

      // Center Text (Label)
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.8em")
        .style("font-size", "0.8rem")
        .style("font-weight", "500")
        .style("fill", "#64748b")
        .text("Flow Score");
    } catch (err) {
      console.error("FocusGauge Error:", err);
      setError("Unable to render gauge");
    }

  }, [score]);

  if (error) {
    return (
      <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-full mx-auto border border-slate-200 text-xs text-slate-400">
        {error}
      </div>
    );
  }

  return <svg ref={svgRef} className="mx-auto" />;
};