import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Platform, useWindowDimensions } from 'react-native';
import type { Game } from './types';

const gold = '#E4BA70', white = '#FFF8E9', muted = '#A8BBB1';
const suit: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
function Card({ code, size = 46 }: { code?: string; size?: number }) {
  const flip = useRef(new Animated.Value(code ? 0 : 1)).current;
  useEffect(() => {
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [code, flip]);
  const color = code && 'hd'.includes(code[1]) ? '#B32E42' : '#162C27';
  return <Animated.View accessibilityLabel={code ? `${code[0]} ${suit[code[1]]}` : 'Carte cachée'} style={[st.card, { width: size, height: size * 1.42, backgroundColor: code ? white : '#183E35', borderColor: code ? '#FFFFFF' : gold, transform: [{ perspective: 800 }, { rotateY: flip.interpolate({ inputRange: [0, 1], outputRange: ['85deg', '0deg'] }) }] }]}>
    {code ? <><Text style={{ color, fontSize: size * .36, fontWeight: '800', alignSelf: 'flex-start', paddingLeft: 4 }}>{code[0] === 'T' ? '10' : code[0]}</Text><Text style={{ color, fontSize: size * .48, lineHeight: size * .55 }}>{suit[code[1]]}</Text></> : <Text style={{ color: gold, fontSize: size * .55 }}>◈</Text>}
  </Animated.View>;
}
function ChipFlight({ bet, won, dx, dy }: { bet: number; won: boolean; dx: number; dy: number }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!bet && !won) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [bet, won, progress]);
  return <Animated.View pointerEvents="none" style={{ position: 'absolute', top: 20, zIndex: 15, opacity: progress.interpolate({ inputRange: [0, .7, 1], outputRange: [1, 1, 0] }), transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: won ? [dx, 0] : [0, dx] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: won ? [dy, 0] : [0, dy] }) }] }}><Text style={{ color: gold, fontSize: 24 }}>◉</Text></Animated.View>;
}
function Slider({ min, max, value, change }: { min: number; max: number; value: number; change: (n: number) => void }) {
  const width = useRef(1);
  const current = useRef({ min, max, change }); current.current = { min, max, change };
  const set = (x: number) => { const p = current.current; p.change(Math.round(p.min + Math.max(0, Math.min(1, x / width.current)) * (p.max - p.min))); };
  const responder = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: e => set(e.nativeEvent.locationX), onPanResponderMove: e => set(e.nativeEvent.locationX) })).current;
  const percent = max === min ? 100 : Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
  if (Platform.OS === 'web') return React.createElement('input', { type: 'range', 'aria-label': 'Montant total de la relance', min, max, value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => change(Number(e.target.value)), style: { width: '100%', minHeight: 44, accentColor: gold } });
  return <View {...responder.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Montant total de la relance" accessibilityValue={{ min, max, now: value }} accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={e => change(Math.max(min, Math.min(max, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))} onLayout={e => { width.current = e.nativeEvent.layout.width; }} style={{ height: 44, justifyContent: 'center', flex: 1 }}>
    <View style={{ height: 5, backgroundColor: '#3B5146', borderRadius: 9 }}><View style={{ height: 5, width: `${percent}%`, backgroundColor: gold }} /></View>
    <View pointerEvents="none" style={{ position: 'absolute', left: `${percent * .92}%`, width: 24, height: 24, borderRadius: 12, backgroundColor: gold, borderWidth: 3, borderColor: white }} />
  </View>;
}
function River({ deadline, now, size, code }: { deadline: number; now: number; size: number; code?: string }) {
  const peel = useRef(new Animated.Value(0)).current;
  const [holding, hold] = useState(false);
  const animate = (down: boolean) => { hold(down); Animated.timing(peel, { toValue: down ? 1 : 0, duration: down ? 1300 : 240, useNativeDriver: true }).start(); };
  useEffect(() => () => peel.stopAnimation(), [peel]);
  return <View style={st.shade}>
    <Text style={st.eyebrow}>LA RIVER</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Maintenir pour soulever le coin de la river" onPressIn={() => animate(true)} onPressOut={() => animate(false)} style={{ marginVertical: 14 }}>
      {code ? <Card code={code} size={size} /> : <View style={[st.card, { width: size, height: size * 1.42, backgroundColor: '#153D31', borderColor: gold, borderWidth: 2, overflow: 'hidden', borderRadius: 18 }]}>
        <Text style={{ color: gold, fontSize: size * .34 }}>◈</Text>
        <Text style={[st.eyebrow, { marginTop: 15 }]}>STACKORA</Text>
        <Animated.View pointerEvents="none" style={{ position: 'absolute', right: -size * .12, top: -size * .12, width: size * .58, height: size * .58, backgroundColor: white, borderBottomLeftRadius: size * .5, transform: [{ translateX: peel.interpolate({ inputRange: [0, 1], outputRange: [size * .6, 0] }) }, { rotate: '-12deg' }] }} />
      </View>}
    </Pressable>
    <Text style={st.text}>{code ? 'La river est dévoilée' : holding ? 'Gardez le doigt appuyé…' : 'Maintenez pour soulever le coin'}</Text>
    <Text style={st.dim}>Révélation commune · {Math.max(0, (deadline - now) / 1000).toFixed(1)} s</Text>
  </View>;
}
export function PokerTable({ game, userId, busy, units, felt, toggleUnits, play }: { game: Game; userId: string; busy: boolean; units: boolean; felt: string; toggleUnits: () => void; play: (type: string, amount?: number) => Promise<void> }) {
  const viewport = useWindowDimensions();
  const [{ width, height }, setViewport] = useState({ width: 390, height: 844 });
  useEffect(() => { if (viewport.width > 0 && viewport.height > 0) setViewport({ width: viewport.width, height: viewport.height }); }, [viewport.width, viewport.height]);
  const own = Math.max(0, game.tables.findIndex(t => t.players.includes(userId)));
  const [selected, select] = useState<number | null>(null);
  const table = game.tables[selected ?? own] ?? game.tables[own];
  const h = table?.hand;
  const [history, showHistory] = useState(false), [raiseOpen, openRaise] = useState(false), [raise, setRaise] = useState('0');
  const [now, setNow] = useState(Date.now());
  const clock = useRef({ server: game.serverNow ?? Date.now(), local: Date.now() });
  useEffect(() => { clock.current = { server: game.serverNow ?? Date.now(), local: Date.now() }; }, [game]);
  useEffect(() => { const timer = setInterval(() => setNow(clock.current.server + Date.now() - clock.current.local), 100); return () => clearInterval(timer); }, []);
  const previousRiver = useRef<number | null>(null);
  const [revealedRiver, revealRiver] = useState<string | undefined>();
  useEffect(() => {
    const previous = previousRiver.current;
    previousRiver.current = h?.presentation?.river ? h.presentation.count : null;
    if (previous !== null && h?.board[previous]) {
      revealRiver(h.board[previous]);
      const timer = setTimeout(() => revealRiver(undefined), 850);
      return () => { clearTimeout(timer); revealRiver(undefined); };
    }
  }, [h?.board.length, h?.id, table?.id]);
  const legal = h?.legal, me = h?.players.find(p => p.id === userId);
  useEffect(() => { openRaise(false); showHistory(false); setRaise(String(Math.min(legal?.minTo ?? 0, legal?.maxTo ?? 0))); }, [table?.id, h?.id, h?.turn, legal?.minTo, legal?.maxTo]);
  if (!h) return <Text style={st.text}>Préparation des tables…</Text>;
  const money = (n: number) => units ? `${(n / h.bb).toFixed(1)} BB` : n.toLocaleString('fr-FR');
  const min = Math.min(legal?.minTo ?? 0, legal?.maxTo ?? 0), max = legal?.maxTo ?? 0;
  const valid = Number.isSafeInteger(Number(raise)) && Number(raise) >= min && Number(raise) <= max;
  const compact = height < 740;
  const boardSize = Math.min(width < 350 ? 34 : width < 500 ? 43 : 59, (width - 64) / 5.6);
  const seatSize = width < 360 ? 28 : width < 500 ? 32 : 40;
  const tableHeight = Math.max(310, height - (compact ? 270 : 290));
  const coords = [[50, 6], [82, 19], [85, 48], [81, 69], [50, 84], [19, 69], [15, 48], [18, 19]];
  const odds = h.allIn?.streets?.at(-1)?.odds ?? h.allIn?.odds ?? [];
  const seconds = Math.max(0, Math.ceil((table.deadline - now) / 1000));
  const pot = h.stage === 'done' ? h.pots.reduce((n, p) => n + p.amount, 0) : h.players.reduce((n, p) => n + (p.total ?? 0), 0);
  const act = (type: string, n?: number) => { showHistory(false); void play(type, n); };
  const actionButton = (label: string, fn: () => void, primary = false, disabled = false) => <Pressable accessibilityRole="button" disabled={busy || disabled} onPress={fn} style={[st.action, primary && { backgroundColor: gold }, (busy || disabled) && { opacity: .4 }]}><Text numberOfLines={1} style={[st.actionText, primary && { color: '#172820' }]}>{label}</Text></Pressable>;
  return <View style={{ flex: 1, width: '100%', maxWidth: 940, alignSelf: 'center' }}>
    <View style={st.toolbar}>
      <Pressable accessibilityRole="button" onPress={() => showHistory(true)} style={st.touch}><Text style={st.dim}>☷ Historique</Text></Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', gap: 10 }}>
        {game.tables.map((t, i) => <Pressable accessibilityRole="button" key={t.id} onPress={() => select(i)} style={st.touch}><Text style={{ color: t.id === table.id ? gold : muted, fontSize: 11 }}>Table {i + 1} · {t.players.length}{i === own ? ' · Vous' : ''}</Text></Pressable>)}
      </ScrollView>
      <Pressable onPress={toggleUnits} style={st.touch}><Text style={st.dim}>{units ? 'BB' : 'Jetons'}</Text></Pressable>
    </View>
    <View style={{ flex: 1, minHeight: tableHeight, maxHeight: 740 }}>
      <View style={[st.felt, { backgroundColor: felt }]}><View style={st.rail} /></View>
      <View style={[st.board, compact && { top: '29%' }]}>
        <Text style={st.eyebrow}>STACKORA</Text>
        <Text style={st.dim}>#{h.id} · {h.sb}/{h.bb}</Text>
        <Text style={st.pot}>◉ {money(pot)}</Text>
        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: width - 40 }}>
          {Array.from({ length: Math.max(5, h.board.length) }, (_, i) => <Card key={`${table.id}-${h.id}-${i}`} code={h.board[i]} size={h.board.length > 5 ? boardSize * .75 : boardSize} />)}
        </View>
        {h.stage === 'runout' && <Text style={[st.eyebrow, { marginTop: 5 }]}>{game.variant === 'redRiver' ? 'TAPIS PAYÉ · ÉQUITÉ HOLD’EM 5 CARTES' : 'TAPIS PAYÉ · ÉQUITÉ EXACTE'}</Text>}
        {game.variant === 'ghost' && <Text style={st.dim}>Ghost pot · {money(h.ghostPot)} {h.ghostCards.map(c => c[0] + suit[c[1]]).join(' ')}</Text>}
      </View>
      {h.players.map(p => {
        const isMe = p.id === userId, active = p.id === h.turn;
        const position = me ? (p.seat - me.seat + 12) % 8 : p.seat;
        const [x, normalY] = coords[position];
        const y = compact && (position === 2 || position === 6) ? 37 : normalY;
        const won = h.stage === 'done' && h.pots.some(pot => pot.winners.includes(p.id));
        const equity = odds.find(o => o.id === p.id);
        return <View key={p.id} style={[st.seat, { left: `${x}%`, ...(isMe ? { bottom: 2 } : { top: `${y}%` }), opacity: p.folded ? .45 : 1, width: isMe ? 128 : 100, marginLeft: isMe ? -64 : -50 }]}>
          <ChipFlight bet={p.bet ?? 0} won={won} dx={(50-x)/100*Math.min(width,940)} dy={(40-y)/100*tableHeight} />
          <View style={[st.nameplate, (active || won) && { borderColor: gold, backgroundColor: '#314A35', boxShadow: '0 0 15px #E4BA7040' }]}>
            <Text numberOfLines={1} style={st.name}>{h.button === p.seat ? 'Ⓓ ' : ''}{isMe ? 'Vous' : p.name}{won ? ' ★' : ''}</Text>
            <Text style={st.stack}>{money(p.stack)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
            {(p.cards?.length ? p.cards : ['', '']).map((c, i) => <Card key={`${h.id}-${i}`} code={c || undefined} size={isMe ? (compact ? 43 : 51) : compact && !c ? 20 : seatSize} />)}
          </View>
          {equity && !p.folded ? <Text style={st.equity}>{equity.percent.toFixed(1)} %</Text> : <Text numberOfLines={1} style={st.status}>{active ? `${seconds} s` : p.stack === 0 && !p.folded ? 'TAPIS' : p.lastAction || ' '}{p.bet ? ` · ◉ ${money(p.bet)}` : ''}</Text>}
        </View>;
      })}
    </View>
    <View style={st.dock}>
      {legal ? <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={st.dim}>À vous de jouer</Text><Text style={{ color: seconds < 6 ? '#FF8E8E' : gold, fontSize: 12 }}>{seconds} s</Text></View>
        <View style={st.timer}><View style={{ height: 3, width: `${Math.min(100, seconds / game.decisionSeconds * 100)}%`, backgroundColor: seconds < 6 ? '#FF8E8E' : gold }} /></View>
        <View style={st.row}>
          {actionButton('Passer', () => act('fold'))}
          {actionButton(legal.canCheck ? 'Parole' : `Suivre ${money(legal.call)}`, () => act(legal.canCheck ? 'check' : 'call'), true)}
          {legal.canRaise && actionButton(raiseOpen ? 'Fermer' : legal.canCheck && !me?.bet ? 'Miser' : 'Relancer', () => openRaise(!raiseOpen))}
        </View>
        {raiseOpen && legal.canRaise && <View style={st.raiseSheet}>
          <View style={[st.row, { justifyContent: 'space-between' }]}><Text style={st.dim}>Total · {money(min)} à {money(max)}</Text><TextInput accessibilityLabel="Montant total" keyboardType="number-pad" value={raise} onChangeText={setRaise} style={st.input} /></View>
          <Text style={st.dim}>À ajouter : {money(Math.max(0, Number(raise) - (me?.bet ?? 0)) || 0)}</Text>
          <Slider min={min} max={max} value={Number(raise) || min} change={n => setRaise(String(n))} />
          <View style={st.row}>{[1/3, .5, .75, 1].map((f, i) => <Pressable accessibilityRole="button" key={f} style={st.preset} onPress={() => setRaise(String(Math.min(max, Math.max(min, (me?.bet ?? 0) + legal.call + Math.floor((pot + legal.call) * f)))))}><Text style={st.dim}>{['⅓', '½', '¾', 'Pot'][i]}</Text></Pressable>)}<Pressable accessibilityRole="button" style={st.preset} onPress={() => setRaise(String(max))}><Text style={{ color: gold }}>Tapis</Text></Pressable></View>
          {actionButton(`Confirmer · ${money(Number(raise) || 0)}`, () => { openRaise(false); act('raise', Number(raise)); }, true, !valid)}
        </View>}
      </> : h.stage === 'done' ? <>
        <Text style={[st.actionText, { color: gold }]}>{h.bonus.length ? `★ PRIME 7/2 · ${money(h.bonus.reduce((n,b) => n+b.amount, 0))}` : h.revealed?.length ? '7 / 2 · MAIN RÉVÉLÉE' : 'MAIN TERMINÉE'}</Text>
        <Text numberOfLines={2} style={st.dim}>{h.pots.map(p => `${money(p.amount)} → ${p.ghost ? 'Ghost' : p.winners.map(id => h.players.find(q => q.id === id)?.name).join(' / ')}`).join(' · ')}</Text>
      </> : <Text style={[st.dim, { textAlign: 'center', padding: 12 }]}>{h.stage === 'runout' ? 'Les cartes décident. Révélation synchronisée…' : `${h.players.find(p => p.id === h.turn)?.name ?? 'La table'} réfléchit…`}</Text>}
    </View>
    {history && <View style={st.drawerLayer}>
      <Pressable accessibilityLabel="Fermer l’historique" onPress={() => showHistory(false)} style={StyleSheet.absoluteFill} />
      <History close={() => showHistory(false)} lines={[...game.events.map(e => `${new Date(e.at).toLocaleTimeString('fr-FR')} · ${e.text}`), ...h.log, ...h.pots.map((p, i) => `Pot ${i+1} · ${money(p.amount)} → ${p.ghost ? 'Ghost' : p.winners.map(id => h.players.find(q => q.id === id)?.name).join(' / ')}`), ...h.bonus.map(b => `Prime 7/2 · ${h.players.find(p => p.id === b.from)?.name} → ${h.players.find(p => p.id === b.to)?.name} · ${money(b.amount)}`)]} />
    </View>}
    {revealedRiver && <River deadline={now} now={now} code={revealedRiver} size={Math.min(width * .75, (height - 230) * .7, 390)} />}
    {h.presentation?.river && h.presentation.nextAt && <River key={`${h.id}-${h.presentation.count}`} deadline={h.presentation.nextAt} now={now} size={Math.min(width * .75, (height - 230) * .7, 390)} />}
  </View>;
}
function History({ close, lines }: { close: () => void; lines: string[] }) {
  const slide = useRef(new Animated.Value(-320)).current;
  useEffect(() => { Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }).start(); }, [slide]);
  return <Animated.View style={[st.drawer, { transform: [{ translateX: slide }] }]}><View style={[st.row, { justifyContent: 'space-between' }]}><Text style={st.eyebrow}>HISTORIQUE</Text><Pressable accessibilityRole="button" onPress={close} style={st.touch}><Text style={st.text}>Fermer ×</Text></Pressable></View><ScrollView>{lines.map((line, i) => <Text key={i} style={[st.dim, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#2D4338' }]}>{line}</Text>)}</ScrollView></Animated.View>;
}
const st = StyleSheet.create({
  text: { color: white, fontSize: 14 }, dim: { color: muted, fontSize: 11, lineHeight: 17 }, eyebrow: { color: gold, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  toolbar: { flexDirection: 'row', gap: 8, paddingHorizontal: 8, alignItems: 'center', height: 42 }, touch: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  felt: { position: 'absolute', left: '8%', right: '8%', top: 22, bottom: 36, borderRadius: 220, borderWidth: 9, borderColor: '#25382D', boxShadow: '0 15px 45px #00000090' },
  rail: { position: 'absolute', inset: 8, borderWidth: 1, borderColor: '#D8AF6045', borderRadius: 210 },
  board: { position: 'absolute', top: '27%', left: 0, right: 0, alignItems: 'center', gap: 5 }, pot: { color: white, fontWeight: '800', fontSize: 21, marginBottom: 5 },
  card: { borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 6px #00000050' },
  seat: { position: 'absolute', alignItems: 'center', marginTop: -17 }, nameplate: { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: '#10251F', borderRadius: 10, borderWidth: 1, borderColor: '#52705B', alignItems: 'center', minWidth: 74, maxWidth: 100 }, name: { color: white, fontWeight: '600', fontSize: 11 }, stack: { color: gold, fontSize: 12, fontWeight: '800' }, status: { color: muted, fontSize: 9, lineHeight: 16 }, equity: { color: gold, backgroundColor: '#0B1F19', paddingHorizontal: 6, borderRadius: 6, fontWeight: '800', fontSize: 11 },
  dock: { padding: 10, gap: 6, backgroundColor: '#111F1A', borderTopWidth: 1, borderColor: '#395242', minHeight: 80 }, row: { flexDirection: 'row', gap: 6, alignItems: 'center' }, action: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: '#263C30', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }, actionText: { color: white, fontSize: 13, fontWeight: '700' }, timer: { height: 3, backgroundColor: '#304337', borderRadius: 4, overflow: 'hidden' },
  raiseSheet: { position: 'absolute', bottom: 185, left: 8, right: 8, padding: 12, gap: 7, borderWidth: 1, borderColor: '#6B7955', borderRadius: 14, backgroundColor: '#15291F', boxShadow: '0 -6px 30px #00000070', zIndex: 20 }, input: { color: white, fontSize: 16, padding: 8, minHeight: 44, width: 100, borderWidth: 1, borderColor: '#667C60', borderRadius: 8 }, preset: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#263C30', borderRadius: 8 },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#060D0AEE', zIndex: 40, alignItems: 'center', justifyContent: 'center' }, drawerLayer: { ...StyleSheet.absoluteFillObject, bottom: 105, backgroundColor: '#00000070', zIndex: 30 }, drawer: { width: '84%', maxWidth: 340, height: '100%', padding: 16, backgroundColor: '#15271E', borderRightWidth: 1, borderColor: gold },
});
