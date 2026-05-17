import type { MuscleGroupDTO, ExerciseDTO } from '../types/domain.js';

export const muscleGroups: MuscleGroupDTO[] = [
    { id: 'mg_chest', slug: 'chest', name: 'Chest' },
    { id: 'mg_back', slug: 'back', name: 'Back' },
    { id: 'mg_legs', slug: 'legs', name: 'Legs' },
    { id: 'mg_shoulders', slug: 'shoulders', name: 'Shoulders' },
    { id: 'mg_biceps', slug: 'biceps', name: 'Biceps' },
    { id: 'mg_triceps', slug: 'triceps', name: 'Triceps' },
    { id: 'mg_core', slug: 'core', name: 'Core' },
    { id: 'mg_cardio', slug: 'cardio', name: 'Cardio' },
    { id: 'mg_forearms', slug: 'forearms', name: 'Forearms' },
    { id: 'mg_glutes', slug: 'glutes', name: 'Glutes' },
    { id: 'mg_calves', slug: 'calves', name: 'Calves' },
    { id: 'mg_traps', slug: 'traps', name: 'Traps' },
    { id: 'mg_full_body', slug: 'full-body', name: 'Full Body' },
];

/**
 * Convenience constructor — defaults `tracksTime` to false so the strength
 * rows stay terse while the time-based ones spell it out explicitly.
 */
function ex(
    id: string,
    name: string,
    muscleGroupId: string,
    tracksTime = false
): ExerciseDTO {
    return { id, name, muscleGroupId, tracksTime };
}

export const exercises: ExerciseDTO[] = [
    // ── Chest ──────────────────────────────────────────────────────────────
    ex('ex_bench_press', 'Barbell Bench Press', 'mg_chest'),
    ex('ex_incline_bb_press', 'Incline Barbell Press', 'mg_chest'),
    ex('ex_incline_db_press', 'Incline Dumbbell Press', 'mg_chest'),
    ex('ex_decline_bench', 'Decline Bench Press', 'mg_chest'),
    ex('ex_db_bench_press', 'Dumbbell Bench Press', 'mg_chest'),
    ex('ex_chest_fly', 'Cable Chest Fly', 'mg_chest'),
    ex('ex_db_fly', 'Dumbbell Fly', 'mg_chest'),
    ex('ex_pec_deck', 'Pec Deck', 'mg_chest'),
    ex('ex_pushup', 'Push Up', 'mg_chest'),
    ex('ex_incline_pushup', 'Incline Push Up', 'mg_chest'),
    ex('ex_chest_dip', 'Chest Dip', 'mg_chest'),
    ex('ex_svend_press', 'Svend Press', 'mg_chest'),

    // ── Back ───────────────────────────────────────────────────────────────
    ex('ex_deadlift', 'Deadlift', 'mg_back'),
    ex('ex_rom_deadlift', 'Romanian Deadlift', 'mg_back'),
    ex('ex_pullup', 'Pull Up', 'mg_back'),
    ex('ex_chinup', 'Chin Up', 'mg_back'),
    ex('ex_lat_pulldown', 'Lat Pulldown', 'mg_back'),
    ex('ex_barbell_row', 'Barbell Row', 'mg_back'),
    ex('ex_db_row', 'Dumbbell Row', 'mg_back'),
    ex('ex_cable_row', 'Seated Cable Row', 'mg_back'),
    ex('ex_tbar_row', 'T-Bar Row', 'mg_back'),
    ex('ex_pendlay_row', 'Pendlay Row', 'mg_back'),
    ex('ex_pullover', 'Dumbbell Pullover', 'mg_back'),
    ex('ex_back_extension', 'Back Extension', 'mg_back'),
    ex('ex_shrug', 'Barbell Shrug', 'mg_back'),

    // ── Legs (quads + hams together; calves & glutes split out) ────────────
    ex('ex_back_squat', 'Back Squat', 'mg_legs'),
    ex('ex_front_squat', 'Front Squat', 'mg_legs'),
    ex('ex_goblet_squat', 'Goblet Squat', 'mg_legs'),
    ex('ex_bulg_split_squat', 'Bulgarian Split Squat', 'mg_legs'),
    ex('ex_hack_squat', 'Hack Squat', 'mg_legs'),
    ex('ex_leg_press', 'Leg Press', 'mg_legs'),
    ex('ex_lunges', 'Walking Lunges', 'mg_legs'),
    ex('ex_reverse_lunge', 'Reverse Lunge', 'mg_legs'),
    ex('ex_leg_extension', 'Leg Extension', 'mg_legs'),
    ex('ex_leg_curl', 'Leg Curl', 'mg_legs'),
    ex('ex_stiff_leg_dl', 'Stiff-Leg Deadlift', 'mg_legs'),
    ex('ex_box_jump', 'Box Jump', 'mg_legs'),
    ex('ex_seated_ham_curl', 'Seated Hamstring Curl', 'mg_legs'),
    ex('ex_lying_ham_curl', 'Lying Hamstring Curl', 'mg_legs'),
    ex('ex_db_rdl', 'Dumbbell Romanian Deadlift', 'mg_legs'),
    ex('ex_db_lunges', 'Dumbbell Lunges', 'mg_legs'),
    ex('ex_wall_sit', 'Wall Sit', 'mg_legs', true), // isometric — time-based

    // ── Shoulders ──────────────────────────────────────────────────────────
    ex('ex_ohp', 'Overhead Press', 'mg_shoulders'),
    ex('ex_seated_db_press', 'Seated Dumbbell Press', 'mg_shoulders'),
    ex('ex_arnold_press', 'Arnold Press', 'mg_shoulders'),
    ex('ex_push_press', 'Push Press', 'mg_shoulders'),
    ex('ex_lateral_raise', 'Lateral Raise', 'mg_shoulders'),
    ex('ex_cable_lateral', 'Cable Lateral Raise', 'mg_shoulders'),
    ex('ex_front_raise', 'Front Raise', 'mg_shoulders'),
    ex('ex_reverse_fly', 'Reverse Fly', 'mg_shoulders'),
    ex('ex_face_pull', 'Face Pull', 'mg_shoulders'),
    ex('ex_upright_row', 'Upright Row', 'mg_shoulders'),

    // ── Biceps ─────────────────────────────────────────────────────────────
    ex('ex_barbell_curl', 'Barbell Curl', 'mg_biceps'),
    ex('ex_ez_curl', 'EZ-Bar Curl', 'mg_biceps'),
    ex('ex_db_curl', 'Dumbbell Curl', 'mg_biceps'),
    ex('ex_hammer_curl', 'Hammer Curl', 'mg_biceps'),
    ex('ex_preacher_curl', 'Preacher Curl', 'mg_biceps'),
    ex('ex_concentration_curl', 'Concentration Curl', 'mg_biceps'),
    ex('ex_incline_curl', 'Incline Dumbbell Curl', 'mg_biceps'),
    ex('ex_cable_curl', 'Cable Curl', 'mg_biceps'),
    ex('ex_spider_curl', 'Spider Curl', 'mg_biceps'),
    ex('ex_21s', '21s', 'mg_biceps'),
    ex('ex_cable_rope_curl', 'Cable Rope Curl', 'mg_biceps'),
    ex('ex_cable_hammer_curl', 'Cable Hammer Curl', 'mg_biceps'),
    ex('ex_single_arm_cable_curl', 'Single-Arm Cable Curl', 'mg_biceps'),
    ex('ex_bayesian_cable_curl', 'Bayesian Cable Curl', 'mg_biceps'),
    ex('ex_overhead_cable_curl', 'Overhead Cable Curl', 'mg_biceps'),

    // ── Triceps ────────────────────────────────────────────────────────────
    ex('ex_tricep_pushdown', 'Tricep Pushdown', 'mg_triceps'),
    ex('ex_rope_pushdown', 'Rope Pushdown', 'mg_triceps'),
    ex('ex_skullcrusher', 'Skullcrusher', 'mg_triceps'),
    ex('ex_oh_tricep_ext', 'Overhead Tricep Extension', 'mg_triceps'),
    ex('ex_db_oh_ext', 'Dumbbell Overhead Extension', 'mg_triceps'),
    ex('ex_close_grip_bench', 'Close Grip Bench Press', 'mg_triceps'),
    ex('ex_diamond_pushup', 'Diamond Push Up', 'mg_triceps'),
    ex('ex_dips', 'Tricep Dips', 'mg_triceps'),
    ex('ex_kickback', 'Tricep Kickback', 'mg_triceps'),
    ex('ex_oh_tri_vbar', 'Overhead Tricep V-Bar Extension', 'mg_triceps'),
    ex('ex_db_kickback', 'Tricep Kickback (Dumbbell)', 'mg_triceps'),
    ex('ex_vgrip_pushdown', 'Tricep Pushdown (V-Grip)', 'mg_triceps'),
    ex('ex_oh_rope_ext', 'Overhead Rope Extension', 'mg_triceps'),
    ex('ex_single_db_oh_ext', 'Single-Arm Overhead Dumbbell Extension', 'mg_triceps'),

    // ── Core ───────────────────────────────────────────────────────────────
    ex('ex_plank', 'Plank', 'mg_core', true),               // isometric — time
    ex('ex_side_plank', 'Side Plank', 'mg_core', true),     // isometric — time
    ex('ex_hanging_leg_raise', 'Hanging Leg Raise', 'mg_core'),
    ex('ex_lying_leg_raise', 'Lying Leg Raise', 'mg_core'),
    ex('ex_russian_twist', 'Russian Twist', 'mg_core'),
    ex('ex_crunches', 'Crunches', 'mg_core'),
    ex('ex_situps', 'Sit Ups', 'mg_core'),
    ex('ex_bicycle_crunch', 'Bicycle Crunch', 'mg_core'),
    ex('ex_ab_wheel', 'Ab Wheel Rollout', 'mg_core'),
    ex('ex_mountain_climber', 'Mountain Climber', 'mg_core', true), // commonly timed
    ex('ex_dead_bug', 'Dead Bug', 'mg_core'),
    ex('ex_oblique_crunch', 'Oblique Crunch', 'mg_core'),
    ex('ex_side_bend_db', 'Dumbbell Side Bend', 'mg_core'),
    ex('ex_cable_woodchop', 'Cable Woodchopper', 'mg_core'),
    ex('ex_hanging_oblique_raise', 'Hanging Oblique Knee Raise', 'mg_core'),

    // ── Cardio (every cardio entry is time-based by definition) ────────────
    ex('ex_treadmill', 'Treadmill Run', 'mg_cardio', true),
    ex('ex_outdoor_run', 'Outdoor Run', 'mg_cardio', true),
    ex('ex_cycling', 'Cycling', 'mg_cardio', true),
    ex('ex_rowing', 'Rowing Machine', 'mg_cardio', true),
    ex('ex_elliptical', 'Elliptical', 'mg_cardio', true),
    ex('ex_stairmaster', 'Stairmaster', 'mg_cardio', true),
    ex('ex_jump_rope', 'Jump Rope', 'mg_cardio', true),
    ex('ex_hiit', 'HIIT', 'mg_cardio', true),
    ex('ex_walk', 'Brisk Walk', 'mg_cardio', true),
    ex('ex_swim', 'Swim', 'mg_cardio', true),
    ex('ex_skiing', 'Skiing', 'mg_cardio', true),
    ex('ex_ski_erg', 'Ski Erg', 'mg_cardio', true),

    // ── Forearms ───────────────────────────────────────────────────────────
    ex('ex_wrist_curl', 'Wrist Curl', 'mg_forearms'),
    ex('ex_reverse_wrist_curl', 'Reverse Wrist Curl', 'mg_forearms'),
    ex('ex_reverse_curl', 'Reverse Curl', 'mg_forearms'),
    ex('ex_farmers_walk', "Farmer's Walk", 'mg_forearms', true), // loaded carry — time
    ex('ex_plate_pinch', 'Plate Pinch', 'mg_forearms', true),     // isometric — time
    ex('ex_dead_hang', 'Dead Hang', 'mg_forearms', true),         // isometric — time
    ex('ex_wrist_roller', 'Wrist Roller', 'mg_forearms'),

    // ── Glutes ─────────────────────────────────────────────────────────────
    ex('ex_hip_thrust', 'Hip Thrust', 'mg_glutes'),
    ex('ex_glute_bridge', 'Glute Bridge', 'mg_glutes'),
    ex('ex_cable_pull_through', 'Cable Pull Through', 'mg_glutes'),
    ex('ex_step_up', 'Step Up', 'mg_glutes'),
    ex('ex_sumo_deadlift', 'Sumo Deadlift', 'mg_glutes'),
    ex('ex_glute_kickback', 'Glute Kickback', 'mg_glutes'),
    ex('ex_donkey_kick', 'Donkey Kick', 'mg_glutes'),
    ex('ex_fire_hydrant', 'Fire Hydrant', 'mg_glutes'),

    // ── Calves ─────────────────────────────────────────────────────────────
    ex('ex_standing_calf', 'Standing Calf Raise', 'mg_calves'),
    ex('ex_seated_calf', 'Seated Calf Raise', 'mg_calves'),
    ex('ex_donkey_calf', 'Donkey Calf Raise', 'mg_calves'),
    ex('ex_calf_press', 'Calf Press (Leg Press)', 'mg_calves'),
    ex('ex_single_leg_calf', 'Single-Leg Calf Raise', 'mg_calves'),

    // ── Traps ──────────────────────────────────────────────────────────────
    ex('ex_traps_bb_shrug', 'Barbell Shrug', 'mg_traps'),
    ex('ex_traps_db_shrug', 'Dumbbell Shrug', 'mg_traps'),
    ex('ex_traps_cable_shrug', 'Cable Shrug', 'mg_traps'),
    ex('ex_traps_smith_shrug', 'Smith Machine Shrug', 'mg_traps'),
    ex('ex_traps_trap_bar_shrug', 'Trap Bar Shrug', 'mg_traps'),
    ex('ex_traps_rack_pull', 'Rack Pull', 'mg_traps'),
    ex('ex_traps_farmer_carry', "Farmer's Carry", 'mg_traps', true), // loaded carry — time
    ex('ex_traps_face_pull', 'Face Pull', 'mg_traps'),
    ex('ex_traps_upright_row', 'Upright Row', 'mg_traps'),
    ex('ex_traps_db_high_pull', 'Dumbbell High Pull', 'mg_traps'),

    // ── Full Body ──────────────────────────────────────────────────────────
    ex('ex_burpee', 'Burpee', 'mg_full_body'),
    ex('ex_clean_press', 'Clean and Press', 'mg_full_body'),
    ex('ex_kb_swing', 'Kettlebell Swing', 'mg_full_body'),
    ex('ex_turkish_getup', 'Turkish Get Up', 'mg_full_body'),
    ex('ex_thruster', 'Thruster', 'mg_full_body'),
    ex('ex_snatch', 'Snatch', 'mg_full_body'),
    ex('ex_clean', 'Power Clean', 'mg_full_body'),
    ex('ex_man_maker', 'Man Maker', 'mg_full_body'),
];