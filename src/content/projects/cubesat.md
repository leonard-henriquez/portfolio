---
title: "CubeSat: a satellite from spare parts"
shortTitle: CubeSat
status: building
start: 2026
end: present
role: Solo project
order: 11
summary: "A satellite built at home, one module at a time, from the electronics already in my drawer. The first module is attitude control, assembled and coded now as a one-axis bench demonstrator; power, radio, structure and payload come after."
focus: A home-built satellite, starting with attitude control
dek: A satellite that flies, not a desk model, built one module at a time from spare parts.
stack: [Raspberry Pi Pico 2 W, MPU-6050, QMC5883L, SimpleFOC]
tags: [hardware, space, control]
excerpt: "Attitude control comes first because most other modules depend on it: solar panels must face the sun, an antenna the ground station, a sensor its target. The first version turns a platform hung from a thread about one vertical axis: a gyroscope and a magnetometer fused into a heading, a PD law, and a brushless gimbal motor as reaction wheel, for about €50–60 of new parts."
images:
  photo:
    src: ../../assets/photo/night.jpg
    alt: Mountain ridge under a starry night sky
    caption: Ridge, night
    position: center 30%
  pixel:
    src: ../../assets/pixel/night.png
    alt: Pixelated mountain ridge under a night sky
    caption: Night, 120×74 px
  illustration:
    src: ../../assets/illustration/clouds.jpg
    alt: "Pixel art: a hiker resting on a grassy slope above a sea of clouds"
    caption: Clouds
    position: 60% 20%
    zoom: 1.8
  illustrationPixel:
    src: ../../assets/pixel/clouds.png
    alt: "Pixel detail: a hiker resting above the clouds"
    caption: Clouds, 256×171 px
    position: 60% 30%
    zoom: 2.4
---

A CubeSat is a satellite built from 10 cm cubes. I am building one at home, one module at a time, starting from the electronics already in my drawer: an Arduino Uno, a few Raspberry Pis and an MPU-6050 motion sensor. The first module is attitude control, the part that knows which way the satellite points and turns it where it should. It is being assembled and coded now as a one-axis bench demonstrator; power, radio, structure and payload come after.

## Why a CubeSat

The project started at the end of my time at Flatlooker. The aim is a satellite that flies, not a desk model, within three constraints:

- **Small:** a few units at most, a unit (1U) being one 10 cm cube.
- **Useful:** a mission that measures something worth measuring, with or without AI on board.
- **Mostly funded from outside:** at least the launch sponsored, so my own share stays reasonable.

Until then, each module is built and proven on the ground first, with parts I buy myself.

## Starting with attitude control

Attitude control comes first because most other modules depend on it: solar panels must face the sun, an antenna the ground station, a sensor its target. An ADCS (attitude determination and control system) has two halves.

- **Determination** estimates the orientation. A gyroscope measures how fast the body turns but drifts over time; a magnetometer reads the Earth's field and gives an absolute reference to correct it.
- **Control** turns the body. A reaction wheel spun one way turns the satellite the other way; magnetorquers, coils that push against the Earth's field, stop a tumble and unload the wheel.

It is also the module where software carries the most weight: sensor fusion, control laws and simulation before hardware.

## The first module: one axis, one wheel

Rather than three axes at once, the first version controls a platform hung from a thread, turning about a single vertical axis. It is done when the platform can:

1. estimate its heading by fusing the gyroscope and the magnetometer;
2. stop its own rotation: spun by hand, the wheel brings it to rest;
3. turn to a commanded heading and hold it within a few degrees;
4. stream its logs over Wi-Fi to a laptop, so each of the above is measured, not eyeballed.

| Part | Role | Cost |
| --- | --- | --- |
| MPU-6050 | Gyroscope: rotation rate | Already owned |
| Arduino Uno | First sensor tests | Already owned |
| Raspberry Pi 4 | Receives the logs | Already owned |
| LEDs, buzzer, breadboard | System status, wiring | Already owned |
| Raspberry Pi Pico 2 W | Control loop and Wi-Fi | ~€8 |
| GY-271 (QMC5883L) | Magnetometer: heading reference | ~€5.50 |
| 2204 260KV gimbal motor | Reaction wheel | ~€8 |
| SimpleFOC Mini | Motor driver | ~€6 |
| AS5600 encoder | Wheel speed | ~€3–5 |
| Washers | Flywheel mass | ~€3–5 |
| USB-C PD trigger, 5 V converter | Power from a power bank | ~€5 |
| Fishing swivel, braided line | Near-frictionless suspension | ~€5 |
| Plywood or foam board | Platform | ~€5–10 |

About €50–60 of new parts in all, and nearly every one carries over to the three-axis version.

## How it works

The loop runs on the Pico. Each cycle reads both sensors, updates the heading estimate, computes the torque the platform needs and asks the motor to apply the opposite torque to the wheel.

```
sensors → heading estimate → PD law → wheel torque −u → platform turns → sensors
```

The loop closes through the platform itself: the turn the wheel causes is what the sensors read on the next cycle.

**Estimate.** The gyroscope is smooth but drifts; the magnetometer is noisy but does not drift. A complementary filter trusts the gyroscope over short times and the magnetometer over long ones:

```
ψ_est[k] = α · (ψ_est[k−1] + ω_z · Δt) + (1 − α) · ψ_mag
```

**Control.** A PD law on the heading error gives the torque u the platform needs. What the wheel gains in angular momentum the platform loses, so the motor drives the wheel with the opposite torque:

```
u = K_p · (ψ_ref − ψ_est) − K_d · ω_z
τ_wheel = −u
I_p · dω_z/dt = u
```

Stopping a spin is the same law with K_p = 0: only the damping term acts.

**Watch the wheel.** The encoder gives the wheel's speed, so the momentum it has absorbed is always known. A wheel that keeps absorbing disturbances spins up until it saturates; unloading it is the magnetorquers' job, in a later version.

## Trade-offs, chosen on purpose

| Choice | What it costs |
| --- | --- |
| One axis before three | Less like a real satellite, but every behaviour can be seen and measured on a table |
| Brushless gimbal motor driven in FOC, not a brushed DC motor | A few euros more, but smooth torque down to near-zero speed, and the encoder measures the momentum stored |
| Magnetometer as the only absolute reference, no sun sensors yet | Indoors, nearby metal bends the field: the heading is stable but relative, which is enough for a proof of concept |
| Pico 2 W instead of the Uno already owned | €8 spent, but room for three I2C sensors and the control loop, plus Wi-Fi for the logs |
| Magnetometer on a 10–15 cm mast | The wheel's magnets would skew it otherwise; it is still calibrated with the motor running |
| Hung from a fishing swivel | Almost no friction for about €5, with only the vertical axis free |
| A ground demonstrator, not flight hardware | Nothing here is rated for vacuum, radiation or launch vibration; a flight version is another order of cost |

## What comes next

The rest of attitude control first, then the other modules a satellite needs:

1. **Sun sensors:** photodiodes on the faces, a second absolute reference that magnetism cannot bend.
2. **Magnetorquers:** hand-wound coils for B-dot detumbling and wheel unloading, tested inside a Helmholtz cage that recreates the orbital field.
3. **Three axes:** two more wheel, driver and encoder sets, a 9-axis IMU, and a filter on quaternions, from Madgwick to a multiplicative Kalman filter.
4. **Power:** a battery pack and its regulation, then solar panels at integration.
5. **On-board computer and telemetry:** a Raspberry Pi Zero for estimation and downlink.
6. **Structure:** everything integrated into a 1U frame.
7. **Mission and launch:** the payload, and a sponsor for the ride to orbit.

## Status

In progress. The attitude control module is being assembled and its firmware written; bench results, such as heading accuracy and time to stop a spin, will land here once the tests run. The code is not public yet.
