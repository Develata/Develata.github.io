//! Race clock and ABI extension. Both competitors use the same RunnerCore
//! physics/consumption rules. Visibility is a renderer preference, never a clock.
use crate::autopilot;
use crate::runner::{FIXED_DT, FRAME_LEN, RunnerCore};
use crate::world::World;

pub const RACE_FRAME_LEN: usize = FRAME_LEN + 16;
pub struct Race {
    pub human: RunnerCore,
    pub ghost: RunnerCore,
}
impl Race {
    pub fn new(seed: u32) -> Self {
        let world = World::new(seed);
        Self {
            human: RunnerCore::in_world(&world),
            ghost: RunnerCore::in_world(&world),
        }
    }
    pub fn start(&mut self) {
        self.human.start();
        self.ghost.start();
    }
    pub fn pause(&mut self, paused: bool) {
        self.human.pause(paused);
        self.ghost.pause(paused);
    }
    pub fn advance(&mut self, dt: f32, actions: u32) {
        let before = self.human.elapsed;
        self.human.advance(dt, actions);
        self.ghost.events = 0;
        let ticks = ((self.human.elapsed - before) / FIXED_DT as f64).round() as usize;
        for _ in 0..ticks {
            if self.ghost.phase != 1 {
                break;
            }
            self.ghost.tick(autopilot::action(&self.ghost));
        }
    }
    /// ABI v3 preserves offsets 1..143; adds true distances and the ghost pose.
    /// 144 human distance, 145 ghost distance, 146 signed lead (ghost-human),
    /// 147 x, 148 y, 149 duck, 150 speed, 151 hits, 152 raw contacts,
    /// 153 phase, 154 coins, 155 immunity, 156 stumble, 157 ghost elapsed.
    pub fn frame(&self, out: &mut [f32]) {
        if out.len() != RACE_FRAME_LEN {
            return;
        }
        out.fill(0.0);
        self.human.frame(&mut out[..FRAME_LEN]);
        out[0] = 3.0;
        out[FRAME_LEN..FRAME_LEN + 14].copy_from_slice(&[
            self.human.distance as f32,
            self.ghost.distance as f32,
            (self.ghost.distance - self.human.distance) as f32,
            self.ghost.player.x,
            self.ghost.player.y,
            (self.ghost.player.duck > 0.0) as u8 as f32,
            self.ghost.speed,
            self.ghost.hits as f32,
            self.ghost.contacts as f32,
            self.ghost.phase as f32,
            self.ghost.coins as f32,
            self.ghost.invulnerable,
            self.ghost.stumble,
            self.ghost.elapsed as f32,
        ]);
    }
}
