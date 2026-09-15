"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bug, ChevronLeft, ChevronRight, Droplets, Eraser, Flower2, Pause, Pencil, Play, RotateCcw, Trash2, TreePine, Volume2, VolumeX } from "lucide-react";

type SoundKind = "tap" | "pop" | "place" | "success";
type GardenKind = "flower" | "tree" | "water" | "butterfly";
type GardenItem = { id: number; kind: GardenKind; x: number; y: number };

const GAME_COUNT = 8;
const GAME_NAMES = ["Breathing", "Bubbles", "Calm Garden", "Memory", "Mood", "Stars", "Drawing", "Tap the Dog"];
const POSITIONS = [[14, 20], [45, 16], [72, 25], [25, 48], [58, 45], [80, 62], [43, 70], [15, 73]];

function useGameAudio() {
  const [enabled, setEnabledState] = useState(true);
  const enabledRef = useRef(true);
  const volumeRef = useRef(0.07);
  const contextRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef(new Set<OscillatorNode>());
  const requestRef = useRef(0);
  const lastSoundRef = useRef(0);

  const stopAll = useCallback(() => {
    requestRef.current += 1;
    sourcesRef.current.forEach((source) => { try { source.stop(); source.disconnect(); } catch { /* Already ended. */ } });
    sourcesRef.current.clear();
  }, []);

  const setEnabled = useCallback((next: boolean) => { enabledRef.current = next; setEnabledState(next); if (!next) stopAll(); }, [stopAll]);

  const play = useCallback((kind: SoundKind) => {
    if (!enabledRef.current || typeof window === "undefined") return;
    const now = performance.now();
    if (now - lastSoundRef.current < 65 && kind !== "success") return;
    lastSoundRef.current = now;
    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextConstructor) return;
    try {
      contextRef.current ??= new AudioContextConstructor();
      const context = contextRef.current;
      const request = ++requestRef.current;
      const createSound = () => {
        if (request !== requestRef.current || !enabledRef.current) return;
        stopAll();
        const tones: Record<SoundKind, Array<[number, number, number, number]>> = {
          tap: [[520, 0.12, 0, 0.65]],
          pop: [[410, 0.1, 0, 0.7]],
          place: [[330, 0.16, 0, 0.68], [440, 0.14, 0.06, 0.45]],
          success: [[523, 0.17, 0, 0.95], [659, 0.19, 0.11, 0.82], [784, 0.3, 0.22, 0.7]],
        };
        tones[kind].forEach(([frequency, duration, delay, strength]) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = context.currentTime + delay;
          const peak = Math.max(0.0001, volumeRef.current * strength);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          oscillator.connect(gain).connect(context.destination);
          oscillator.onended = () => { sourcesRef.current.delete(oscillator); try { oscillator.disconnect(); } catch { /* Already disconnected. */ } };
          sourcesRef.current.add(oscillator);
          oscillator.start(start);
          oscillator.stop(start + duration + 0.03);
        });
      };
      if (context.state === "running") createSound();
      else void context.resume().then(createSound).catch(() => undefined);
    } catch { /* Sound is optional; the interaction remains usable. */ }
  }, [stopAll]);

  useEffect(() => () => { stopAll(); void contextRef.current?.close().catch(() => undefined); }, [stopAll]);
  return { enabled, setEnabled, play, stopAll };
}

function useManagedTimer() {
  const timerRef = useRef<number | null>(null);
  const clear = useCallback(() => { if (timerRef.current !== null) { window.clearTimeout(timerRef.current); timerRef.current = null; } }, []);
  const schedule = useCallback((callback: () => void, delay: number) => { clear(); timerRef.current = window.setTimeout(() => { timerRef.current = null; callback(); }, delay); }, [clear]);
  useEffect(() => clear, [clear]);
  return { clear, schedule };
}

function Progress({ level, value, target, message }: { level: number; value: number; target: number; message?: string }) {
  return <div className="mind-game-progress" aria-live="polite"><span>Level {level}</span><span>{Math.min(value, target)}/{target}</span>{message && <span className="mind-game-progress__message">{message}</span>}</div>;
}

function GameFrame({ title, instructions, progress, status, headerSlot, level, value, target, message, className, children, footer }: { title: string; instructions: string; progress?: { level: number; value: number; target: number; message?: string }; status?: string; headerSlot?: ReactNode; level?: number; value?: number; target?: number; message?: string; className: string; children: ReactNode; footer?: ReactNode }) {
  const legacyProgress = level !== undefined && value !== undefined && target !== undefined ? { level, value, target, message } : undefined;
  const visibleProgress = progress ?? legacyProgress;
  const simpleGame = title === "Breathing bubble" || title === "Slow drawing" || title === "Mood garden";
  const visibleStatus = status ?? (simpleGame ? message : undefined);
  return <article className={`mind-game-stage ${className}`}>
    <header className="mind-game-stage__header"><div><h2>{title}</h2><p>{instructions}</p></div>{headerSlot ?? (simpleGame ? visibleStatus ? <p className="mind-game-status" aria-live="polite">{visibleStatus}</p> : null : visibleProgress ? <Progress {...visibleProgress} /> : null)}</header>
    <div className="mind-game-stage__content">{children}</div>
    {footer && <footer className="mind-game-stage__footer">{footer}</footer>}
  </article>;
}

export function StressReliefGames() {
  const [activeGame, setActiveGame] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const audio = useGameAudio();
  const goTo = useCallback((next: number) => { audio.stopAll(); setActiveGame((next + GAME_COUNT) % GAME_COUNT); }, [audio]);
  const toggleAudio = () => { const next = !audio.enabled; audio.setEnabled(next); if (next) audio.play("tap"); };
  const goBack = () => { audio.stopAll(); window.location.assign("/dashboard"); };

  return <main className="mind-games" onKeyDown={(event) => { if (event.key === "ArrowLeft") goTo(activeGame - 1); if (event.key === "ArrowRight") goTo(activeGame + 1); }}>
    <div className="mind-games__topbar"><button type="button" className="mind-games__icon-button" onClick={goBack} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><button type="button" className="mind-games__icon-button" onClick={toggleAudio} aria-pressed={!audio.enabled} aria-label={audio.enabled ? "Mute sound effects" : "Enable sound effects"}>{audio.enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button></div>
    <div className="mind-games__viewport" role="region" aria-label="Stress relief games" tabIndex={0} onTouchStart={(event) => { if (event.target instanceof Element && event.target.closest("button, input, a, canvas")) { touchStart.current = null; return; } const point = event.touches[0]; if (point) touchStart.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={(event) => { const start = touchStart.current; const point = event.changedTouches[0]; touchStart.current = null; if (!start || !point) return; const horizontal = point.clientX - start.x; const vertical = point.clientY - start.y; if (Math.abs(horizontal) > 50 && Math.abs(horizontal) > Math.abs(vertical)) goTo(horizontal < 0 ? activeGame + 1 : activeGame - 1); }}>
      <div className="mind-games__track" style={{ transform: `translateX(-${(activeGame * 100) / GAME_COUNT}%)` }}>
        <div className="mind-games__slide"><BreathingGame active={activeGame === 0} play={audio.play} /></div>
        <div className="mind-games__slide"><BubbleGame active={activeGame === 1} play={audio.play} /></div>
        <div className="mind-games__slide"><GardenGame active={activeGame === 2} play={audio.play} /></div>
        <div className="mind-games__slide"><MemoryGame active={activeGame === 3} play={audio.play} /></div>
        <div className="mind-games__slide"><MoodGame active={activeGame === 4} play={audio.play} /></div>
        <div className="mind-games__slide"><StarsGame active={activeGame === 5} play={audio.play} /></div>
        <div className="mind-games__slide"><DrawingGame active={activeGame === 6} play={audio.play} /></div>
        <div className="mind-games__slide"><TapTheDogGame active={activeGame === 7} play={audio.play} /></div>
      </div>
    </div>
    <nav className="mind-games__navigation" aria-label="Game selection"><button type="button" className="mind-games__icon-button" onClick={() => goTo(activeGame - 1)} aria-label="Previous game"><ChevronLeft className="h-5 w-5" /></button><div className="mind-games__dots">{GAME_NAMES.map((name, index) => <button key={name} type="button" className={`mind-games__dot ${activeGame === index ? "mind-games__dot--active" : ""}`} onClick={() => goTo(index)} aria-label={`Open ${name}`} aria-current={activeGame === index ? "true" : undefined} />)}</div><button type="button" className="mind-games__icon-button" onClick={() => goTo(activeGame + 1)} aria-label="Next game"><ChevronRight className="h-5 w-5" /></button></nav>
  </main>;
}

function BreathingGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [running, setRunning] = useState(false); const [step, setStep] = useState(0); const phases = ["Inhale", "Hold", "Exhale", "Rest"];
  useEffect(() => { if (!active) setRunning(false); }, [active]);
  useEffect(() => { if (!active || !running) return; if (step >= 12) { setRunning(false); play("success"); return; } const timer = window.setTimeout(() => { setStep((value) => value + 1); play("tap"); }, 3200); return () => window.clearTimeout(timer); }, [active, play, running, step]);
  const restart = () => { setRunning(false); setStep(0); play("tap"); };
  const toggle = () => { if (step >= 12) setStep(0); setRunning((value) => !value || step >= 12); play("tap"); };
  const complete = step >= 12;
  return <GameFrame title="Breathing bubble" instructions="Follow three calm breathing cycles." status={complete ? "Complete - well done." : running ? phases[step % 4] : "Ready when you are"} className="mind-game-stage--breathing" footer={<><button type="button" className="mind-game-button mind-game-button--primary" onClick={toggle}>{running ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />{complete ? "Start again" : "Start"}</>}</button><button type="button" className="mind-game-button mind-game-button--icon" onClick={restart} aria-label="Restart breathing"><RotateCcw className="h-4 w-4" /></button></>}><div className={`mind-breathing-bubble ${running ? "mind-breathing-bubble--running" : ""}`}><span>{running ? phases[step % 4] : complete ? "Done" : "Breathe"}</span></div></GameFrame>;
}

function BubbleGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [level, setLevel] = useState(1); const [popped, setPopped] = useState<Set<number>>(new Set()); const [message, setMessage] = useState("Tap each bubble once."); const [won, setWon] = useState(false); const poppedRef = useRef(new Set<number>()); const transitioning = useRef(false); const timer = useManagedTimer();
  const target = level + 3;
  const restart = () => { timer.clear(); transitioning.current = false; poppedRef.current = new Set(); setLevel(1); setPopped(new Set()); setWon(false); setMessage("Tap each bubble once."); play("tap"); };
  const pop = (id: number) => { if (!active || won || transitioning.current || poppedRef.current.has(id)) return; const next = new Set(poppedRef.current); next.add(id); poppedRef.current = next; setPopped(next); play("pop"); if (next.size < target) return; transitioning.current = true; if (level === 3) { setWon(true); setMessage("You win!"); play("success"); return; } const nextLevel = level + 1; setMessage(`Level ${nextLevel} unlocked.`); play("success"); timer.schedule(() => { poppedRef.current = new Set(); setPopped(new Set()); setLevel(nextLevel); transitioning.current = false; }, 650); };
  return <GameFrame title="Pop the bubbles" instructions="Clear every bubble to unlock the next level." progress={{ level, value: popped.size, target, message }} className="mind-game-stage--bubbles" footer={<button type="button" className="mind-game-button mind-game-button--icon" onClick={restart} aria-label="Restart bubbles"><RotateCcw className="h-4 w-4" /></button>}><div className="mind-bubble-field">{!won && POSITIONS.slice(0, target).map(([left, top], id) => !popped.has(id) && <button key={`${level}-${id}`} type="button" className="mind-bubble" onClick={() => pop(id)} aria-label="Pop bubble" style={{ left: `${left}%`, top: `${top}%`, "--bubble-size": `${52 + (id % 3) * 10}px` } as CSSProperties} />)}{won && <p className="mind-game-finish">All three levels complete.</p>}</div></GameFrame>;
}

function GardenGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [level, setLevel] = useState(1); const [items, setItems] = useState<GardenItem[]>([]); const [message, setMessage] = useState("Add four peaceful details."); const [won, setWon] = useState(false); const [dragging, setDragging] = useState<number | null>(null); const id = useRef(1); const itemCount = useRef(0); const transitioning = useRef(false); const timer = useManagedTimer();
  const target = level + 3;
  const reset = () => { timer.clear(); id.current = 1; itemCount.current = 0; transitioning.current = false; setLevel(1); setItems([]); setWon(false); setMessage("Add four peaceful details."); play("tap"); };
  const add = (kind: GardenKind) => { if (!active || won || transitioning.current) return; const nextCount = itemCount.current + 1; itemCount.current = nextCount; const nextId = id.current++; setItems((current) => [...current, { id: nextId, kind, x: 12 + ((nextId * 17) % 70), y: 18 + ((nextId * 13) % 58) }]); play("place"); if (nextCount < target) return; transitioning.current = true; if (level === 3) { setWon(true); setMessage("You win!"); play("success"); return; } const nextLevel = level + 1; setMessage(`Level ${nextLevel} unlocked.`); play("success"); timer.schedule(() => { itemCount.current = 0; setLevel(nextLevel); setItems([]); transitioning.current = false; }, 650); };
  const move = (event: ReactPointerEvent<HTMLButtonElement>, itemId: number) => { if (dragging !== itemId) return; const field = event.currentTarget.parentElement?.getBoundingClientRect(); if (!field) return; const x = Math.max(2, Math.min(88, ((event.clientX - field.left) / field.width) * 100)); const y = Math.max(4, Math.min(78, ((event.clientY - field.top) / field.height) * 100)); setItems((current) => current.map((item) => item.id === itemId ? { ...item, x, y } : item)); };
  const symbols: Record<GardenKind, string> = { flower: "✿", tree: "♠", water: "≈", butterfly: "⌁" };
  return <GameFrame title="Calm garden" instructions="Add items, then drag them to make your garden." progress={{ level, value: items.length, target, message }} className={`mind-game-stage--garden mind-game-stage--garden-${level}`} footer={<><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => add("flower")} aria-label="Add flower"><Flower2 className="h-4 w-4" /></button><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => add("tree")} aria-label="Add tree"><TreePine className="h-4 w-4" /></button><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => add("water")} aria-label="Add water"><Droplets className="h-4 w-4" /></button><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => add("butterfly")} aria-label="Add butterfly"><Bug className="h-4 w-4" /></button><button type="button" className="mind-game-button mind-game-button--icon" onClick={reset} aria-label="Restart garden"><RotateCcw className="h-4 w-4" /></button></>}><div className="mind-garden-field"><span className="mind-garden-sun" /><span className="mind-garden-water" />{items.map((item) => <button key={item.id} type="button" data-garden-drag-item onTouchStart={(event) => event.stopPropagation()} className={`mind-garden-item mind-garden-item--${item.kind} ${dragging === item.id ? "mind-garden-item--dragging" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setDragging(item.id); }} onPointerMove={(event) => { event.stopPropagation(); move(event, item.id); }} onPointerUp={(event) => { event.stopPropagation(); setDragging(null); play("tap"); }} onPointerCancel={() => setDragging(null)} aria-label={`Move ${item.kind}`}>{symbols[item.kind]}</button>)}{won && <p className="mind-game-finish">Your garden is complete.</p>}</div></GameFrame>;
}

const SYMBOLS = ["☀", "☾", "✿", "★", "☁", "♫"];
function makeDeck(level: number) { const pairs = SYMBOLS.slice(0, Math.min(3 + level, SYMBOLS.length)); return [...pairs, ...pairs].sort(() => Math.random() - 0.5); }
function MemoryGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [level, setLevel] = useState(1); const [deck, setDeck] = useState(() => makeDeck(1)); const [open, setOpen] = useState<number[]>([]); const [matched, setMatched] = useState<number[]>([]); const [message, setMessage] = useState("Find the matching pairs."); const [won, setWon] = useState(false); const locked = useRef(false); const completed = useRef(false); const timer = useManagedTimer();
  useEffect(() => { if (!active) { locked.current = false; timer.clear(); setOpen([]); } }, [active, timer]);
  useEffect(() => { if (!active || !deck.length || matched.length !== deck.length || completed.current) return; completed.current = true; locked.current = true; play("success"); if (level === 3) { setWon(true); setMessage("You win!"); return; } const nextLevel = level + 1; setMessage(`Level ${nextLevel} unlocked.`); timer.schedule(() => { setLevel(nextLevel); setDeck(makeDeck(nextLevel)); setOpen([]); setMatched([]); completed.current = false; locked.current = false; }, 650); }, [active, deck.length, level, matched.length, play, timer]);
  const restart = () => { timer.clear(); locked.current = false; completed.current = false; setLevel(1); setDeck(makeDeck(1)); setOpen([]); setMatched([]); setWon(false); setMessage("Find the matching pairs."); play("tap"); };
  const choose = (index: number) => { if (!active || won || locked.current || open.includes(index) || matched.includes(index)) return; const next = [...open, index]; setOpen(next); play("tap"); if (next.length < 2) return; locked.current = true; const [first, second] = next; if (deck[first] === deck[second]) { timer.schedule(() => { setMatched((current) => [...current, first, second]); setOpen([]); locked.current = false; play("place"); }, 220); } else timer.schedule(() => { setOpen([]); locked.current = false; }, 500); };
  return <GameFrame title="Memory match" instructions="Turn over two cards and find each pair." level={level} value={matched.length / 2} target={deck.length / 2} message={message} className="mind-game-stage--memory" footer={<button type="button" className="mind-game-button mind-game-button--icon" onClick={restart} aria-label="Restart memory"><RotateCcw className="h-4 w-4" /></button>}><div className="mind-memory-grid">{deck.map((symbol, index) => <button key={`${level}-${index}`} type="button" className={`mind-memory-card ${open.includes(index) || matched.includes(index) ? "mind-memory-card--open" : ""}`} onClick={() => choose(index)} aria-label="Turn over memory card">{symbol}</button>)}</div></GameFrame>;
}

function MoodGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [selected, setSelected] = useState(""); const moods = [{ id: "happy", icon: "☀", label: "Glad" }, { id: "sad", icon: "☂", label: "Low" }, { id: "angry", icon: "⚡", label: "Angry" }, { id: "tired", icon: "☾", label: "Tired" }, { id: "worried", icon: "☁", label: "Worried" }, { id: "confused", icon: "?", label: "Mixed" }, { id: "stressed", icon: "≈", label: "Stressed" }];
  return <GameFrame title="Mood garden" instructions="Choose the feeling that is closest right now." level={1} value={selected ? 1 : 0} target={1} message={selected ? "Feeling noted." : "Choose one feeling."} className={`mind-game-stage--mood ${selected ? `mind-mood--${selected}` : ""}`}><div className="mind-mood-field"><div className="mind-mood-sky"><span>{moods.find((mood) => mood.id === selected)?.icon ?? "✿"}</span></div><div className="mind-mood-options">{moods.map((mood) => <button key={mood.id} type="button" className={selected === mood.id ? "mind-mood-option mind-mood-option--selected" : "mind-mood-option"} onClick={() => { if (!active) return; setSelected(mood.id); play("tap"); }}><span>{mood.icon}</span><small>{mood.label}</small></button>)}</div></div></GameFrame>;
}

function StarsGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [level, setLevel] = useState(1); const [caught, setCaught] = useState<Set<number>>(new Set()); const [message, setMessage] = useState("Catch every star."); const [won, setWon] = useState(false); const caughtRef = useRef(new Set<number>()); const transitioning = useRef(false); const timer = useManagedTimer();
  const target = level + 3;
  const restart = () => { timer.clear(); caughtRef.current = new Set(); transitioning.current = false; setLevel(1); setCaught(new Set()); setMessage("Catch every star."); setWon(false); play("tap"); };
  const catchStar = (id: number) => { if (!active || won || transitioning.current || caughtRef.current.has(id)) return; const next = new Set(caughtRef.current); next.add(id); caughtRef.current = next; setCaught(next); play("pop"); if (next.size < target) return; transitioning.current = true; if (level === 3) { setWon(true); setMessage("You win!"); play("success"); return; } const nextLevel = level + 1; setMessage(`Level ${nextLevel} unlocked.`); play("success"); timer.schedule(() => { caughtRef.current = new Set(); setCaught(new Set()); setLevel(nextLevel); transitioning.current = false; }, 650); };
  return <GameFrame title="Catch the stars" instructions="Collect each star to move to the next level." level={level} value={caught.size} target={target} message={message} className="mind-game-stage--stars" footer={<button type="button" className="mind-game-button mind-game-button--icon" onClick={restart} aria-label="Restart stars"><RotateCcw className="h-4 w-4" /></button>}><div className="mind-stars-field">{!won && POSITIONS.slice(0, target).map(([left, top], id) => !caught.has(id) && <button key={`${level}-${id}`} type="button" className="mind-star" style={{ left: `${left}%`, top: `${top}%` }} onClick={() => catchStar(id)} aria-label="Catch star">★</button>)}{won && <p className="mind-game-finish">A sky full of light.</p>}</div></GameFrame>;
}

function DrawingGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); const drawingRef = useRef(false); const [color, setColor] = useState("#28636a"); const [size, setSize] = useState(4); const [strokes, setStrokes] = useState(0);
  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => { const rect = event.currentTarget.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width), y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height) }; };
  const clear = () => { const canvas = canvasRef.current; if (!canvas) return; canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); setStrokes(0); play("tap"); };
  useEffect(() => { if (!active) drawingRef.current = false; }, [active]);
  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => { if (!active) return; const context = event.currentTarget.getContext("2d"); if (!context) return; const point = getPoint(event); context.beginPath(); context.moveTo(point.x, point.y); context.lineWidth = size; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = color; drawingRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); setStrokes((value) => value + 1); play("tap"); };
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => { if (!drawingRef.current || !active) return; const context = event.currentTarget.getContext("2d"); if (!context) return; const point = getPoint(event); context.lineTo(point.x, point.y); context.stroke(); };
  const stop = () => { drawingRef.current = false; };
  return <GameFrame title="Slow drawing" instructions="Draw a few simple lines at your own pace." status={strokes >= 3 ? "Lovely work." : "Draw slowly."} className="mind-game-stage--drawing" footer={<><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => { setColor("#28636a"); play("tap"); }} aria-label="Use teal pencil"><Pencil className="h-4 w-4" /></button><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => { setColor("#fffaf0"); play("tap"); }} aria-label="Use eraser"><Eraser className="h-4 w-4" /></button><label className="mind-game-size"><span className="sr-only">Brush size</span><input type="range" min="2" max="18" value={size} onChange={(event) => setSize(Number(event.target.value))} aria-label="Brush size" /></label><button type="button" className="mind-game-button mind-game-button--icon" onClick={clear} aria-label="Clear drawing"><Trash2 className="h-4 w-4" /></button></>}><canvas ref={canvasRef} className="mind-drawing-canvas" width={900} height={680} aria-label="Drawing area" onPointerDown={start} onPointerMove={draw} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} /></GameFrame>;
}

function dogPosition() { return { left: 14 + Math.random() * 72, top: 18 + Math.random() * 62 }; }

function TapTheDogGame({ active, play }: { active: boolean; play: (kind: SoundKind) => void }) {
  const [phase, setPhase] = useState<"ready" | "running" | "paused" | "finished">("ready");
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(30);
  const [position, setPosition] = useState(dogPosition);
  const hitLocked = useRef(false);
  const unlockTimer = useManagedTimer();

  const reset = useCallback((start = false) => {
    unlockTimer.clear();
    hitLocked.current = false;
    setScore(0);
    setSeconds(30);
    setPosition(dogPosition());
    setPhase(start ? "running" : "ready");
    play(start ? "place" : "tap");
  }, [play, unlockTimer]);

  useEffect(() => {
    if (!active) {
      unlockTimer.clear();
      hitLocked.current = false;
      setPhase("ready");
      setSeconds(30);
      setScore(0);
    }
  }, [active, unlockTimer]);

  useEffect(() => {
    if (!active || phase !== "running") return;
    const timer = window.setInterval(() => setSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [active, phase]);

  useEffect(() => {
    if (phase !== "running" || seconds !== 0) return;
    hitLocked.current = true;
    setPhase("finished");
    play("success");
  }, [phase, play, seconds]);

  const startOrPause = () => {
    if (phase === "ready" || phase === "finished") { reset(true); return; }
    setPhase((current) => current === "running" ? "paused" : "running");
    play("tap");
  };
  const moveDog = () => { if (active && phase !== "finished") { setPosition(dogPosition()); play("tap"); } };
  const scoreDog = () => {
    if (!active || phase !== "running" || hitLocked.current) return;
    hitLocked.current = true;
    setScore((current) => current + 1);
    setPosition(dogPosition());
    play("pop");
    unlockTimer.schedule(() => { hitLocked.current = false; }, 130);
  };
  const buttonLabel = phase === "running" ? "Pause" : phase === "paused" ? "Resume" : phase === "finished" ? "Play again" : "Start";
  const status = phase === "finished" ? `Time is up - final score ${score}.` : phase === "paused" ? "Paused" : phase === "running" ? "Tap the friendly dog." : "Start when you are ready.";

  return <GameFrame title="Tap the dog" instructions="Tap the friendly dog before the 30-second timer ends." headerSlot={<div className="mind-game-stats" aria-live="polite"><span>Score {score}</span><span>{seconds}s</span></div>} className="mind-game-stage--dog" footer={<><button type="button" className="mind-game-button mind-game-button--primary" onClick={startOrPause}>{phase === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{buttonLabel}</button><button type="button" className="mind-game-button" onClick={moveDog} disabled={phase === "finished"} aria-label="Move dog without scoring">Move dog</button><button type="button" className="mind-game-button mind-game-button--icon" onClick={() => reset(false)} aria-label="Restart Tap the Dog"><RotateCcw className="h-4 w-4" /></button></>}><div className="mind-dog-field"><p className="mind-dog-status" aria-live="polite">{status}</p>{phase !== "finished" && <button type="button" className={`mind-dog ${phase === "running" ? "mind-dog--ready" : ""}`} style={{ left: `${position.left}%`, top: `${position.top}%` }} onClick={scoreDog} disabled={phase !== "running"} aria-label="Tap the dog to score one point"><span aria-hidden="true">🐶</span></button>}{phase === "finished" && <div className="mind-dog-finish"><span aria-hidden="true">🐶</span><p>Wonderful play!</p><strong>{score} point{score === 1 ? "" : "s"}</strong><button type="button" className="mind-game-button mind-game-button--primary" onClick={() => reset(true)}>Play again</button></div>}</div></GameFrame>;
}
