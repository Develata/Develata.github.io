//! Bounded track and conservative reachability validator.
//! Each row always leaves a ground-safe lane. We prove a no-jump/no-duck path;
//! action lanes are optional alternatives, never assumptions in the proof.
use crate::player::{DUCK_SECONDS, JUMP_SECONDS, LANE_SECONDS};

pub const CHUNKS: usize = 8;
pub const LENGTH: f32 = 48.0;
pub const ROWS: [f32; 2] = [12.0, 36.0];
pub const MAX_SPEED: f32 = 22.0;
pub const WINDOW: f32 = 1.15;
pub const REACTION: f32 = 0.32;
pub type Row = [u8; 3];

const PATTERNS: [Row; 10] = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 1],
    [0, 2, 1],
    [1, 3, 0],
    [2, 0, 3],
    [0, 1, 2],
    [3, 1, 0],
];

#[derive(Clone, Debug)]
pub struct Rng(u32);
impl Rng {
    pub fn new(seed: u32) -> Self {
        Self(seed.max(1))
    }
    pub fn next(&mut self) -> u32 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.0 = x;
        x
    }
}

/// Propagate a 3-bit set through one row at the worst-case speed.
/// Time excludes the collision windows, recognition margin, and any previous
/// action's remaining duration. Returns zero for an unreachable/invalid row.
pub fn reachable(previous: u8, row: Row, gap: f32, recovery: f32) -> u8 {
    if row.iter().any(|&kind| kind > 3) || gap < 2.0 * WINDOW {
        return 0;
    }
    let time = (gap - 2.0 * WINDOW) / MAX_SPEED - REACTION - recovery;
    let mut next = 0;
    for from in 0i8..3 {
        if previous & (1 << from) == 0 {
            continue;
        }
        for to in 0i8..3 {
            if row[to as usize] == 0 && (to - from).unsigned_abs() as f32 * LANE_SECONDS <= time {
                next |= 1 << to;
            }
        }
    }
    next
}

#[derive(Clone, Debug)]
pub struct Chunk {
    pub z: f32,
    pub rows: [Row; 2],
    pub coin_lanes: [i8; 2],
    pub collected: [bool; 2],
    pub resolved: [bool; 2],
}
impl Default for Chunk {
    fn default() -> Self {
        Self {
            z: 0.0,
            rows: [[0; 3]; 2],
            coin_lanes: [0; 2],
            collected: [false; 2],
            resolved: [false; 2],
        }
    }
}

pub struct Generator {
    rng: Rng,
    reachable: u8,
}
impl Generator {
    pub fn new(seed: u32) -> Self {
        {
            debug_assert!(action_spacing_valid());
            Self {
                rng: Rng::new(seed),
                reachable: 0b010,
            }
        }
    }
    pub fn chunk(&mut self, z: f32, arrival: f32) -> Chunk {
        let mut chunk = Chunk {
            z,
            ..Chunk::default()
        };
        for row_index in 0..2 {
            let count = if arrival < 10.0 {
                1
            } else if arrival < 24.0 {
                4
            } else {
                PATTERNS.len()
            };
            let mut row = PATTERNS[self.rng.next() as usize % count];
            if arrival < 30.0 && row_index == 1 {
                row = PATTERNS[0];
            }
            // Rows are 24m apart, including across chunk boundaries. At max speed
            // all ground lanes can reach any clear lane with a recognition margin.
            let mut next = reachable(self.reachable, row, 24.0, 0.0);
            if next == 0 {
                row = PATTERNS[0];
                next = reachable(self.reachable, row, 24.0, 0.0);
            }
            debug_assert!(next != 0);
            self.reachable = next;
            let safe = (self.rng.next() % next.count_ones()) as usize;
            chunk.coin_lanes[row_index] =
                (0..3).filter(|i| next & (1 << i) != 0).nth(safe).unwrap() as i8 - 1;
            chunk.rows[row_index] = row;
        }
        chunk
    }
}

/// Conservative action recovery: at max speed the full action has ended before
/// the next row's collision window. Reachability above needs no action at all.
pub fn action_spacing_valid() -> bool {
    (24.0 - 2.0 * WINDOW) / MAX_SPEED > JUMP_SECONDS.max(DUCK_SECONDS)
}
