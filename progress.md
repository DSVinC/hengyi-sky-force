Original prompt: 改善关卡衔接；修复拾取后不发射的玩家导弹；第一关敌机一或两枪击落，一枪敌机不射击；后续敌机和 Boss 随武器火力增加耐久。

- Confirmed missile upgrade count was HUD-only; shoot() only created cannon bullets.
- Implementing spawn-time durability snapshots, player homing missiles, and a continuous inter-stage flight.
- Validation uses the existing deterministic Node harness and the supported in-app browser, with local scenario controls.

- Completed automatic 3-second background crossfade and centered flight; retained player position at handoff and collected remaining pickups. Final level still shows results.
- Player missiles now launch, track, retarget and deal damage; levels 1/2/3 launch corresponding volleys.
- Level 1 scout has 1 HP and cannot fire; other first-level enemies have 2 HP. Later durability snapshots account for weapon upgrades.
- Validation: 20 Node tests passed. In-app browser confirmed missile hit (20 to 16 HP), upgraded Boss survival after 4.2 seconds, midpoint crossfade, automatic level 2 to 3, and final results. Browser error log empty. No physical iPhone/iPad or uninterrupted ten-level playthrough performed.

- Extended all ten normal-wave schedules to exactly twice their previous elapsed frame count, with twice the enemies at the same cadence.
- Boss arsenals now rotate through 1/2/3/4 projectile types. Durability multipliers are 1/1.4/1.9/2.5, with a 35% floor over the previous spawned boss. Restart resets that floor.
- Validation: 23 tests passed; all four bosses ran 1,200 update/render frames with balanced Canvas save/restore and 23/26/33/40 attack volleys. This revision used deterministic simulation, not a new browser playthrough.

- Fixed initial old-art flash: a dedicated loading screen gates opening render and start input until player-1 and background are ready. Explicit failures or a 10-second timeout release the gate to existing fallback art.
- Validation: 26 deterministic tests pass, including pending/no-fallback, both assets ready, explicit failure, and stalled loading. No new browser acceptance claimed for this patch.
