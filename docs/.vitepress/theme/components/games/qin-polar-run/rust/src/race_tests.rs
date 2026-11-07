use crate::autopilot;
use crate::boost::BOOST_ACTION;
use crate::player::{DUCK, JUMP, LEFT, RIGHT};
use crate::race::{RACE_FRAME_LEN, Race};
use crate::runner::{FIXED_DT, RunnerCore};
use crate::track::{CHUNKS, LENGTH, ROWS, WINDOW};
use crate::world::World;

fn clear(core: &mut RunnerCore) {
    for chunk in &mut core.chunks {
        chunk.rows = [[0; 3]; 2];
        chunk.collected = [true; 2];
    }
}
fn run_safe(core: &mut RunnerCore, ticks: usize) {
    for _ in 0..ticks {
        let action = autopilot::action(core);
        assert_eq!(action & !(LEFT | RIGHT), 0);
        let mut expected = core.player.clone();
        expected.tick(FIXED_DT, action);
        core.advance(FIXED_DT, action);
        assert_eq!(core.player.x, expected.x);
        assert_eq!(core.player.lane_cooldown, expected.lane_cooldown);
        assert_eq!(
            core.contacts, 0,
            "elapsed={} distance={}",
            core.elapsed, core.distance
        );
        assert_eq!(core.hits, 0);
        assert_eq!(core.phase, 1);
        assert!(!core.boost.active());
        assert!(
            core.chunks
                .iter()
                .all(|c| c.z >= -LENGTH - 6.0 && c.z < CHUNKS as f32 * LENGTH)
        );
    }
}

#[test]
fn controller_many_seeds_and_two_hour_sessions_have_no_contacts() {
    for seed in 0..64 {
        let mut core = RunnerCore::new(seed);
        core.start();
        run_safe(&mut core, 180 * 120);
    }
    // Full continuous runs pass through every speed regime and the 120m/s guard.
    for seed in [1, 725, 0xdead_beef, u32::MAX] {
        let mut core = RunnerCore::new(seed);
        core.start();
        run_safe(&mut core, 7200 * 120);
        assert_eq!(core.speed, 120.0);
    }
}

#[test]
fn controller_from_high_speed_epochs_has_no_contacts() {
    for epoch in [120.0, 600.0, 3600.0, 10_000.0] {
        for seed in 1..=16 {
            let mut core = RunnerCore::in_world(&World::at_time(seed, epoch));
            core.elapsed = epoch as f64;
            core.start();
            run_safe(&mut core, 60 * 120);
        }
    }
}

#[test]
fn independent_world_cursors_regenerate_identical_geometry_across_huge_gaps() {
    for seed in [0, 1, 73, u32::MAX] {
        let world = World::new(seed);
        let mut leader = world.cursor();
        let mut trailer = world.cursor();
        // Only the test stores the oracle. Production has two fixed eight-slot views.
        let expected: Vec<_> = (0..20_000).map(|_| leader.next(100_000.0)).collect();
        for original in expected {
            let delayed = trailer.next(0.0);
            assert_eq!(original.id, delayed.id);
            assert_eq!(original.origin, delayed.origin);
            assert_eq!(original.rows, delayed.rows);
            assert_eq!(original.coin_lanes, delayed.coin_lanes);
        }
    }
}

#[test]
fn different_input_progress_keeps_world_geometry_and_coordinates_identical() {
    let world = World::new(614);
    let mut fast = RunnerCore::in_world(&world);
    let mut slow = RunnerCore::in_world(&world);
    fast.start();
    slow.start();
    for tick in 0..12_000 {
        // Earned charge is tested separately; here force repeated boost/stumble
        // to exercise very different stream consumption rates without game over.
        fast.boost.charge = 10;
        slow.stumble = 1.0;
        fast.advance(FIXED_DT, autopilot::action(&fast) | BOOST_ACTION);
        slow.advance(FIXED_DT, autopilot::action(&slow));
        if tick % 120 == 0 {
            for a in &fast.chunks {
                for b in &slow.chunks {
                    if a.id == b.id {
                        assert_eq!(a.origin, b.origin);
                        assert_eq!(a.coin_lanes, b.coin_lanes);
                        for r in 0..2 {
                            for lane in 0..3 {
                                if a.smashed[r] & (1 << lane) == 0 {
                                    assert_eq!(a.rows[r][lane], b.rows[r][lane]);
                                }
                            }
                        }
                        let gap = fast.distance - slow.distance;
                        assert!(((b.z - a.z) as f64 - gap).abs() < 0.001);
                    }
                }
            }
        }
    }
    assert!(fast.distance - slow.distance > 700.0);
    assert_eq!(slow.contacts, 0);
}

#[test]
fn pickup_smash_and_collision_state_are_separate_for_both_competitors() {
    let mut race = Race::new(4);
    race.start();
    clear(&mut race.human);
    clear(&mut race.ghost);
    for core in [&mut race.human, &mut race.ghost] {
        core.chunks[0].origin = 5.0 - ROWS[0] as f64;
        core.chunks[0].coin_lanes[0] = 0;
        core.chunks[0].collected[0] = false;
    }
    race.advance(FIXED_DT, 0);
    assert_eq!(race.human.coins, 1);
    assert_eq!(race.ghost.coins, 1);
    race.human.chunks[1].origin = race.human.distance - ROWS[0] as f64;
    race.human.chunks[1].rows[0] = [0, 1, 0];
    race.human.boost.charge = 10;
    let ghost_rows = race.ghost.chunks[1].rows;
    race.advance(FIXED_DT, BOOST_ACTION);
    assert_eq!(race.human.chunks[1].smashed[0], 2);
    assert_eq!(race.human.contacts, 1);
    assert_eq!(race.ghost.contacts, 0);
    assert_eq!(race.ghost.chunks[1].rows, ghost_rows);
    assert_eq!(race.ghost.chunks[1].smashed, [0; 2]);
    // A player collision cannot slow or damage the ghost either.
    race.human.boost = Default::default();
    race.human.hit();
    race.advance(FIXED_DT, 0);
    assert_eq!(race.ghost.hits, 0);
    assert!(race.ghost.speed > race.human.speed);
    assert_eq!(race.ghost.boost.charge, 1);
}

#[test]
fn controller_holds_window_then_executes_consecutive_two_lane_changes() {
    let mut core = RunnerCore::in_world(&World::at_time(2, 10_000.0));
    core.elapsed = 10_000.0;
    core.start();
    clear(&mut core);
    let mut turns = 0;
    // Alternating safe outer lanes require sweeping through the middle twice.
    for (i, origin) in [48.0, 192.0, 336.0].into_iter().enumerate() {
        core.chunks[i].origin = origin;
        core.chunks[i].z = origin as f32;
        core.chunks[i].rows[0] = if i % 2 == 0 { [0, 1, 1] } else { [1, 1, 0] };
    }
    for _ in 0..345 {
        let old = core.player.lane;
        let action = autopilot::action(&core);
        core.advance(FIXED_DT, action);
        if old != core.player.lane {
            turns += 1;
        }
        assert_eq!(core.contacts, 0);
    }
    assert!(turns >= 5);
    // Exactly at the rear window boundary, do not start switching to a later row.
    clear(&mut core);
    core.player = Default::default();
    core.chunks[0].z = -ROWS[0] - WINDOW;
    core.chunks[0].rows[0] = [1, 0, 1];
    core.chunks[1].z = 24.0 - ROWS[0];
    core.chunks[1].rows[0] = [0, 1, 1];
    assert_eq!(autopilot::action(&core), 0);
}

#[test]
fn impossible_track_contacts_are_visible_and_can_stop_the_ghost() {
    let mut race = Race::new(3);
    race.start();
    clear(&mut race.human);
    for _ in 0..2 {
        clear(&mut race.ghost);
        race.ghost.invulnerable = 0.0;
        race.ghost.chunks[0].origin = race.ghost.distance - ROWS[0] as f64;
        race.ghost.chunks[0].rows[0] = [1; 3];
        race.ghost.chunks[0].resolved[0] = false;
        race.advance(FIXED_DT, 0);
    }
    assert_eq!(race.ghost.contacts, 2);
    assert_eq!(race.ghost.hits, 2);
    assert_eq!(race.ghost.phase, 3);
    assert_eq!(race.human.phase, 1);
    let mut out = [0.0; RACE_FRAME_LEN];
    race.frame(&mut out);
    assert_eq!(out[152], 2.0);
    assert_eq!(out[153], 3.0);
    let stopped = race.ghost.distance;
    race.advance(0.1, 0);
    assert_eq!(race.ghost.distance, stopped);
}

#[test]
fn race_pause_resume_reset_invalid_dt_and_fractional_steps_share_one_clock() {
    let mut race = Race::new(8);
    race.start();
    for dt in [f32::NAN, f32::INFINITY, -1.0] {
        race.advance(dt, RIGHT);
    }
    race.advance(FIXED_DT / 2.0, LEFT);
    assert_eq!(race.human.elapsed, 0.0);
    assert_eq!(race.ghost.elapsed, 0.0);
    race.pause(true);
    race.advance(20.0, RIGHT);
    race.pause(false);
    race.advance(FIXED_DT, 0);
    assert_eq!(race.human.player.lane, 0); // paused input was cleared
    for _ in 0..4_000 {
        race.advance(FIXED_DT * 0.51, autopilot::action(&race.human));
        assert_eq!(race.human.elapsed, race.ghost.elapsed);
    }
    race.pause(true);
    let pose = (race.ghost.distance, race.ghost.player.x);
    race.advance(9999.0, JUMP);
    assert_eq!(pose, (race.ghost.distance, race.ghost.player.x));
    race.pause(false);
    race.advance(9999.0, 0);
    assert_eq!(race.human.elapsed, race.ghost.elapsed);
    race = Race::new(8);
    race.start();
    assert_eq!(race.ghost.distance, 0.0);
    assert_eq!(race.ghost.contacts, 0);
    assert_eq!(race.human.distance, 0.0);
    assert_eq!(race.ghost.player.x, 0.0);
}

#[test]
fn action_boundaries_and_player_game_over_do_not_desynchronise_ghost() {
    let mut race = Race::new(1);
    race.start();
    race.advance(FIXED_DT, JUMP | DUCK | LEFT | RIGHT);
    assert_eq!(race.human.player.lane, 0);
    assert!(race.human.player.jump > 0.0);
    assert_eq!(race.human.player.duck, 0.0);
    let ghost = race.ghost.player.clone();
    assert_eq!(ghost.jump, 0.0);
    assert_eq!(ghost.duck, 0.0);
    race.human.hits = 1;
    clear(&mut race.human);
    race.human.chunks[0].origin = race.human.distance - ROWS[0] as f64;
    race.human.chunks[0].rows[0] = [1; 3];
    race.advance(0.1, 0);
    assert_eq!(race.human.phase, 3);
    assert_eq!(race.ghost.elapsed, race.human.elapsed);
    let elapsed = race.ghost.elapsed;
    race.advance(0.1, 0);
    assert_eq!(elapsed, race.ghost.elapsed);
}

#[test]
fn abi_v3_preserves_track_layout_and_exports_true_signed_distance() {
    let mut race = Race::new(725);
    race.start();
    race.human.distance = 48_001.25;
    race.human.coins = 123;
    race.ghost.distance = 48_013.75;
    let mut out = [0.0; RACE_FRAME_LEN];
    race.frame(&mut out);
    assert_eq!(out.len(), 160);
    assert_eq!(out[0], 3.0);
    assert_eq!(out[3], 1.25);
    assert_ne!(out[4], out[144]);
    assert_eq!(out[144], 48_001.25);
    assert_eq!(out[145], 48_013.75);
    assert_eq!(out[146], 12.5);
    assert_eq!(out[16], race.human.chunks[0].z);
    // Difference is computed in f64 BEFORE the f32 ABI conversion.
    race.human.distance = 100_000_000.0;
    race.ghost.distance = 100_000_000.125;
    race.frame(&mut out);
    assert_eq!(out[146], 0.125);
    let mut old = [42.0; 144];
    race.frame(&mut old);
    assert_eq!(old, [42.0; 144]);
}
