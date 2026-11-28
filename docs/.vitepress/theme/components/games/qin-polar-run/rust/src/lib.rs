//! Northern Run: independent pure core with a coarse, copied numeric WASM ABI.
mod autopilot;
mod boost;
mod difficulty;
#[cfg(test)]
mod phase2_tests;
mod player;
mod race;
#[cfg(test)]
mod race_tests;
mod runner;
#[cfg(test)]
mod tests;
mod track;
mod world;
use race::Race;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Runner {
    core: Race,
}
#[wasm_bindgen]
impl Runner {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> Self {
        Self {
            core: Race::new(seed),
        }
    }
    pub fn reset(&mut self, seed: u32) {
        self.core = Race::new(seed);
        self.core.start();
    }
    pub fn pause(&mut self, paused: bool) {
        self.core.pause(paused);
    }
    pub fn advance(&mut self, dt: f32, actions: u32, frame: &mut [f32]) {
        self.core.advance(dt, actions);
        self.core.frame(frame);
    }
}
