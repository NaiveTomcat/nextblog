---
title: AIME卡号计算器
date: 2026-06-10 20:00:00
permalink: /pages/aimecalc/
sidebar: false
category:
  - 工具
tag:
  - 杂项
  - 工具
---

## 前言

我们都知道，SEGA的Classical Aime卡片是以Mifare Classic技术为基础的，其Access Code有内在校验规则。参考[这里](https://blog.sparrowhe.top/2025/10/13/arcade-game-card-part1/)。

本工具旨在通过明文Serial计算此种卡片以0103 6开头的20位合法Access Code。

此页面即是一个简单的计算器，用来通过明文`Serial`计算20位Access Code.

## 计算器

<div style="display:grid; grid-template-columns:auto auto 1fr; gap:4px 0; align-items:center">
  <label for="serial-input">Serial（8位数字）</label>
  <span>：</span>
  <input
    id="serial-input"
    v-model.lazy="serialInput"
    type="text"
    maxlength="8"
    placeholder="12345678"
    @change="calculate"
    style="all:unset; font-family:monospace; font-size:inherit; width:10ch; justify-self:start; cursor:text; padding:0.1em 0.4em"
  />
  <span>Access Code</span>
  <span>：</span>
  <code style="font-family:monospace; font-size:inherit; justify-self:start">{{ accessCode || '____________________' }}</code>
  <span v-if="error" style="color:#e74c3c; grid-column:3">{{ error }}</span>
</div>

<script setup lang="ts">
import { ref } from "vue";
import md5 from "md5";

const PREFIX = "01036";
const KEY = "A1B3E86CF02974D5";

const serialInput = ref("");
const accessCode = ref("");
const error = ref("");

function getSerial(): string {
  // read from input element directly when called from button click
  const el = document.getElementById("serial-input") as HTMLInputElement | null;
  return el ? el.value : serialInput.value;
}

function computeDigest(serial: number, key: string): string {
  const serialStr = String(serial).padStart(8, "0");
  const md5hex = md5(serialStr);
  const realDigest: number[] = [];
  for (let i = 0; i < md5hex.length; i += 2) {
    realDigest.push(parseInt(md5hex.substring(i, i + 2), 16));
  }
  const digestBytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    digestBytes.push(realDigest[parseInt(key[i], 16)]);
  }
  let bitstring = digestBytes
    .map((b) => b.toString(2).padStart(8, "0").split("").reverse().join(""))
    .join("")
    .split("")
    .reverse()
    .join("");
  bitstring = bitstring.padStart(6 * 23, "0");
  let computed = 0;
  while (bitstring.length > 0) {
    const work = parseInt(bitstring.substring(0, 23), 2);
    computed ^= work;
    bitstring = bitstring.substring(23);
  }
  return String(computed).padStart(7, "0");
}

function char2num(c: string): number {
  return c.charCodeAt(0) - "0".charCodeAt(0) + 1;
}

function num2char(num: number): string {
  while (num < 1) num += 10;
  return String.fromCharCode(((num - 1) % 10) + "0".charCodeAt(0));
}

class MiniSolitaire {
  static DECK_SIZE = 22;
  static JOKER_A = 21;
  static JOKER_B = 22;
  deck: number[] = [];

  initDeck(): void {
    this.deck = Array.from({ length: MiniSolitaire.DECK_SIZE }, (_, i) => i + 1);
  }

  moveCard(card: number): void {
    const p = this.deck.indexOf(card);
    if (p < MiniSolitaire.DECK_SIZE - 1) {
      [this.deck[p], this.deck[p + 1]] = [this.deck[p + 1], this.deck[p]];
    } else {
      this.deck.pop();
      this.deck.splice(1, 0, card);
    }
  }

  cutDeck(point: number): void {
    const tmp = this.deck.slice(point, -1).concat(this.deck.slice(0, point));
    this.deck = tmp.concat([this.deck[this.deck.length - 1]]);
  }

  swapOutsideJoker(): void {
    let j1 = this.deck.indexOf(MiniSolitaire.JOKER_A);
    let j2 = this.deck.indexOf(MiniSolitaire.JOKER_B);
    if (j1 > j2) [j1, j2] = [j2, j1];
    this.deck = this.deck
      .slice(j2 + 1)
      .concat([this.deck[j1]])
      .concat(this.deck.slice(j1 + 1, j2))
      .concat([this.deck[j2]])
      .concat(this.deck.slice(0, j1));
  }

  cutByBottomCard(): void {
    let p = this.deck[this.deck.length - 1];
    if (p === MiniSolitaire.JOKER_B) p = MiniSolitaire.JOKER_A;
    this.cutDeck(p);
  }

  getTopCardNum(): number {
    let p = this.deck[0];
    if (p === MiniSolitaire.JOKER_B) p = MiniSolitaire.JOKER_A;
    return this.deck[p];
  }

  deckHash(): number {
    while (true) {
      this.moveCard(MiniSolitaire.JOKER_A);
      this.moveCard(MiniSolitaire.JOKER_B);
      this.moveCard(MiniSolitaire.JOKER_B);
      this.swapOutsideJoker();
      this.cutByBottomCard();
      const p = this.getTopCardNum();
      if (p !== MiniSolitaire.JOKER_A && p !== MiniSolitaire.JOKER_B) return p;
    }
  }

  createDeck(key: string): void {
    this.initDeck();
    for (const ch of key) {
      this.deckHash();
      this.cutDeck(char2num(ch));
    }
  }

  encode(key: string, plaintext: string): string {
    this.createDeck(key);
    let ciphertext = "";
    for (const ch of plaintext) {
      this.deckHash();
      const p = this.getTopCardNum();
      ciphertext += num2char(char2num(ch) + p);
    }
    return ciphertext;
  }
}

function calculate(): void {
  error.value = "";
  accessCode.value = "";

  const raw = getSerial().trim();
  if (!raw) return;

  if (!/^\d{1,8}$/.test(raw)) {
    error.value = "请输入1-8位数字。";
    return;
  }

  const serialNum = parseInt(raw, 10);
  const serialStr = String(serialNum).padStart(8, "0");
  const d = computeDigest(serialNum, KEY);
  const cipher = new MiniSolitaire().encode(d, serialStr);
  accessCode.value = PREFIX + cipher + d;
}

function randomSerial(): void {
  const rand = Math.floor(Math.random() * 100000000);
  const val = String(rand).padStart(8, "0");
  const el = document.getElementById("serial-input") as HTMLInputElement | null;
  if (el) el.value = val;
  serialInput.value = val;
  calculate();
}
</script>