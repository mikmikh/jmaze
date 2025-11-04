// LOGIC
export const DIRECTIONS = [
  [-1, 0], // up
  [0, 1], // right
  [1, 0], // down
  [0, -1], // left
];

export const DIRECTION_CHARS = ["^", ">", "v", "<"];
export const KEY_CHAR_ARR = Array.from("abcdfghij");
export const LOCK_CHAR_ARR = KEY_CHAR_ARR.map((c) => c.toUpperCase());
export const ITEM_CHAR_ARR = "&!$";
export const LEVEL_CHARS = {
  WALL: "#",
  PATH: ".",
  EMPTY: " ",
  START: "S",
  EXIT: "E",
  ENEMY: "z",
  POTION: "&",
  SWORD: "!",
  MONEY: "$",
};
export const SOLID_TILE_SET = new Set([
  LEVEL_CHARS.EMPTY,
  LEVEL_CHARS.WALL,
  ...LOCK_CHAR_ARR,
]);
export const SPRITE_TILE_SET = new Set([
  LEVEL_CHARS.START,
  LEVEL_CHARS.EXIT,
  LEVEL_CHARS.ENEMY,
  ...ITEM_CHAR_ARR,
  ...LOCK_CHAR_ARR,
  ...KEY_CHAR_ARR,
]);
// RENDER
export const RENDER_CHARS =
  "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,\"^`'.";
// export const RENDER_CHARS = "░▒▓█";

function createLockSprite(letter = "A") {
  return [
    `.███.`, //
    `█...█`, //
    `█████`, //
    `██#██`.replace("#", letter), //
    `█████`, //
  ];
}
function createKeySprite(letter = "A") {
  return [
    `.██..`, //
    `..█..`, //
    `.██..`, //
    `.█#█.`.replace("#", letter), //
    `.███.`, //
  ];
}

export const SPIRTE_PATTERNS = {
  // z: [
  //   [".", ".", ".", ".", "."],//
  //   [".", "█", ".", "█", "."],//
  //   [".", "█", ".", "█", "."],//
  //   [".", ".", ".", ".", "."],//
  //   ["█", "█", ".", "█", "█"],//
  //   [".", "█", "█", "█", "."],//
  //   [".", ".", ".", ".", "."],//
  // ],
  z: [
    ".....", //
    ".█.█.", //
    ".█.█.", //
    ".....", //
    "█...█", //
    ".███.", //
    ".....", //
  ],
  S: [
    `.███.`, //
    `█....`, //
    `.███.`, //
    `....█`, //
    `.███.`, //
  ],
  E: [
    `█████`, //
    `█....`, //
    `█████`, //
    `█....`, //
    `█████`, //
  ],
  // A: [`.███.`, `█...█`, `█████`, `██A██`, `█████`],
  "?": [
    ".███.", //
    "█...█", //
    "...█.", //
    "..█..", //
    "..█..", //
  ],
  "&": [
    `.███.`, //
    `..█..`, //
    `.███.`, //
    `██+██`, //
    `█████`, //
  ],
  $: [
    `..$..`, //
    `..$..`, //
    `$$$$$`, //
    `..$..`, //
    `..$..`, //
  ],
  "!": [
    `..█..`, //
    `..█..`, //
    `..█..`, //
    `.███.`, //
    `..█..`, //
  ],
};

const COLOR_PALETTE = [
  "#fb04ffff", //
  "#00ff11ff", //
  "#00d5ffff", //
  "#fed800ff", //
  "#ff00aeff", //
  "#ff0000ff", //
  "#0015ffff", //
];

export const SPRITE_COLORS = {
  S: "yellow",
  E: "orange",
  "!": "cyan",
  "&": "lime",
  z: "red",
  $: "gold",
};

LOCK_CHAR_ARR.forEach((letter,i) => {
  SPIRTE_PATTERNS[letter] = createLockSprite(letter);
  SPRITE_COLORS[letter] = COLOR_PALETTE[i%COLOR_PALETTE.length];
});
KEY_CHAR_ARR.forEach((letter,i) => {
  SPIRTE_PATTERNS[letter] = createKeySprite(letter);
  SPRITE_COLORS[letter] = COLOR_PALETTE[i%COLOR_PALETTE.length];
});
Object.keys(SPIRTE_PATTERNS).forEach((key) => {
  SPIRTE_PATTERNS[key] = SPIRTE_PATTERNS[key].map((r) =>
    [...r].map((v) => (v === "█" ? "#" : v))
  );
});

export const MINIMAP_COLORS = {
  ...SPRITE_COLORS,
  "#": "white",
  ".": "gray",
};

// export const SHADES = [
// #000000	rgb(0,0,0)
// #080808	rgb(8,8,8)
// #101010	rgb(16,16,16)
// #181818	rgb(24,24,24)
// #202020	rgb(32,32,32)
// #282828	rgb(40,40,40)
// #303030	rgb(48,48,48)
// #383838	rgb(56,56,56)
// #404040	rgb(64,64,64)
// #484848	rgb(72,72,72)
// #505050	rgb(80,80,80)
// #585858	rgb(88,88,88)
// #606060	rgb(96,96,96)
// #686868	rgb(104,104,104)
// #696969	rgb(105,105,105)
// #707070	rgb(112,112,112)
// #787878	rgb(120,120,120)
// #808080	rgb(128,128,128)
// #888888	rgb(136,136,136)
// #909090	rgb(144,144,144)
// #989898	rgb(152,152,152)
// #A0A0A0	rgb(160,160,160)
// #A8A8A8	rgb(168,168,168)
// #A9A9A9	rgb(169,169,169)
// #B0B0B0	rgb(176,176,176)
// #B8B8B8	rgb(184,184,184)
// #BEBEBE	rgb(190,190,190)
// #C0C0C0	rgb(192,192,192)
// #C8C8C8	rgb(200,200,200)
// #D0D0D0	rgb(208,208,208)
// #D3D3D3	rgb(211,211,211)
// #D8D8D8	rgb(216,216,216)
// #DCDCDC	rgb(220,220,220)
// #E0E0E0	rgb(224,224,224)
// #E8E8E8	rgb(232,232,232)
// #F0F0F0	rgb(240,240,240)
// #F5F5F5	rgb(245,245,245)
// #F8F8F8	rgb(248,248,248)
// #FFFFFF	rgb(255,255,255)
// ]