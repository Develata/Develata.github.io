//! One speed curve and conservative arrival bound, shared by runner and generator.
/// Pathological-session guard, not an ordinary gameplay ceiling (~105 minutes).
pub const ABSOLUTE_SPEED_GUARD: f32 = 120.0;
pub const INITIAL_SPEED: f32 = 12.0;
pub const STUMBLE_MULTIPLIER: f32 = 0.65;
pub const BIOME_SECONDS: f64 = 40.0;

pub fn base_speed_at(elapsed: f32) -> f32 {
    let t = if elapsed.is_nan() {
        0.0
    } else {
        elapsed.max(0.0)
    };
    let speed = if t <= 30.0 {
        INITIAL_SPEED + t * 0.1
    } else if t <= 90.0 {
        15.0 + (t - 30.0) * 0.075
    } else if t <= 180.0 {
        19.5 + (t - 90.0) * (5.0 / 90.0)
    } else if t <= 360.0 {
        24.5 + (t - 180.0) * (6.5 / 180.0)
    } else {
        31.0 + (t - 360.0) * 0.015
    };
    speed.min(ABSOLUTE_SPEED_GUARD)
}

/// Running always moves at least 12 * 0.65 m/s, including a stumble. Thus a row
/// d metres ahead must arrive by elapsed + d/min_speed. Monotonic base_speed_at
/// gives an upper bound on its NORMAL arrival speed, even after boost/stumble.
/// A paused session advances neither elapsed nor distance. No boost factor here.
pub fn arrival_speed_bound(elapsed: f32, distance: f32) -> f32 {
    base_speed_at(elapsed + distance.max(0.0) / (INITIAL_SPEED * STUMBLE_MULTIPLIER))
}

pub fn biome_at(elapsed: f64) -> u8 {
    ((elapsed.max(0.0) / BIOME_SECONDS).floor() % 3.0) as u8
}
