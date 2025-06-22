"use client";

import { useState, useRef, useEffect } from "react";

const NUM_BARS = 50;
const BAR_WIDTH = 10;
const CONTAINER_HEIGHT = 400;
const MAX_DELAY = 300;
const PADDING = 4;
const SCALE = (CONTAINER_HEIGHT - PADDING * 4) / NUM_BARS;

const descriptions = {
  bubble:
    "Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. Each full pass pushes the largest remaining element to its correct final position, hence the name Bubble Sort, because the largest unsorted elements ’bubble up’ to the top in each pass. It is simple and easy to implement, the time complexity is O(n²) and the space complexity is O(1), so it’s in place.",
  insertion:
    "Insertion Sort builds the final sorted list one item at a time. It removes each element from the input and finds the location it belongs within the already-sorted part, shifting larger elements one position to the right. It works well for data that is already nearly sorted, its time complexity is O(n²), and it is also in place, so O(1) memory complexity.",
  selection:
    "Selection Sort repeatedly selects the minimum (or maximum) element from the unsorted portion and swaps it with the element at the beginning of that portion. Like Bubble Sort its time complexity is O(n²) and memory complexity O(1), but it performs fewer writes.",
  merge:
    "Merge Sort divides the array in half, recursively sorts each half, then merges the two sorted halves together. Its divide-and-conquer approach guarantees O(n log n) time and is stable, but it requires extra space for merging. This recursive approach is called Top-Down Merge Sort, which uses an extra O(log n) memory for the call stack, but is easier to implement. There is a Bottom Up Merge Sort which is an iterative variant which uses two nested loops instead of recursion. Both variants have a baseline memory complexity of O(n) since they both require an auxiliary array to work. If either version is applied to a Linked List instead of an array, the extra array would be unnecessary and thus we would reduce memory use. There are array-based in-place versions of Merge Sort, but they are quite difficult to implement.",
  quick:
    "Quick Sort selects a pivot, partitions the array into elements smaller than the pivot and larger than the pivot sub-arrays, and recursively sorts the partitions. With a good pivot choice rule it runs in O(n log n) on average, but can degrade to O(n²) in the worst case. It has an average memory complexity of O(log n) due to the call stack from the recursive calls, but this is dependent on the choice of pivot, in the worst case it could degrade to O(n) memory complexity if the pivot choice is not optimal.",
  heap:
    "Heap Sort transforms the array into a binary heap (either max-heap or min-heap depending on the preferred order), repeatedly extracts the maximum (or minimum) element and places it at the end of the array. This in-place algorithm runs in O(n log n) time and uses no extra memory beyond the array itself, but is not stable. The logarithmic component of the time complexity comes from each heap operation, which has O(log n) time complexity."
};

const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

const shuffle = (arr) =>
  arr
    .map((v) => [v, Math.random()])
    .sort((a, b) => a[1] - b[1])
    .map((v) => v[0]);

export default function SortVisualizer() {
  const [array, setArray] = useState(range(NUM_BARS));
  const [algo, setAlgo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [active, setActive] = useState([]);
  const dragIndex = useRef(null);

  useEffect(() => {
    setArray(shuffle(range(NUM_BARS)));
  }, []);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const randomize = () => {
    if (busy) return;
    setArray(shuffle(range(NUM_BARS)));
    setActive([]);
  };

  async function bubbleSort() {
    const a = [...array];
    for (let i = 0; i < a.length - 1; i++)
      for (let j = 0; j < a.length - i - 1; j++) {
        setActive([j, j + 1]);
        await sleep(MAX_DELAY - speed);
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          setArray([...a]);
        }
      }
    setActive([]);
  }

  async function insertionSort() {
    const a = [...array];
    for (let i = 1; i < a.length; i++) {
      let j = i;
      while (j > 0 && a[j - 1] > a[j]) {
        setActive([j - 1, j]);
        await sleep(MAX_DELAY - speed);
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        setArray([...a]);
        j--;
      }
    }
    setActive([]);
  }

  async function selectionSort() {
    const a = [...array];
    for (let i = 0; i < a.length - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < a.length; j++) {
        setActive([minIdx, j]);
        await sleep(MAX_DELAY - speed);
        if (a[j] < a[minIdx]) minIdx = j;
      }
      if (minIdx !== i) {
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        setArray([...a]);
      }
    }
    setActive([]);
  }

  async function mergeSort() {
    const a = [...array];
    const aux = Array(a.length);
    async function merge(lo, mid, hi) {
      for (let k = lo; k <= hi; k++) aux[k] = a[k];
      let i = lo,
        j = mid + 1;
      for (let k = lo; k <= hi; k++) {
        if (i > mid) a[k] = aux[j++];
        else if (j > hi) a[k] = aux[i++];
        else if (aux[j] < aux[i]) a[k] = aux[j++];
        else a[k] = aux[i++];
        setArray([...a]);
        setActive([k]);
        await sleep(MAX_DELAY - speed);
      }
    }
    async function sort(lo, hi) {
      if (lo >= hi) return;
      const mid = Math.floor((lo + hi) / 2);
      await sort(lo, mid);
      await sort(mid + 1, hi);
      await merge(lo, mid, hi);
    }
    await sort(0, a.length - 1);
    setActive([]);
  }

  async function quickSort() {
    const a = [...array];
    async function partition(lo, hi) {
      const pivot = a[hi];
      let i = lo;
      for (let j = lo; j < hi; j++) {
        setActive([j, hi]);
        await sleep(MAX_DELAY - speed);
        if (a[j] < pivot) {
          [a[i], a[j]] = [a[j], a[i]];
          setArray([...a]);
          i++;
        }
      }
      [a[i], a[hi]] = [a[hi], a[i]];
      setArray([...a]);
      await sleep(MAX_DELAY - speed);
      return i;
    }
    async function sort(lo, hi) {
      if (lo >= hi) return;
      const p = await partition(lo, hi);
      await sort(lo, p - 1);
      await sort(p + 1, hi);
    }
    await sort(0, a.length - 1);
    setActive([]);
  }

  async function heapSort() {
    const a = [...array];
    const n = a.length;
    const heapify = async (i, size) => {
      let largest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < size && a[l] > a[largest]) largest = l;
      if (r < size && a[r] > a[largest]) largest = r;
      if (largest !== i) {
        setActive([i, largest]);
        await sleep(MAX_DELAY - speed);
        [a[i], a[largest]] = [a[largest], a[i]];
        setArray([...a]);
        await heapify(largest, size);
      }
    };
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(i, n);
    for (let i = n - 1; i > 0; i--) {
      setActive([0, i]);
      await sleep(MAX_DELAY - speed);
      [a[0], a[i]] = [a[i], a[0]];
      setArray([...a]);
      await heapify(0, i);
    }
    setActive([]);
  }

  const run = () => {
    if (busy || !algo) return;
    setBusy(true);
    (async () => {
      if (algo === "bubble") await bubbleSort();
      else if (algo === "insertion") await insertionSort();
      else if (algo === "selection") await selectionSort();
      else if (algo === "merge") await mergeSort();
      else if (algo === "quick") await quickSort();
      else if (algo === "heap") await heapSort();
      setBusy(false);
    })();
  };

  const handleDragStart = (idx) => {
    dragIndex.current = idx;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (idx) => {
    const from = dragIndex.current;
    if (busy || from == null || from === idx) return;
    setArray((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragIndex.current = null;
  };

  const containerWidth = `${(BAR_WIDTH + 2) * NUM_BARS}px`;

  return (
    <div className="flex flex-col items-center mt-4 select-none">
      <div className="flex gap-4 mb-4">
        <button
          onClick={run}
          disabled={!algo || busy}
          className={`px-4 py-2 font-semibold rounded border ${
            busy
              ? "border-gray-400 text-gray-400"
              : "border-white text-white hover:bg-white hover:text-purple-900"
          }`}
        >
          Visualize
        </button>
        <button
          onClick={randomize}
          disabled={busy}
          className={`px-4 py-2 font-semibold rounded border ${
            busy
              ? "border-gray-400 text-gray-400"
              : "border-white text-white hover:bg-white hover:text-purple-900"
          }`}
        >
          Randomize
        </button>
      </div>

      <div className="flex items-start">
        <div className="flex flex-col items-center">
          <div
            className="border-4 border-purple-700 bg-white rounded-lg p-1 flex items-end overflow-hidden"
            style={{ width: containerWidth, height: `${CONTAINER_HEIGHT}px` }}
          >
            {array.map((value, idx) => (
              <div
                key={idx}
                draggable={!busy}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`mx-0.5 rounded-t transition-all ${
                  active.includes(idx) ? "bar-active" : "bar-inactive"
                }`}
                style={{
                  width: `${BAR_WIDTH}px`,
                  height: `${value * SCALE}px`
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["bubble", "insertion", "selection", "merge", "quick", "heap"].map(
              (a) => (
                <button
                  key={a}
                  onClick={() => setAlgo(a)}
                  className={`px-3 py-1 text-sm font-semibold rounded border transition ${
                    algo === a
                      ? "bg-white text-purple-900"
                      : "text-white border-white hover:bg-white hover:text-purple-900"
                  }`}
                >
                  {a.charAt(0).toUpperCase() + a.slice(1)} Sort
                </button>
              )
            )}
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
            <p>
              Select an algorithm, randomize the order or shift elements around, then press&nbsp;<strong>Visualize</strong>.
            </p>
          )}
        </div>
      </div>

      <style jsx global>{`
        .bar-inactive {
          background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%);
        }
        .bar-active {
          background: linear-gradient(180deg, #ec4899 0%, #d946ef 100%);
        }
      `}</style>
    </div>
  );
}
