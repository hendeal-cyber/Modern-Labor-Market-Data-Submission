// Original Tipsy Kart circuits. Each circuit is a closed spline through
// control points [x, z, y]. Travel direction is point 0 -> point 1 and the
// start/finish line sits at point 0.
//
// Feature positions use `at` = fraction of the lap (0..1) and `d` = lateral
// offset from the centre line (negative = left, positive = right).

export const TRACKS = [
  {
    id: 'hoppy-hills',
    name: 'Hoppy Hills',
    blurb: 'Rolling farmland, hay bales and a long downhill sweeper.',
    halfWidth: 9.5,
    shoulder: 5,
    bank: 1.0,
    points: [
      [0, -120, 0], [70, -124, 0], [140, -108, 2], [178, -60, 5], [168, -8, 7],
      [120, 12, 6], [86, 46, 4], [96, 96, 5], [68, 144, 8], [10, 160, 10],
      [-60, 146, 9], [-112, 104, 6], [-118, 50, 3], [-150, 4, 2], [-150, -64, 1],
      [-108, -108, 0], [-56, -122, 0],
    ],
    boostPads: [{ at: 0.205, d: 0 }, { at: 0.47, d: -4 }, { at: 0.47, d: 4 }, { at: 0.83, d: 0 }],
    itemRows: [0.1, 0.4, 0.66, 0.9],
    mud: [{ at0: 0.56, at1: 0.6, d0: 1, d1: 9.5 }, { at0: 0.3, at1: 0.33, d0: -9.5, d1: -3 }],
    noWall: [],
    theme: {
      sky: [0x8fd3ff, 0xfff1c9], fog: 0xcfe9ff, fogNear: 120, fogFar: 420,
      ground: 0x6fbf4a, groundAlt: 0x5aa83b, road: 0x4a4a55, roadAlt: 0x55555f, line: 0xfff3c4,
      shoulder: 0x8fcf55, curbA: 0xe8463a, curbB: 0xffffff, wallA: 0xffffff, wallB: 0xd8483b,
      skirt: 0x7a5534, mud: 0x6b4423, sun: 0xfff2d5, hemiSky: 0xcfefff, hemiGround: 0x4f7a2a,
      scenery: 'farm',
    },
  },
  {
    id: 'neon-nightcap',
    name: 'Neon Nightcap',
    blurb: 'Downtown after midnight: tight corners under glowing signs.',
    halfWidth: 9,
    shoulder: 4,
    bank: 0.6,
    points: [
      [0, 0, 0], [80, 0, 0], [130, -8, 0], [152, -50, 0], [150, -110, 2], [120, -150, 4],
      [60, -150, 4], [34, -120, 3], [10, -96, 2], [-30, -110, 2], [-66, -150, 3], [-120, -150, 2],
      [-156, -112, 1], [-156, -50, 0], [-130, -6, 0], [-70, 0, 0],
    ],
    boostPads: [{ at: 0.04, d: 0 }, { at: 0.5, d: 0 }, { at: 0.76, d: -3 }, { at: 0.76, d: 3 }],
    itemRows: [0.16, 0.42, 0.62, 0.88],
    mud: [{ at0: 0.36, at1: 0.4, d0: -9, d1: -2 }],
    noWall: [],
    theme: {
      sky: [0x0b0624, 0x3a1257], fog: 0x1a0b33, fogNear: 90, fogFar: 360,
      ground: 0x1c1830, groundAlt: 0x242040, road: 0x2a2a3a, roadAlt: 0x323246, line: 0x3cf0ff,
      shoulder: 0x3a2f5c, curbA: 0xff3cc8, curbB: 0x3cf0ff, wallA: 0xff3cc8, wallB: 0x3c5cff,
      skirt: 0x221a3a, mud: 0x2b5a3a, sun: 0xb7a6ff, hemiSky: 0x7a5cff, hemiGround: 0x20122e,
      scenery: 'city', night: true,
    },
  },
  {
    id: 'frosty-pint-pass',
    name: 'Frosty Pint Pass',
    blurb: 'A snowy mountain climb with an open ridge - mind the drop!',
    halfWidth: 9.5,
    shoulder: 4.5,
    bank: 1.1,
    points: [
      [0, 0, 2], [70, -10, 4], [130, -40, 9], [150, -100, 14], [120, -160, 18], [50, -180, 20],
      [-10, -150, 20], [-30, -90, 17], [-80, -60, 14], [-150, -80, 12], [-190, -30, 10],
      [-170, 40, 7], [-110, 70, 5], [-50, 50, 3],
    ],
    boostPads: [{ at: 0.12, d: 0 }, { at: 0.44, d: 3 }, { at: 0.72, d: -3 }],
    itemRows: [0.06, 0.32, 0.58, 0.84],
    mud: [{ at0: 0.62, at1: 0.66, d0: -9.5, d1: -2 }],
    noWall: [{ at0: 0.37, at1: 0.47, side: 'both' }],
    theme: {
      sky: [0xb5d3f0, 0xf4f8ff], fog: 0xe3eef9, fogNear: 100, fogFar: 380,
      ground: 0xeef4fb, groundAlt: 0xdde8f4, road: 0x5a6070, roadAlt: 0x646a7a, line: 0xffffff,
      shoulder: 0xf6fbff, curbA: 0x2e7dd6, curbB: 0xffffff, wallA: 0xffffff, wallB: 0x2e7dd6,
      skirt: 0x7d8696, mud: 0x9fc4e6, sun: 0xffffff, hemiSky: 0xe8f2ff, hemiGround: 0x9aaabd,
      scenery: 'snow',
    },
  },
  {
    id: 'lime-lagoon',
    name: 'Lime Lagoon',
    blurb: 'Sun, sand and palm trees around a turquoise bay.',
    halfWidth: 10,
    shoulder: 5,
    bank: 0.9,
    points: [
      [0, 0, 0], [60, 20, 0], [120, 10, 1], [170, -30, 2], [180, -90, 3], [140, -130, 2],
      [80, -120, 1], [40, -150, 1], [-20, -170, 2], [-90, -150, 3], [-130, -100, 4],
      [-120, -40, 3], [-150, 10, 2], [-120, 50, 1], [-60, 40, 0],
    ],
    boostPads: [{ at: 0.08, d: 0 }, { at: 0.36, d: -4 }, { at: 0.6, d: 3 }, { at: 0.86, d: 0 }],
    itemRows: [0.18, 0.46, 0.7, 0.94],
    mud: [{ at0: 0.26, at1: 0.3, d0: 2, d1: 10 }, { at0: 0.78, at1: 0.81, d0: -10, d1: -2 }],
    noWall: [],
    theme: {
      sky: [0x5cc8ff, 0xfff6d8], fog: 0xbfeaff, fogNear: 120, fogFar: 420,
      ground: 0xf2dc9b, groundAlt: 0xe8cf86, road: 0x6a5a5a, roadAlt: 0x736262, line: 0xffffff,
      shoulder: 0xf5e2a8, curbA: 0x2fc28a, curbB: 0xfff4c2, wallA: 0xff8a3c, wallB: 0xfff4c2,
      skirt: 0xc9a85e, mud: 0xd6b56a, sun: 0xfff1d0, hemiSky: 0xbff0ff, hemiGround: 0xc9a85e,
      scenery: 'beach', water: 0x2bc4c8,
    },
  },
];
