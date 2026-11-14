//! Safety-first feedback controller. No writes to physics, position or obstacles.
//! Hold a ground-safe lane through the entire current collision window, then
//! choose the nearest empty lane of the next meaningful row. Empty recovery rows
//! and their optional coins cannot lure it away from the safe route. At most two
//! quantized lane changes (40 ticks) fit inside the generator's >=1s headway.
//! No boost/jump/duck is needed for the standing path the generator guarantees.
use crate::player::{LEFT, RIGHT};
use crate::runner::RunnerCore;
use crate::track::{ROWS, WINDOW};

pub fn action(core: &RunnerCore) -> u32 {
    let next = core
        .chunks
        .iter()
        .flat_map(|chunk| (0..2).map(move |r| (chunk.z + ROWS[r], chunk.rows[r])))
        .filter(|(z, row)| *z >= -WINDOW && *row != [0; 3])
        .min_by(|a, b| a.0.total_cmp(&b.0));
    let Some((_, row)) = next else {
        return 0;
    };
    let safe = (-1i8..=1)
        .filter(|&lane| row[(lane + 1) as usize] == 0)
        .min_by_key(|&lane| (lane - core.player.lane).unsigned_abs());
    // An invalid all-blocked row is NOT erased or made harmless. Ordinary
    // collision handling still runs and the raw contact count exposes failure.
    match safe {
        Some(lane) if lane < core.player.lane => LEFT,
        Some(lane) if lane > core.player.lane => RIGHT,
        _ => 0,
    }
}
