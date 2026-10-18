//! One immutable world definition, with two bounded cursors into its ordered stream.
//! Geometry depends ONLY on seed + absolute chunk index (and the fixed epoch in tests),
//! never on a runner's arrival time, boosts, collisions or consumption. Each cursor
//! regenerates the identical stream locally; even an arbitrarily large lead needs
//! only CHUNKS slots per runner, not a cache proportional to their separation.
use crate::track::{Chunk, Generator, LENGTH};

pub struct World {
    initial: Cursor,
}
impl World {
    pub fn new(seed: u32) -> Self {
        Self::at_time(seed, 0.0)
    }
    pub fn at_time(seed: u32, epoch: f32) -> Self {
        Self {
            initial: Cursor {
                generator: Generator::new(seed),
                next: 0,
                epoch,
            },
        }
    }
    pub fn cursor(&self) -> Cursor {
        self.initial.clone()
    }
}
#[derive(Clone)]
pub struct Cursor {
    generator: Generator,
    next: u64,
    epoch: f32,
}
impl Cursor {
    pub fn next(&mut self, distance: f64) -> Chunk {
        let origin = (self.next as f64 - 1.0) * LENGTH as f64;
        // Fixed world epoch, never request time. The existing speed bound now
        // uses the whole distance from the start at the minimum possible speed.
        // This is conservative even for a trailing runner.
        let mut chunk = self.generator.chunk(origin as f32, self.epoch);
        chunk.id = self.next;
        chunk.origin = origin;
        chunk.z = (origin - distance) as f32;
        self.next += 1;
        chunk
    }
}
