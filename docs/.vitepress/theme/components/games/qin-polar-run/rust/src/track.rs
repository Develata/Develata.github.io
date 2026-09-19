//! Bounded track and conservative reachability validator.
//! Each row always leaves a ground-safe lane. We prove a no-jump/no-duck path;
//! action lanes are optional alternatives, never assumptions in the proof.
use crate::difficulty::arrival_speed_bound;
use crate::player::{DUCK_SECONDS, JUMP_SECONDS, LANE_SECONDS};

pub const CHUNKS: usize = 8;
pub const LENGTH: f32 = 48.0;
pub const ROWS: [f32; 2] = [12.0, 36.0];
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

/// Propagate a 3-bit set through one meaningful row at bounded arrival speed.
/// Time excludes the collision windows, recognition margin, and any previous
/// action's remaining duration. Returns zero for an unreachable/invalid row.
pub fn reachable(previous: u8, row: Row, gap: f32, speed: f32, recovery: f32) -> u8 {
    if row.iter().any(|&kind| kind > 3) || gap < 2.0 * WINDOW || !speed.is_finite() || speed <= 0.0
    {
        return 0;
    }
    let time = (gap - 2.0 * WINDOW) / speed - REACTION - recovery;
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
    pub smashed: [u8; 2],
}
impl Default for Chunk {
    fn default() -> Self {
        Self {
            z: 0.0,
            rows: [[0; 3]; 2],
            coin_lanes: [0; 2],
            collected: [false; 2],
            resolved: [false; 2],
            smashed: [0; 2],
        }
    }
}

pub struct Generator {
    rng: Rng,
    reachable: u8,
    hazard_gap: f32,
}
impl Generator {
    pub fn new(seed: u32) -> Self {
        {
            Self {
                rng: Rng::new(seed),
                reachable: 0b010,
                hazard_gap: 0.0,
            }
        }
    }
    pub fn chunk(&mut self, z: f32, elapsed: f32) -> Chunk {
        let mut chunk = Chunk {
            z,
            ..Chunk::default()
        };
        for (row_index, offset) in ROWS.iter().enumerate() {
            let arrival =
                elapsed + (z + offset).max(0.0) / crate::difficulty::base_speed_at(elapsed);
            let speed = arrival_speed_bound(elapsed, z + offset);
            self.hazard_gap += 24.0;
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
            // Candidate rows stay 24m apart; meaningful hazards may skip many
            // rows. Empty recovery rows do NOT reset distance or reachable mask.
            if self.hazard_gap < minimum_hazard_gap(speed) {
                row = PATTERNS[0];
            }
            let mut next = reachable(self.reachable, row, self.hazard_gap, speed, 0.0);
            if next == 0 {
                row = PATTERNS[0];
                next = self.reachable;
            }
            debug_assert!(next != 0);
            if row != PATTERNS[0] {
                self.reachable = next;
                self.hazard_gap = 0.0;
            }
            let safe = (self.rng.next() % next.count_ones()) as usize;
            chunk.coin_lanes[row_index] =
                (0..3).filter(|i| next & (1 << i) != 0).nth(safe).unwrap() as i8 - 1;
            chunk.rows[row_index] = row;
        }
        chunk
    }
}

/// Recognition plus two quantized lane changes, or a complete previous action,
/// whichever takes longer; 0.1s extra margin. A standing safe route always exists.
pub fn decision_headway() -> f32 {
    let lane_ticks = (LANE_SECONDS / crate::runner::FIXED_DT).ceil();
    (REACTION + 2.0 * lane_ticks * crate::runner::FIXED_DT).max(JUMP_SECONDS.max(DUCK_SECONDS))
        + 0.1
}
pub fn minimum_hazard_gap(speed: f32) -> f32 {
    2.0 * WINDOW + speed * decision_headway()
}
