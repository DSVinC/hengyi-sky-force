Original prompt: 改善关卡衔接；修复拾取后不发射的玩家导弹；第一关敌机一或两枪击落，一枪敌机不射击；后续敌机和 Boss 随武器火力增加耐久。

- Confirmed missile upgrade count was HUD-only; shoot() only created cannon bullets.
- Implementing spawn-time durability snapshots, player homing missiles, and a continuous inter-stage flight.
- Validation uses the existing deterministic Node harness and the supported in-app browser, with local scenario controls.

- Completed automatic 3-second background crossfade and centered flight; retained player position at handoff and collected remaining pickups. Final level still shows results.
- Player missiles now launch, track, retarget and deal damage; levels 1/2/3 launch corresponding volleys.
- Level 1 scout has 1 HP and cannot fire; other first-level enemies have 2 HP. Later durability snapshots account for weapon upgrades.
- Validation: 20 Node tests passed. In-app browser confirmed missile hit (20 to 16 HP), upgraded Boss survival after 4.2 seconds, midpoint crossfade, automatic level 2 to 3, and final results. Browser error log empty. No physical iPhone/iPad or uninterrupted ten-level playthrough performed.
