//! Pure authoritative state. Fixed 120Hz steps; at most 12 steps per browser frame.
use crate::player::{Player, hits};
use crate::track::{CHUNKS, Chunk, Generator, LENGTH, MAX_SPEED, ROWS, WINDOW};

pub const FIXED_DT: f32 = 1.0 / 120.0;
pub const FRAME_LEN: usize = 16 + CHUNKS * 16;
pub const COIN_SCORE: u32 = 50;

pub struct RunnerCore {
    pub player: Player,
    pub chunks: [Chunk; CHUNKS],
    pub phase: u8, // 0 ready, 1 running, 2 paused, 3 over
    pub elapsed: f64,
    pub distance: f64,
    pub coins: u32,
    pub hits: u8,
    pub invulnerable: f32,
    pub stumble: f32,
    pub speed: f32,
    generator: Generator,
    accumulator: f32,
    pending: u32,
    events: u32, // coin=1, first hit=2, game over=4
}
impl RunnerCore {
    pub fn new(seed: u32) -> Self {
        let mut generator = Generator::new(seed);
        let chunks = std::array::from_fn(|i| {
            let z = (i as f32 - 1.0) * LENGTH;
            generator.chunk(z, (z + ROWS[0]) / 12.0)
        });
        Self {
            player: Player::default(),
            chunks,
            phase: 0,
            elapsed: 0.0,
            distance: 0.0,
            coins: 0,
            hits: 0,
            invulnerable: 0.0,
            stumble: 0.0,
            speed: 12.0,
            generator,
            accumulator: 0.0,
            pending: 0,
            events: 0,
        }
    }
    pub fn start(&mut self) {
        if self.phase == 0 {
            self.phase = 1;
        }
    }
    pub fn pause(&mut self, paused: bool) {
        if self.phase == 1 || self.phase == 2 {
            self.phase = if paused { 2 } else { 1 };
            self.accumulator = 0.0;
            self.pending = 0;
        }
    }
    pub fn score(&self) -> u32 {
        (self.distance as u32).saturating_add(self.coins.saturating_mul(COIN_SCORE))
    }
    pub fn advance(&mut self, dt: f32, actions: u32) {
        self.events = 0;
        if self.phase != 1 || !dt.is_finite() || dt < 0.0 {
            return;
        }
        self.pending |= actions & 15;
        self.accumulator += dt.min(0.1);
        for _ in 0..12 {
            if self.accumulator < FIXED_DT || self.phase != 1 {
                break;
            }
            self.accumulator -= FIXED_DT;
            let actions = std::mem::take(&mut self.pending);
            self.tick(actions);
        }
    }
    fn tick(&mut self, actions: u32) {
        self.elapsed += FIXED_DT as f64;
        self.invulnerable = (self.invulnerable - FIXED_DT).max(0.0);
        self.stumble = (self.stumble - FIXED_DT).max(0.0);
        self.player.tick(FIXED_DT, actions);
        self.speed = (12.0 + self.elapsed as f32 * 0.075).min(MAX_SPEED);
        if self.stumble > 0.0 {
            self.speed *= 0.65;
        }
        let travel = self.speed * FIXED_DT;
        self.distance += travel as f64;
        let mut collision = false;
        for chunk in &mut self.chunks {
            chunk.z -= travel;
            for (r, offset) in ROWS.iter().enumerate() {
                let z = chunk.z + offset;
                if z.abs() <= WINDOW && !chunk.resolved[r] {
                    for lane in 0..3 {
                        if hits(chunk.rows[r][lane], lane as i8 - 1, &self.player) {
                            collision = true;
                            chunk.resolved[r] = true;
                        }
                    }
                }
                // Coin is 5m before its row, guiding a guaranteed ground-safe lane.
                if (z - 5.0).abs() < 0.9
                    && !chunk.collected[r]
                    && (self.player.x - chunk.coin_lanes[r] as f32).abs() < 0.45
                    && self.player.y < 1.5
                {
                    chunk.collected[r] = true;
                    self.coins = self.coins.saturating_add(1);
                    self.events |= 1;
                }
            }
        }
        if collision {
            self.hit();
        }
        // A slot is reused only after its entire chunk has left the camera.
        for i in 0..CHUNKS {
            if self.chunks[i].z < -LENGTH - 6.0 {
                let farthest = self
                    .chunks
                    .iter()
                    .map(|c| c.z)
                    .fold(f32::NEG_INFINITY, f32::max);
                let z = farthest + LENGTH;
                self.chunks[i] = self
                    .generator
                    .chunk(z, self.elapsed as f32 + z / self.speed);
            }
        }
    }
    pub fn hit(&mut self) {
        if self.invulnerable > 0.0 || self.phase != 1 {
            return;
        }
        self.hits += 1;
        if self.hits == 1 {
            self.invulnerable = 2.0;
            self.stumble = 1.0;
            self.events |= 2;
        } else {
            self.phase = 3;
            self.events |= 4;
        }
    }
    /// ABI v1: 16-float header + 8 fixed slots of 16 floats (576 bytes).
    /// Each slot: z; row0 [3 kinds, coin lane, collected]; row1 same; padding.
    pub fn frame(&self, out: &mut [f32]) {
        if out.len() != FRAME_LEN {
            return;
        }
        out.fill(0.0);
        out[..13].copy_from_slice(&[
            1.0,
            self.phase as f32,
            self.elapsed as f32,
            (self.distance % LENGTH as f64) as f32,
            self.score() as f32,
            self.player.x,
            self.player.y,
            if self.player.duck > 0.0 { 1.0 } else { 0.0 },
            self.invulnerable,
            self.stumble,
            self.speed,
            self.events as f32,
            self.hits as f32,
        ]);
        for (i, chunk) in self.chunks.iter().enumerate() {
            let base = 16 + i * 16;
            out[base] = chunk.z;
            for r in 0..2 {
                let b = base + 1 + r * 5;
                for lane in 0..3 {
                    out[b + lane] = chunk.rows[r][lane] as f32;
                }
                out[b + 3] = chunk.coin_lanes[r] as f32;
                out[b + 4] = chunk.collected[r] as u8 as f32;
            }
        }
    }
}
