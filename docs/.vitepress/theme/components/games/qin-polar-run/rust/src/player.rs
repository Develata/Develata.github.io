//! Deterministic kinematics, in lane units and seconds. No browser/renderer state.
pub const LEFT: u32 = 1;
pub const RIGHT: u32 = 2;
pub const JUMP: u32 = 4;
pub const DUCK: u32 = 8;
pub const LANE_SECONDS: f32 = 0.16;
pub const JUMP_SECONDS: f32 = 0.9;
pub const DUCK_SECONDS: f32 = 0.8;

#[derive(Clone, Debug, Default)]
pub struct Player {
    pub lane: i8,
    pub x: f32,
    pub y: f32,
    pub duck: f32,
    pub jump: f32,
    pub lane_cooldown: f32,
    lane_from: f32,
}

impl Player {
    pub fn tick(&mut self, dt: f32, actions: u32) {
        if self.lane_cooldown <= 0.0 && (actions & (LEFT | RIGHT)).count_ones() == 1 {
            self.lane = (self.lane + if actions & LEFT != 0 { -1 } else { 1 }).clamp(-1, 1);
            if (self.x - self.lane as f32).abs() > 0.001 {
                self.lane_from = self.x;
                self.lane_cooldown = LANE_SECONDS;
            }
        }
        // Jump and duck are exclusive. Simultaneous verbs resolve to jump.
        if self.jump == 0.0 && self.duck == 0.0 {
            if actions & JUMP != 0 {
                self.jump = JUMP_SECONDS;
            } else if actions & DUCK != 0 {
                self.duck = DUCK_SECONDS;
            }
        }
        // Smoothstep has zero endpoint velocity, stays inside the two lanes, and
        // finishes within the same fixed duration used by the reachability proof.
        // Rendering and collision consume this one authoritative position.
        self.lane_cooldown = (self.lane_cooldown - dt).max(0.0);
        let t = 1.0 - self.lane_cooldown / LANE_SECONDS;
        let eased = t * t * (3.0 - 2.0 * t);
        self.x = self.lane_from + (self.lane as f32 - self.lane_from) * eased;
        self.jump = (self.jump - dt).max(0.0);
        self.duck = (self.duck - dt).max(0.0);
        let t = JUMP_SECONDS - self.jump;
        self.y = if self.jump > 0.0 {
            10.8 * t * (JUMP_SECONDS - t)
        } else {
            0.0
        };
    }
}

/// Both swept lanes are unsafe during a transition; no teleporting through blockers.
pub fn hits(kind: u8, lane: i8, player: &Player) -> bool {
    if (player.x - lane as f32).abs() >= 0.62 {
        return false;
    }
    match kind {
        1 => true,
        2 => player.y < 0.95,
        3 => player.duck <= 0.0 || player.y > 0.05,
        _ => false,
    }
}
