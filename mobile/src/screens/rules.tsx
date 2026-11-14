import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { color, font, radius, space, type } from "../theme";
import { durable } from "../storage";
import { haptic } from "../feedback";
import { Button, FadeIn, Icon, ProgressBar, Row, Segmented, SectionHeader, Surface, T, Tap, type IconName } from "../ui";
import { PlayingCard } from "../poker/cards";
import { best, compareScores, describe } from "../poker/evaluate";
import { DUELS, HAND_RANKS, HOLDEM, VARIANTS, type Block, type Chapter, type Example } from "../data/rules";
import { Screen } from "./shell";

const KEY = "stackora-rules-read";
function useRead() {
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    void durable.get(KEY).then((v) => v && setRead(JSON.parse(v)));
  }, []);
  const mark = (id: string) =>
    setRead((r) => {
      if (r.includes(id)) return r;
      const next = [...r, id];
      void durable.set(KEY, JSON.stringify(next));
      return next;
    });
  return { read, mark };
}

function Cards({ cards, size = 44 }: { cards: string[]; size?: number }) {
  return <Row gap={4} wrap>{cards.map((c) => <PlayingCard key={c} code={c} size={size} />)}</Row>;
}
function BlockView({ b }: { b: Block }) {
  if (b.kind === "text") return <T v="body" style={{ color: color.textSoft }}>{b.body}</T>;
  if (b.kind === "tip")
    return (
      <Row gap={10} style={st.tip}>
        <Icon name="bulb-outline" size={18} tint={color.gold} />
        <T v="callout" style={{ flex: 1, color: color.textSoft, fontFamily: font.regular, lineHeight: 20 }}>{b.body}</T>
      </Row>
    );
  if (b.kind === "cards")
    return (
      <Surface style={{ gap: 10, alignItems: "center" }}>
        <Cards cards={b.cards} />
        {b.board && <><T v="caption">Board</T><Cards cards={b.board} size={36} /></>}
        <T v="caption" center>{b.caption}</T>
      </Surface>
    );
  return (
    <View style={{ gap: 2 }}>
      {b.items.map((it, i) => (
        <Row key={i} gap={12} style={{ alignItems: "flex-start", paddingVertical: 8 }}>
          <View style={st.stepNum}><Text style={st.stepNumText}>{i + 1}</Text></View>
          <View style={{ flex: 1, gap: 3 }}>
            <T v="callout">{it.title}</T>
            <T v="caption" style={{ fontSize: 13.5, lineHeight: 19 }}>{it.body}</T>
          </View>
        </Row>
      ))}
    </View>
  );
}
function Examples({ examples }: { examples: Example[] }) {
  const [i, setI] = useState(0);
  if (!examples.length) return null;
  const e = examples[i % examples.length];
  return (
    <Surface tone="felt" style={{ gap: space.sm }}>
      <Row between>
        <T v="eyebrow">Exemple {(i % examples.length) + 1} / {examples.length}</T>
        <T v="caption">{e.title}</T>
      </Row>
      {e.hero && <><T v="caption">Votre main</T><Cards cards={e.hero} size={50} /></>}
      {e.board && <><T v="caption">Board</T><Cards cards={e.board} size={38} /></>}
      <T v="body" style={{ color: "#D6E3DC" }}>{e.body}</T>
      {examples.length > 1 && <Button size="md" kind="secondary" title="Exemple suivant" icon="arrow-forward" onPress={() => setI(i + 1)} />}
    </Surface>
  );
}

function Reader({ chapter, index, total, onDone, onBack, read }: { chapter: Chapter; index: number; total: number; onDone: () => void; onBack: () => void; read: boolean }) {
  return (
    <Screen title={chapter.title} eyebrow={`Chapitre ${index + 1} / ${total}`} back={onBack}>
      <ProgressBar value={(index + 1) / total} height={4} />
      <T v="callout" style={{ color: color.gold }}>{chapter.summary}</T>
      {chapter.blocks.map((b, i) => <FadeIn key={`${chapter.id}-${i}`} delay={i * 40}><BlockView b={b} /></FadeIn>)}
      {chapter.examples && <Examples examples={chapter.examples} />}
      <Button kind="gold" icon={read ? "checkmark-done" : "checkmark"} title={index + 1 < total ? (read ? "Chapitre suivant" : "Compris · chapitre suivant") : "Compris"} onPress={onDone} />
    </Screen>
  );
}

function HandRanking() {
  return (
    <View style={{ gap: space.sm }}>
      {HAND_RANKS.map((h, i) => (
        <FadeIn key={h.name} delay={i * 30}>
          <Surface style={{ gap: 10 }}>
            <Row gap={10}>
              <View style={st.rank}><Text style={st.rankText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <T v="headline">{h.name}</T>
                <T v="caption">{h.body}</T>
              </View>
            </Row>
            <Cards cards={h.cards} size={42} />
          </Surface>
        </FadeIn>
      ))}
    </View>
  );
}

/** Comparateur : le joueur devine, l'évaluateur tranche et explique. */
function Comparator() {
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState<"a" | "b" | "tie" | null>(null);
  const d = DUELS[i % DUELS.length];
  const sa = best([...d.a, ...d.board])!, sb = best([...d.b, ...d.board])!;
  const cmp = compareScores(sa, sb);
  const answer = cmp > 0 ? "a" : cmp < 0 ? "b" : "tie";
  const right = guess === answer;
  const pick = (g: "a" | "b" | "tie") => {
    if (guess) return;
    setGuess(g);
    haptic(g === answer ? "success" : "warning");
  };
  const hand = (k: "a" | "b", cards: string[], s: typeof sa) => (
    <Tap onPress={() => pick(k)} label={`Main ${k === "a" ? "A" : "B"}`} style={[st.duelHand, guess && answer === k && { borderColor: color.success, backgroundColor: color.successTint }, guess === k && answer !== k && { borderColor: color.danger }]}>
      <T v="eyebrow" style={{ color: color.muted }}>Main {k === "a" ? "A" : "B"}</T>
      <Cards cards={cards} size={46} />
      {guess && <T v="caption" center>{describe(s)}</T>}
    </Tap>
  );
  return (
    <Surface style={{ gap: space.md }}>
      <T v="headline">Qui gagne ?</T>
      <View style={{ gap: 6 }}>
        <T v="caption">Board commun</T>
        <Cards cards={d.board} size={40} />
      </View>
      <Row gap={space.sm} style={{ alignItems: "stretch" }}>
        {hand("a", d.a, sa)}
        {hand("b", d.b, sb)}
      </Row>
      {!guess ? (
        <Button size="md" kind="secondary" title="Égalité" onPress={() => pick("tie")} />
      ) : (
        <View style={{ gap: 8 }}>
          <Row gap={8}>
            <Icon name={right ? "checkmark-circle" : "close-circle"} size={20} tint={right ? color.success : color.danger} />
            <T v="headline" tint={right ? color.success : color.danger}>{right ? "Bien vu" : "Pas tout à fait"}</T>
          </Row>
          <T v="body">{answer === "tie" ? "Partage : les deux meilleures mains sont identiques." : `La main ${answer === "a" ? "A" : "B"} gagne. `}{d.note}</T>
          <Button size="md" kind="gold" title="Exemple suivant" icon="arrow-forward" onPress={() => { setGuess(null); setI(i + 1); }} />
        </View>
      )}
    </Surface>
  );
}

export function RulesScreen() {
  const [tab, setTab] = useState<"holdem" | "hands" | "variants">("holdem");
  const [open, setOpen] = useState<number | null>(null);
  const [variant, setVariant] = useState(VARIANTS[1].id);
  const { read, mark } = useRead();
  if (open !== null) {
    const ch = HOLDEM[open];
    return (
      <Reader
        chapter={ch}
        index={open}
        total={HOLDEM.length}
        read={read.includes(ch.id)}
        onBack={() => setOpen(null)}
        onDone={() => {
          mark(ch.id);
          haptic("success");
          setOpen(open + 1 < HOLDEM.length ? open + 1 : null);
        }}
      />
    );
  }
  const done = HOLDEM.filter((c) => read.includes(c.id)).length;
  const v = VARIANTS.find((x) => x.id === variant)!;
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T v="eyebrow">Règles</T>
        <T v="title">Apprendre à jouer</T>
      </View>
      <Segmented label="Section" value={tab} onChange={setTab} options={[{ value: "holdem", label: "Hold'em" }, { value: "hands", label: "Mains" }, { value: "variants", label: "Variantes" }]} />
      {tab === "holdem" && (
        <>
          <Surface style={{ gap: 8 }}>
            <Row between><T v="callout">Progression de lecture</T><T v="caption">{done} / {HOLDEM.length}</T></Row>
            <ProgressBar value={done / HOLDEM.length} />
            <Button size="md" kind={done ? "secondary" : "gold"} title={done === 0 ? "Commencer" : done === HOLDEM.length ? "Relire depuis le début" : "Continuer"} onPress={() => setOpen(done === HOLDEM.length ? 0 : Math.max(0, HOLDEM.findIndex((c) => !read.includes(c.id))))} />
          </Surface>
          {HOLDEM.map((c, i) => (
            <Surface key={c.id} onPress={() => setOpen(i)} label={c.title} padded={false}>
              <Row gap={space.md} style={{ padding: space.md }}>
                <View style={[st.chIcon, read.includes(c.id) && { backgroundColor: color.successTint }]}>
                  <Icon name={read.includes(c.id) ? "checkmark" : (c.icon as IconName)} size={19} tint={read.includes(c.id) ? color.success : color.gold} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="headline" style={{ fontSize: 16 }}>{c.title}</T>
                  <T v="caption">{c.summary}</T>
                </View>
                <Icon name="chevron-forward" size={18} tint={color.faint} />
              </Row>
            </Surface>
          ))}
        </>
      )}
      {tab === "hands" && (
        <>
          <Comparator />
          <SectionHeader title="Classement des mains" eyebrow="De la plus forte à la plus faible" />
          <HandRanking />
        </>
      )}
      {tab === "variants" && (
        <>
          <Row gap={8} wrap>
            {VARIANTS.map((x) => (
              <Tap key={x.id} onPress={() => setVariant(x.id)} feedback="select" label={x.name} style={[st.variantTab, variant === x.id && { borderColor: color.gold, backgroundColor: color.goldTint }]}>
                <Text style={{ fontFamily: font.display, fontSize: 16, color: color.gold }}>{x.symbol}</Text>
                <Text style={[type.callout, { fontSize: 13 }]}>{x.name}</Text>
              </Tap>
            ))}
          </Row>
          <FadeIn key={v.id} style={{ gap: space.md }}>
            <View style={{ gap: 4 }}>
              <T v="title" style={{ fontSize: 24 }}>{v.name}</T>
              <T v="callout" tint={color.gold}>{v.tagline}</T>
            </View>
            {v.blocks.map((b, i) => <BlockView key={i} b={b} />)}
            <Examples examples={v.examples} />
            <T v="caption">Ces règles décrivent exactement le fonctionnement du moteur STACKORA. Les variantes sont des règles maison.</T>
          </FadeIn>
        </>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  tip: { alignItems: "flex-start", backgroundColor: color.goldTint, borderRadius: radius.md, padding: space.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { fontFamily: font.semibold, fontSize: 12.5, color: color.gold },
  chIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: color.goldTint, alignItems: "center", justifyContent: "center" },
  rank: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.surface3, alignItems: "center", justifyContent: "center" },
  rankText: { fontFamily: font.display, fontSize: 16, color: color.gold },
  duelHand: { flex: 1, alignItems: "center", gap: 8, padding: space.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: color.hairlineStrong, backgroundColor: color.surface2 },
  variantTab: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 42, borderRadius: radius.pill, borderWidth: 1, borderColor: color.hairlineStrong, backgroundColor: color.surface },
});
