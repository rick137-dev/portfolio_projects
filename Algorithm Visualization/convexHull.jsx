"use client";

import { useState, useEffect, useRef } from "react";

const BOX = 400;
const RADIUS = 5;
const PURPLE = "#7e22ce";


export default function GrahamScanVisualizer() {
 
  const [points, setPoints] = useState([]);           
  const [placing, setPlacing] = useState(false);     
  const [dragIdx, setDragIdx] = useState(null);       
  const [hull, setHull] = useState([]);               
  const [events, setEvents] = useState([]);          
  const [step, setStep] = useState(null);             
  const [hasVisualized, setHasVisualized] = useState(false);

  const boxRef = useRef(null);

 
  //Helper functions for geometric calculations
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const toLocal = (e) => {
    const rect = boxRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

 
  const grahamEvents = (pts) => {
    if (pts.length < 3) return { hull: [], script: [] };

   
    const sorted = [...pts].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    const pivot = sorted[0];

   
    const rest = sorted.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      if (angleA === angleB) return dist2(pivot, a) - dist2(pivot, b);
      return angleA - angleB;
    });

   
    const stack = [pivot, rest[0]];
    const script = [{ type: "seed", pts: [pivot, rest[0]] }];

    for (let i = 1; i < rest.length; i++) {
      const candidate = rest[i];
      script.push({ type: "inspect", from: stack.at(-1), to: candidate });

      while (stack.length >= 2 && cross(stack.at(-2), stack.at(-1), candidate) <= 0) {
        const popped = stack.pop();
        script.push({ type: "pop", popped });
      }

      script.push({ type: "confirm", from: stack.at(-1), to: candidate });
      stack.push(candidate);
    }

    return { hull: stack, script };
  };


  const handleDown = (e) => {
    const p = toLocal(e);
    const idx = points.findIndex((pt) => dist2(pt, p) <= (RADIUS + 2) ** 2);

    if (idx !== -1) {
      
      setDragIdx(idx);
      return;
    }

    
    if (placing) setPoints((prev) => [...prev, p]);
  };

  const handleMove = (e) => {
    if (dragIdx == null) return;
    const p = toLocal(e);
    setPoints((prev) => {
      const next = [...prev];
      next[dragIdx] = p;
      return next;
    });
  };

  const handleUp = () => setDragIdx(null);


  const startAnimation = () => {
    if (points.length < 3) return;
    const { hull: h, script } = grahamEvents(points);

    setHull(h);
    setEvents(script);
    setStep(script.length ? 0 : null);
    setHasVisualized(false); 
  };

 
  useEffect(() => {
    if (step == null) return;
    if (step >= events.length) {
     
      setStep(null);
      setHasVisualized(true); 
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 350);
    return () => clearTimeout(t);
  }, [step, events]);

  
  useEffect(() => {
    if (hasVisualized && step == null && points.length >= 3) {
      setHull(grahamEvents(points).hull);
    }
  }, [points, hasVisualized, step]);


  const handleClear = () => {
    setPoints([]);
    setHull([]);
    setEvents([]);
    setStep(null);
    setPlacing(false);
    setHasVisualized(false);
  };


  const buildAnimationEdges = () => {
    const els = [];

    let inspectedEvt = null;
    if (step != null && step < events.length) {
      inspectedEvt = events[step]?.type === "inspect" ? events[step] : null;
    }

    if (step != null) {
     
      const stack = [];
      const lastIdx = Math.min(step, events.length - 1);

      for (let i = 0; i <= lastIdx; i++) {
        const ev = events[i];
        if (ev.type === "seed") {
          stack.length = 0;
          stack.push(...ev.pts);
        } else if (ev.type === "pop") {
          stack.pop();
        } else if (ev.type === "confirm") {
          stack.push(ev.to);
        }
      }

      
      for (let i = 0; i < stack.length - 1; i++) {
        const a = stack[i];
        const b = stack[i + 1];
        els.push(
          <line
            key={`stack-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#3b82f6"
            strokeWidth={2}
          />
        );
      }

      
      if (inspectedEvt) {
        els.push(
          <line
            key="inspect"
            x1={inspectedEvt.from.x}
            y1={inspectedEvt.from.y}
            x2={inspectedEvt.to.x}
            y2={inspectedEvt.to.y}
            stroke="#f43f5e"
            strokeWidth={2}
          />
        );
      }
    }

    return els;
  };

  
  const buildHullEdges = () => {
    const els = [];
    if (hasVisualized && step == null && hull.length) {
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i];
        const b = hull[(i + 1) % hull.length];
        els.push(
          <line
            key={`hull-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#3b82f6"
            strokeWidth={2}
          />
        );
      }
    }
    return els;
  };

  const edgeElements = [...buildAnimationEdges(), ...buildHullEdges()];

  
  return (
    <div className="flex items-start gap-8 mt-8 select-none">
     
      <svg
        ref={boxRef}
        width={BOX}
        height={BOX}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        className="border-4 rounded-lg bg-white"
        style={{ borderColor: PURPLE }}
      >
        
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={RADIUS} fill="black" />
        ))}

       
        {edgeElements}
      </svg>

   
      <div className="max-w-sm bg-white text-purple-900 text-sm p-4 rounded-lg border border-gray-300 shadow-md font-sans space-y-3">
        <h3 className="font-semibold">
    Graham Scan 
  </h3>
  
  <p>
    The Graham Scan is an algorithm developed to find the Convex Hull of a finite set of points in 2D Euclidean space, the main geometric ideas behind it only work in 2D.
  </p>

  
  <p>The main steps of the algorithm are:</p>

 
  <ol className="list-decimal list-inside space-y-1">
    <li>Select a pivot point, typically the farthest point in a corner direction, in this case it’s the highest point, ties broken by x-coordinate, so top left-most point</li>
    <li>Sort the remaining points by polar angle with respect to the pivot.</li>
    <li>Sweep through the sorted points with a monotonic stack, whenever the next point makes a right turn (clockwise) with the top two stack points, pop the top of the stack.</li>
    <li>After you have swept through the entire list, the points remaining in the stack are the vertices of the convex hull.</li>
  </ol>

 
  <p>
    This algorithm runs in O(n log n) time due to the initial sort, after that the sweep is linear.
  </p>
  <p>
    The space complexity is O(n) due to the use of the monotonic stack.
  </p>
</div>




      
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            setPlacing((p) => !p);
            if (!placing) {
              
              setHull([]);
              setEvents([]);
              setStep(null);
              setHasVisualized(false);
            }
          }}
          className={`px-4 py-2 font-semibold rounded border transition ${
            placing
              ? "bg-white text-purple-900 border-purple-900"
              : "text-white border-white hover:bg-white hover:text-purple-900"
          }`}
        >
          {placing ? "Stop Placing" : "Place Points"}
        </button>

        <button
          onClick={startAnimation}
          disabled={points.length < 3}
          className={`px-4 py-2 font-semibold rounded border transition ${
            points.length < 3
              ? "border-gray-400 text-gray-400"
              : "text-white border-white hover:bg-white hover:text-purple-900"
          }`}
        >
          Visualize
        </button>

        <button
          onClick={handleClear}
          className="px-4 py-2 font-semibold rounded border text-white border-white hover:bg-white hover:text-purple-900"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
