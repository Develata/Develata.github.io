use crate::difficulty::*;
use crate::player::*;
use crate::runner::*;
use crate::track::*;

#[test]
fn lane_bounds_and_continuous_transition() {
    let mut p = Player::default();
    for _ in 0..100 {
        p.tick(0.2, LEFT);
    }
    assert_eq!(p.lane, -1);
    assert_eq!(p.x, -1.0);
    p.tick(0.01, RIGHT);
    assert!(p.x > -1.0 && p.x < 0.0);
    for _ in 0..100 {
        p.tick(0.2, RIGHT);
    }
    assert_eq!(p.lane, 1);
    assert_eq!(p.x, 1.0);
}
#[test]
fn jump_arc_lands_and_cannot_double_jump() {
    let mut p = Player::default();
    p.tick(FIXED_DT, JUMP);
    assert!(p.y > 0.0);
    let mut peak = p.y;
    for _ in 0..120 {
        p.tick(FIXED_DT, 0);
        peak = peak.max(p.y);
        assert!(p.y.is_finite() && p.y >= 0.0);
    }
    assert!(peak > 2.0 && peak < 2.3);
    assert_eq!(p.y, 0.0);
    p.tick(0.1, JUMP);
    let remaining = p.jump;
    p.tick(0.1, JUMP);
    assert!(p.jump < remaining);
}
#[test]
fn duck_is_timed_exclusive_and_expires() {
    let mut p = Player::default();
    p.tick(0.1, DUCK);
    assert!(p.duck > 0.0);
    p.tick(0.1, JUMP);
    assert_eq!(p.y, 0.0);
    for _ in 0..100 {
        p.tick(FIXED_DT, 0);
    }
    assert_eq!(p.duck, 0.0);
}
#[test]
fn collision_lane_and_action_clearance() {
    let mut p = Player::default();
    assert!(hits(1, 0, &p));
    assert!(!hits(1, 1, &p));
    assert!(hits(2, 0, &p));
    p.tick(0.3, JUMP);
    assert!(!hits(2, 0, &p));
    assert!(hits(1, 0, &p));
    assert!(hits(3, 0, &p));
    p = Player::default();
    p.tick(0.1, DUCK);
    assert!(!hits(3, 0, &p));
    p.x = 0.5;
    assert!(hits(1, 0, &p) && hits(1, 1, &p));
}
#[test]
fn first_hit_slowdown_duplicate_immunity_then_game_over() {
    let mut c = RunnerCore::new(1);
    c.start();
    c.hit();
    assert_eq!(c.phase, 1);
    assert_eq!(c.hits, 1);
    c.hit();
    assert_eq!(c.hits, 1);
    c.advance(0.1, 0);
    assert!(c.speed < 12.0);
    for _ in 0..25 {
        c.advance(0.1, 0);
    }
    c.hit();
    assert_eq!(c.phase, 3);
    assert_eq!(c.hits, 2);
    let score = c.score();
    c.advance(0.1, 0);
    assert_eq!(score, c.score());
}
#[test]
fn score_distance_and_actual_coin_pickup_reset() {
    let mut c = RunnerCore::new(3);
    c.start();
    c.chunks[0].z = -7.0;
    c.chunks[0].coin_lanes[0] = 0;
    c.advance(FIXED_DT, 0);
    assert_eq!(c.coins, 1);
    assert!(c.score() >= COIN_SCORE);
    let mut score = c.score();
    for _ in 0..60 {
        c.advance(FIXED_DT, 0);
        assert!(c.score() >= score);
        score = c.score();
    }
    c = RunnerCore::new(3);
    assert_eq!(c.score(), 0);
}
#[test]
fn rng_and_input_replay_are_deterministic() {
    let mut a = RunnerCore::new(725);
    let mut b = RunnerCore::new(725);
    let mut rng = Rng::new(9);
    a.start();
    b.start();
    let mut fa = [0.0; FRAME_LEN];
    let mut fb = fa;
    for _ in 0..10_000 {
        let action = 1 << (rng.next() % 5);
        a.advance(FIXED_DT, action);
        b.advance(FIXED_DT, action);
        a.frame(&mut fa);
        b.frame(&mut fb);
        assert_eq!(fa, fb);
    }
}
#[test]
fn validator_rejects_impossible_and_too_fast_transitions() {
    assert_eq!(reachable(7, [1, 2, 3], 24.0, 22.0, 0.0), 0);
    assert_eq!(reachable(1, [1, 1, 0], 4.0, 22.0, 0.0), 0);
    assert_eq!(reachable(0, [0, 0, 0], 24.0, 22.0, 0.0), 0);
    assert_eq!(reachable(7, [4, 0, 0], 24.0, 22.0, 0.0), 0);
    assert_eq!(reachable(1, [1, 1, 0], 24.0, 22.0, 0.0), 4);
    assert_eq!(reachable(1, [1, 1, 0], 24.0, 22.0, 0.8), 0);
    assert!(decision_headway() >= JUMP_SECONDS.max(DUCK_SECONDS));
}
#[test]
fn million_generated_rows_have_a_safe_cross_boundary_path() {
    for seed in 1..=500 {
        let mut generator = Generator::new(seed);
        let mut mask = 2;
        for index in 0..1_000 {
            let c = generator.chunk(100.0, index as f32);
            for (r, row) in c.rows.iter().enumerate() {
                mask = reachable(mask, *row, 24.0, 22.0, 0.0);
                assert_ne!(mask, 0, "seed={seed}, chunk={index}");
                assert_eq!(row[(c.coin_lanes[r] + 1) as usize], 0);
            }
        }
    }
}
#[test]
fn invalid_delta_pause_and_high_refresh_inputs() {
    let mut c = RunnerCore::new(1);
    c.start();
    c.advance(f32::NAN, LEFT);
    c.advance(-1.0, RIGHT);
    c.advance(f32::INFINITY, JUMP);
    assert_eq!(c.elapsed, 0.0);
    c.advance(FIXED_DT / 2.0, LEFT);
    c.advance(FIXED_DT / 2.0, 0);
    assert_eq!(c.player.lane, -1);
    c.pause(true);
    let t = c.elapsed;
    c.advance(10.0, RIGHT);
    assert_eq!(t, c.elapsed);
    c.pause(false);
    c.advance(9999.0, 0);
    assert!(c.elapsed - t <= 0.101);
}
#[test]
fn long_autopilot_run_uses_real_kinematics_and_bounded_slots() {
    for seed in 1..=8 {
        let mut c = RunnerCore::new(seed);
        c.start();
        for _ in 0..36_000 {
            let next = c
                .chunks
                .iter()
                .flat_map(|c| (0..2).map(move |r| (c.z + ROWS[r], c.rows[r])))
                .filter(|(z, _)| *z > -WINDOW - 0.1)
                .min_by(|a, b| a.0.total_cmp(&b.0))
                .unwrap();
            let safe = next.1.iter().position(|&kind| kind == 0).unwrap() as i8 - 1;
            let action = if c.player.lane > safe {
                LEFT
            } else if c.player.lane < safe {
                RIGHT
            } else {
                0
            };
            c.advance(FIXED_DT, action);
            assert_eq!(c.hits, 0, "seed={seed}, time={}", c.elapsed);
            assert!(
                c.chunks
                    .iter()
                    .all(|c| c.z >= -LENGTH - 6.0 && c.z < LENGTH * CHUNKS as f32)
            );
            assert!(c.speed <= ABSOLUTE_SPEED_GUARD);
        }
    }
}

#[test]
fn actual_obstacle_windows_accept_jump_and_duck_and_count_hits() {
    for (kind, action, expected) in [(1, 0, 1), (2, 0, 1), (2, JUMP, 0), (3, 0, 1), (3, DUCK, 0)] {
        let mut c = RunnerCore::new(4);
        c.start();
        for chunk in &mut c.chunks {
            chunk.rows = [[0; 3]; 2];
        }
        c.chunks[0].z = 6.0 - ROWS[0];
        c.chunks[0].rows[0] = [0, kind, 0];
        c.advance(FIXED_DT, action);
        for _ in 0..90 {
            c.advance(FIXED_DT, 0);
        }
        assert_eq!(c.hits, expected, "kind={kind}, action={action}");
    }
}

#[test]
fn lane_easing_is_symmetric_bounded_and_matches_collision() {
    for action in [LEFT, RIGHT] {
        let sign = if action == LEFT { -1.0 } else { 1.0 };
        let mut p = Player::default();
        let mut positions = [0.0; 5];
        for (index, position) in positions.iter_mut().enumerate().skip(1) {
            p.tick(LANE_SECONDS / 4.0, if index == 1 { action } else { 0 });
            *position = p.x * sign;
            assert!((0.0..=1.0).contains(position));
            if index == 2 {
                assert!(hits(1, 0, &p) && hits(1, sign as i8, &p));
            }
        }
        assert!(positions.windows(2).all(|pair| pair[0] < pair[1]));
        assert!(positions[1] < 0.25 && positions[3] > 0.75);
        assert!((positions[1] + positions[3] - 1.0).abs() < 1e-6);
        assert!((positions[2] - 0.5).abs() < 1e-6);
        assert_eq!(positions[4], 1.0);
        assert_eq!(p.lane_cooldown, 0.0);
        assert!(!hits(1, 0, &p));
        p.tick(LANE_SECONDS, if action == LEFT { RIGHT } else { LEFT });
        assert_eq!(p.x, 0.0);
    }
}
