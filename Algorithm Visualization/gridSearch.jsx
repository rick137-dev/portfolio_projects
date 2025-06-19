"use client";

import { useState, useRef } from "react";

const GRID = 32;      
const CELL = 16;      

const descriptions = {
  bfs: "Breadth‑First Search expands neighbours layer‑by‑layer and always finds the shortest path on an unweighted grid. It utilizes a queue to explore the grid one layer at a time, pushing each new grid square as a 'node' to the queue. Each node also maintains a pointer to the node that was previously explored in the queue, such that it may build the minimum length path.",
  dfs: "Depth‑First Search dives down one branch of the graph as far as it can before back‑tracking. It uses a stack (or recursion) and stops as soon as it reaches the goal, so it can be memory‑efficient and quick to find a path — but that path is not guaranteed to be the shortest, unless you let it test all possible paths and select the shortest one, however that would clearly be much more time intensive than some of the other algorithms on this list.",
  dijkstra: "Dijkstra’s algorithm uses a priority queue keyed by path cost. It guarantees the shortest path on weighted graphs — on our unit‑weight grid it behaves like BFS but processes the frontier differently. If each grid square had a different weight or cost to explore, the difference would be more apparent. It does not work for graphs with negative weights.",
  astar: "A* adds a Manhattan‑distance heuristic to Dijkstra’s cost, so it heads toward the goal sooner while still returning the optimal path. The principle is the same as Dijkstra’s but with a heuristic to 'focus' the algorithm. Not all heuristics work, but in this grid case the Manhattan distance heuristic is permissible."
};

export default function GridSearch() {
  const [algo, setAlgo] = useState(null); 
  const [start, setStart] = useState([0, 0]);
  const [goal, setGoal] = useState([GRID - 1, GRID - 1]);
  const [walls, setWalls] = useState(new Set());
  
  const [visited, setVisited] = useState(new Set());
  const [path, setPath] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(50); 
  const [drag, setDrag] = useState(null); 
  const mouseDown = useRef(false);

  const MAX_DELAY = 300;
  const key = (r, c) => `${r},${c}`;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const h = ([r, c]) => Math.abs(goal[0] - r) + Math.abs(goal[1] - c); 
  const rebuildPath = (came, end) => {
    const p = new Set();
    let cur = end;
    while (came[cur]) {
      p.add(cur);
      cur = came[cur];
    }
    return p;
  };

  
  //Algorithms
  
  async function bfs() {
    setBusy(true);
    setVisited(new Set());
    setPath(new Set());
    const q = [[...start]];
    const seen = new Set([key(...start)]);
    const came = {};
    while (q.length) {
      const [r, c] = q.shift();
      const k = key(r, c);
      setVisited((v) => {
        const s = new Set(v);
        s.add(k);
        return s;
      });
      await sleep(MAX_DELAY -speed);
      if (k === key(...goal)) break;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nr = r + dr,
          nc = c + dc,
          nk = key(nr, nc);
        if (
          nr < 0 ||
          nr >= GRID ||
          nc < 0 ||
          nc >= GRID ||
          walls.has(nk) ||
          seen.has(nk)
        )
          continue;
        seen.add(nk);
        came[nk] = k;
        q.push([nr, nc]);
      }
    }
    setPath(rebuildPath(came, key(...goal)));
    setBusy(false);
  }

  async function dfs() {
    
    setBusy(true);
    setVisited(new Set());
    setPath(new Set());
    const stack = [[...start]];
    const seen = new Set([key(...start)]);
    const came = {};
    while (stack.length) {
      const [r, c] = stack.pop();
      const k = key(r, c);
      setVisited((v) => {
        const s = new Set(v);
        s.add(k);
        return s;
      });
      await sleep(MAX_DELAY -speed);
      if (k === key(...goal)) break; 
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nr = r + dr,
          nc = c + dc,
          nk = key(nr, nc);
        if (
          nr < 0 ||
          nr >= GRID ||
          nc < 0 ||
          nc >= GRID ||
          walls.has(nk) ||
          seen.has(nk)
        )
          continue;
        seen.add(nk);
        came[nk] = k;
        stack.push([nr, nc]);
      }
    }
    setPath(rebuildPath(came, key(...goal)));
    setBusy(false);
  }

  async function dijkstra() {
    setBusy(true);
    setVisited(new Set());
    setPath(new Set());
    const dist = { [key(...start)]: 0 };
    const pq = [[0, [...start]]];
    const came = {};
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [d, [r, c]] = pq.shift();
      const k = key(r, c);
      if (d !== dist[k]) continue; 
      setVisited((v) => {
        const s = new Set(v);
        s.add(k);
        return s;
      });
      await sleep(MAX_DELAY -speed);
      if (k === key(...goal)) break;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nr = r + dr,
          nc = c + dc,
          nk = key(nr, nc);
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || walls.has(nk))
          continue;
        const nd = d + 1;
        if (nd < (dist[nk] ?? Infinity)) {
          dist[nk] = nd;
          came[nk] = k;
          pq.push([nd, [nr, nc]]);
        }
      }
    }
    setPath(rebuildPath(came, key(...goal)));
    setBusy(false);
  }

  async function astar() {
    setBusy(true);
    setVisited(new Set());
    setPath(new Set());
    const gScore = { [key(...start)]: 0 };
    const pq = [[h(start), 0, [...start]]];
    const came = {};
    while (pq.length) {
      pq.sort((a, b) => a[0] - b[0]);
      const [f, g, [r, c]] = pq.shift();
      const k = key(r, c);
      if (g !== gScore[k]) continue;
      setVisited((v) => {
        const s = new Set(v);
        s.add(k);
        return s;
      });
      await sleep(MAX_DELAY -speed);
      if (k === key(...goal)) break;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ]) {
        const nr = r + dr,
          nc = c + dc,
          nk = key(nr, nc);
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || walls.has(nk))
          continue;
        const ng = g + 1;
        if (ng < (gScore[nk] ?? Infinity)) {
          gScore[nk] = ng;
          came[nk] = k;
          pq.push([ng + h([nr, nc]), ng, [nr, nc]]);
        }
      }
    }
    setPath(rebuildPath(came, key(...goal)));
    setBusy(false);
  }

  // Dispatch to the selected algorithm
  const run = () => {
    if (busy || !algo) return;
    algo === "bfs"
      ? bfs()
      : algo === "dfs"
      ? dfs()
      : algo === "dijkstra"
      ? dijkstra()
      : astar();
  };

  
  const onDown = (r, c) => {
    const k = key(r, c);
    if (k === key(...start)) setDrag("start");
    else if (k === key(...goal)) setDrag("goal");
    else {
      setDrag("wall");
      setWalls((w) => {
        const s = new Set(w);
        s.has(k) ? s.delete(k) : s.add(k);
        return s;
      });
    }
    mouseDown.current = true;
  };

  const onEnter = (r, c) => {
    if (!mouseDown.current || busy) return;
    const k = key(r, c);
    if (drag === "start") setStart([r, c]);
    else if (drag === "goal") setGoal([r, c]);
    else if (drag === "wall")
      setWalls((w) => {
        const s = new Set(w).add(k);
        return s;
      });
  };

  const onUp = () => {
    mouseDown.current = false;
    setDrag(null);
  };

 
  const clear = () => {
    setWalls(new Set());
    setVisited(new Set());
    setPath(new Set());
  };

  const maze = () => {
    const w = new Set();
    for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++)
        if (
          !(r === start[0] && c === start[1]) &&
          !(r === goal[0] && c === goal[1]) &&
          Math.random() < 0.4
        )
          w.add(key(r, c));
    setWalls(w);
    setVisited(new Set());
    setPath(new Set());
  };

 
  return (
    <div className="flex flex-col items-center mt-4 select-none">
      
      <div className="flex gap-4 mb-6">
        {["bfs", "dfs", "dijkstra", "astar"].map((a) => (
          <button
            key={a}
            onClick={() => setAlgo(a)}
            className={`px-4 py-2 font-semibold rounded border transition ${
              algo === a
                ? "bg-white text-purple-900"
                : "text-white border-white hover:bg-white hover:text-purple-900"
            }`}
          >
            {a === "astar" ? "A*" : a.toUpperCase()}
          </button>
        ))}
      </div>

     
      <div className="flex items-start">
        
        <div className="flex flex-col items-center">
          <div
            onMouseUp={onUp}
            className="border-4 border-purple-700 bg-white rounded-lg grid"
            style={{
              gridTemplateColumns: `repeat(${GRID},${CELL}px)`,
              gridTemplateRows: `repeat(${GRID},${CELL}px)`
            }}
          >
            {Array.from({ length: GRID }, (_, r) =>
              Array.from({ length: GRID }, (_, c) => {
                const k = key(r, c);
                const cls = walls.has(k)
                  ? "bg-black animate-pop"
                  : path.has(k)
                  ? "animate-path"
                  : visited.has(k)
                  ? "animate-visit"
                  : "hover:bg-gray-200";
                return (
                  <div
                    key={k}
                    onMouseDown={() => onDown(r, c)}
                    onMouseEnter={() => onEnter(r, c)}
                    className={`w-4 h-4 border border-gray-300 flex items-center justify-center cursor-pointer transition ${cls}`}
                  >
                    {k === key(...start) ? (
                      <div className="w-4 h-4 bg-red-600 rounded-full" />
                    ) : k === key(...goal) ? (
                      <div className="text-black font-extrabold text-[10px]">X</div>
                    ) : null}
                  </div>
                );
              })
            ).flat()}
          </div>

         
          <div className="flex gap-4 mt-2">
            <button
              onClick={clear}
              className="px-4 py-2 font-semibold rounded border border-white text-white hover:bg-white hover:text-purple-900"
            >
              Clear Walls
            </button>
            <button
              onClick={maze}
              className="px-4 py-2 font-semibold rounded border border-white text-white hover:bg-white hover:text-purple-900"
            >
              Random Maze
            </button>
            <button
              onClick={run}
              disabled={!algo || busy}
              className={`px-4 py-2 font-semibold rounded border ${busy ? "border-gray-400 text-gray-400" : "border-white text-white hover:bg-white hover:text-purple-900"}`}
            >
              Visualise
            </button>
          </div>

        
          <label
            className="flex items-center gap-4 mt-4 text-white"
            htmlFor="speed"
          >
            Speed
            <input
              id="speed"
              type="range"
              min="10"
              max="200"
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
              className="w-60"
            />
          </label>
        </div>

       
        <div className="ml-8 max-w-md bg-white text-purple-900 text-sm p-4 rounded-lg border border-gray-300 mt-2 shadow-md">
          {algo ? (
            <pre className="whitespace-pre-wrap font-sans">
              {descriptions[algo]}
            </pre>
          ) : (
            <p>Select an algorithm to see its description.</p>
          )}
        </div>
      </div>

     
      <style jsx global>{`
        @keyframes wall-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          70% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes visit-flash {
          0% {
            background: #f87171;
            transform: scale(1.3);
          }
          100% {
            background: #60a5fa;
            transform: scale(1);
          }
        }
        @keyframes path-pulse {
          0% {
            background: #fde047;
          }
          50% {
            background: #facc15;
          }
          100% {
            background: #fde047;
          }
        }
        .animate-pop {
          animation: wall-pop 0.2s ease-out;
        }
        .animate-visit {
          animation: visit-flash 0.8s ease-out forwards;
        }
        .animate-path {
          animation: path-pulse 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
