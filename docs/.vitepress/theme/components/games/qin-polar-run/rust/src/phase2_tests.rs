use crate::boost::*;
use crate::difficulty::*;
use crate::player::*;
use crate::runner::*;
use crate::track::*;

#[test]
fn progressive_curve_is_continuous_finite_and_not_normally_capped() {
    let mut previous = 0.0;
    for i in 0..100_000 {
        let speed = base_speed_at(i as f32 * 0.1);
        assert!(speed.is_finite() && speed >= previous && speed <= ABSOLUTE_SPEED_GUARD);
        previous = speed;
    }
    for (time, expected) in [
        (0.0, 12.0),
        (30.0, 15.0),
        (90.0, 19.5),
        (180.0, 24.5),
        (360.0, 31.0),
    ] {
        assert!((base_speed_at(time) - expected).abs() < 1e-4);
        assert!((base_speed_at(time + 0.001) - base_speed_at(time - 0.001)).abs() < 0.001);
    }
    for time in [600.0, 1800.0, 3600.0] {
        assert!(base_speed_at(time) > base_speed_at(time - 60.0));
        assert!(base_speed_at(time) < ABSOLUTE_SPEED_GUARD);
    }
    assert_eq!(base_speed_at(f32::MAX), ABSOLUTE_SPEED_GUARD);
    assert_eq!(base_speed_at(f32::INFINITY), ABSOLUTE_SPEED_GUARD);
    assert_eq!(base_speed_at(f32::NAN), INITIAL_SPEED);
}

#[test]
fn high_speed_generation_validates_real_gaps_between_meaningful_rows() {
    for time in [0.0, 30.0, 90.0, 180.0, 600.0, 3600.0, 10_000.0] {
        for seed in 1..=200 {
            let mut generator = Generator::new(seed);
            let mut mask = 2;
            let mut gap = 0.0;
            let mut hazards = 0;
            for _ in 0..400 {
                let chunk = generator.chunk(288.0, time);
                for (index, row) in chunk.rows.iter().enumerate() {
                    gap += 24.0;
                    if *row != [0; 3] {
                        let bound = arrival_speed_bound(time, 288.0 + ROWS[index]);
                        assert!(gap + 1e-4 >= minimum_hazard_gap(bound));
                        mask = reachable(mask, *row, gap, bound, 0.0);
                        assert_ne!(mask, 0, "seed={seed},time={time}");
                        gap = 0.0;
                        hazards += 1;
                    }
                }
            }
            assert!(hazards > 20); // The guard must not make the generator empty forever.
        }
    }
}

fn late_core(seed: u32, elapsed: f64) -> RunnerCore {
    let mut c = RunnerCore::new(seed);
    c.elapsed = elapsed;
    let mut generator = Generator::new(seed);
    for (i, chunk) in c.chunks.iter_mut().enumerate() {
        *chunk = generator.chunk((i as f32 - 1.0) * LENGTH, elapsed as f32);
    }
    c.start();
    c
}

#[test]
fn actual_high_speed_windows_leave_time_to_react_and_change_two_lanes() {
    for time in [120.0, 300.0, 600.0, 3600.0, 10_000.0] {
        for seed in 1..=12 {
            let mut c = late_core(seed, time);
            let mut wait = REACTION;
            let mut last_z = f32::MAX;
            for _ in 0..7_200 {
                let next = c
                    .chunks
                    .iter()
                    .flat_map(|chunk| (0..2).map(move |r| (chunk.z + ROWS[r], chunk.rows[r])))
                    .filter(|(z, row)| *z > -WINDOW - 0.1 && *row != [0; 3])
                    .min_by(|a, b| a.0.total_cmp(&b.0));
                let mut action = 0;
                if let Some((z, row)) = next {
                    if z > last_z + 1.0 {
                        wait = REACTION;
                    }
                    last_z = z;
                    wait = (wait - FIXED_DT).max(0.0);
                    if wait == 0.0 {
                        let safe = row.iter().position(|&kind| kind == 0).unwrap() as i8 - 1;
                        action = if c.player.lane > safe {
                            LEFT
                        } else if c.player.lane < safe {
                            RIGHT
                        } else {
                            0
                        };
                    }
                }
                c.advance(FIXED_DT, action);
                assert_eq!(c.hits, 0, "seed={seed},elapsed={}", c.elapsed);
                assert!(
                    c.chunks
                        .iter()
                        .all(|chunk| chunk.z >= -LENGTH - 6.0 && chunk.z < LENGTH * CHUNKS as f32)
                );
            }
        }
    }
}

fn clear_track(c: &mut RunnerCore) {
    for chunk in &mut c.chunks {
        chunk.rows = [[0; 3]; 2];
        chunk.collected = [true; 2];
    }
}
fn pickup(c: &mut RunnerCore, lane: i8) {
    c.chunks[0].z = 5.0 - ROWS[0];
    c.chunks[0].coin_lanes[0] = lane;
    c.chunks[0].collected[0] = false;
    c.advance(FIXED_DT, 0);
}

#[test]
fn ten_actual_coins_charge_manual_boost_and_active_coins_do_not_refill() {
    let mut c = RunnerCore::new(3);
    c.start();
    clear_track(&mut c);
    for _ in 0..9 {
        pickup(&mut c, 0);
    }
    assert_eq!(c.boost.charge, 9);
    c.advance(FIXED_DT, BOOST_ACTION);
    assert!(!c.boost.active());
    pickup(&mut c, 0);
    assert_eq!(c.boost.charge, 10);
    assert!(!c.boost.active());
    c.advance(FIXED_DT, BOOST_ACTION);
    assert!(c.boost.active());
    assert_eq!(c.boost.charge, 0);
    assert_ne!(c.events & 8, 0);
    assert!((c.speed - base_speed_at(c.elapsed as f32) * BOOST_MULTIPLIER).abs() < 1e-4);
    let coins = c.coins;
    let score = c.score();
    pickup(&mut c, 1); // One adjacent lane, only boost magnet can collect.
    assert_eq!(c.coins, coins + 1);
    assert!(c.score() >= score + COIN_SCORE);
    assert_eq!(c.boost.charge, 0);
    for _ in 0..430 {
        c.advance(FIXED_DT, 0);
    }
    assert!(!c.boost.active());
    pickup(&mut c, 1);
    assert_eq!(c.coins, coins + 1);
    pickup(&mut c, 0);
    assert_eq!(c.boost.charge, 1);
}

#[test]
fn boost_duration_smash_exit_grace_and_no_healing() {
    let mut b = Boost {
        charge: 10,
        ..Boost::default()
    };
    assert!(b.tick(0.0, true));
    for _ in 0..419 {
        b.tick(FIXED_DT, false);
    }
    assert!(b.active());
    for _ in 0..2 {
        b.tick(FIXED_DT, false);
    }
    assert!(!b.active() && b.grace > 0.98);
    let mut c = RunnerCore::new(9);
    c.start();
    clear_track(&mut c);
    c.hit();
    c.invulnerable = 0.0;
    c.boost.charge = 10;
    c.chunks[0].z = -ROWS[0];
    c.chunks[0].rows[0] = [0, 1, 0];
    c.advance(FIXED_DT, BOOST_ACTION);
    assert_eq!(c.hits, 1);
    assert_eq!(c.chunks[0].rows[0], [0; 3]);
    assert_eq!(c.chunks[0].smashed[0], 2);
    assert_ne!(c.events & 16, 0);
    c.boost.remaining = FIXED_DT / 2.0;
    c.chunks[0].z = -ROWS[0];
    c.chunks[0].rows[0] = [0, 1, 0];
    c.chunks[0].resolved[0] = false;
    c.advance(FIXED_DT, 0);
    assert!(!c.boost.active() && c.boost.grace > 0.99);
    assert_eq!(c.hits, 1);
    c.hit();
    assert_eq!(c.hits, 1);
    for _ in 0..130 {
        c.advance(FIXED_DT, 0);
    }
    c.hit();
    assert_eq!(c.hits, 2);
    assert_eq!(c.phase, 3);
}

#[test]
fn biome_cycles_and_abi_v2_use_existing_header_capacity() {
    for (t, id) in [
        (0.0, 0),
        (39.99, 0),
        (40.0, 1),
        (79.99, 1),
        (80.0, 2),
        (120.0, 0),
        (400.0, 1),
    ] {
        assert_eq!(biome_at(t), id);
    }
    let mut c = RunnerCore::new(1);
    c.start();
    c.elapsed = 39.999;
    c.boost.charge = 7;
    c.advance(FIXED_DT, 0);
    assert_ne!(c.events & 32, 0);
    let mut frame = [0.0; FRAME_LEN];
    c.frame(&mut frame);
    assert_eq!(FRAME_LEN, 144);
    assert_eq!(frame[0], 2.0);
    assert_eq!(frame[13], 7.0);
    assert_eq!(frame[14], 0.0);
    assert_eq!(frame[15], 1.0);
}
