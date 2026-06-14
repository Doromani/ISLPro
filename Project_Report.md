# Project Report: Introduction to Guidance and Control Using Python Simulations

## 1. Project Overview

**Project Title:** Advanced Drone Technology - Introduction to Guidance and Control Using Python Simulations
**Objective:** The primary goal of this assignment is to understand the fundamentals of guidance and control for autonomous moving systems. This involves exploring PID controller tuning, observing the effects of environmental disturbances, developing intuition for feedback-based systems, and implementing trajectory/path-following concepts for drones and boats using Python.

## 2. Methodology and Implementation

The project was divided into two main tasks and one creative bonus task. All simulations were implemented in Python, leveraging physical models of movement, feedback controllers, and visualization tools such as `matplotlib`.

### Task 1: Understanding PID Controller Design Using Drone Altitude Control
In this task, we implemented a simulation for a drone attempting to reach and maintain a desired altitude of 10.0 meters. 
- **Controller Used:** PID (Proportional-Integral-Derivative) Controller.
- **Parameters:** We tuned the controller using Kp (Power), Ki (Memory), and Kd (Brakes).
- **Disturbance:** A "wind disturbance" zone was introduced after 6 seconds of flight to test the stability and recovery of the controller.

**Implementation Details:**
The physics loop calculated the tracking error at each time step `dt = 0.1s`. The control output was calculated using the PID formula, which then acted as thrust against gravity (`-9.8 m/s²`). A random noise element was added to acceleration after 6 seconds to simulate wind.

### Task 2: Understanding Guidance and Path Tracking Using an Autonomous Boat
This task involved simulating an autonomous boat navigating along a predefined sinusoidal path (`path_y = 8 * sin(0.2 * t)`).
- **Controller Used:** PD (Proportional-Derivative) based guidance law.
- **Disturbance:** We introduced constant water currents (`current_x`, `current_y`) to drift the boat off course.

**Implementation Details:**
The guidance system calculated the difference between the desired path coordinates and the boat's current position. This tracking error, combined with a damping derivative factor, determined the acceleration applied to the boat.

### Bonus Task: Figure-Eight Drone Trajectory
For the creative bonus task, we simulated a drone following a complex figure-eight trajectory using parametric equations (Lemniscate of Bernoulli).
- **Controller:** PD Controller.
- **Disturbance:** A constant external wind drift (`current_x=0.5`, `current_y=-0.3`) was applied.

## 3. Results and Observations

### 3.1 Drone Altitude Control (PID Tuning)
The controller was optimally tuned to the following values:
*   **Proportional Gain (Kp):** 3.0
*   **Integral Gain (Ki):** 0.5
*   **Derivative Gain (Kd):** 2.0

> [!TIP]
> **Observation:** The P-gain was responsible for the rapid initial ascent. The D-gain helped minimize the overshoot by applying "brakes" as the drone approached the 10m mark. The I-gain was crucial for eliminating steady-state error, especially when the wind disturbance was introduced at the 6-second mark, allowing the drone to maintain stability despite the fluctuating wind.

![PID Tuning Result](C:/Users/Lenovo/.gemini/antigravity-ide/brain/fb776637-b40f-47ae-bb75-130ec17a39cd/PID_Controller_Tuning_Result_Plot.png)

### 3.2 Boat Guidance (Ideal Conditions)
Under ideal conditions with no external disturbances (`current_x=0`, `current_y=0`), the boat was able to track the trajectory very accurately.
*   **Gain (kp):** 1.0
*   **Damping (kd):** 0.5

![Boat Without Disturbance](C:/Users/Lenovo/.gemini/antigravity-ide/brain/fb776637-b40f-47ae-bb75-130ec17a39cd/Boat_Guidance_Without_Disturbance.png)

### 3.3 Boat Guidance (With Disturbance)
With a water current introduced (`current_x=0.5`, `current_y=0.5`), the boat experienced initial drift. By increasing the tracking gain and damping slightly, the boat was able to compensate for the drift and successfully track the desired sinusoidal path.
*   **Gain (kp):** 1.2
*   **Damping (kd):** 0.8

> [!NOTE]
> **Observation:** The addition of the external current required a stronger proportional pull and higher damping to prevent the boat from oscillating excessively around the target path.

![Boat With Disturbance](C:/Users/Lenovo/.gemini/antigravity-ide/brain/fb776637-b40f-47ae-bb75-130ec17a39cd/Boat_Guidance_With_Disturbance.png)

### 3.4 Figure-Eight Trajectory Simulation
The drone successfully tracked the complex figure-eight parametric path. Even with the introduction of a constant wind drift vector, the proportional-derivative control system maintained tight tracking along the curves of the trajectory.

![Figure Eight Drone](C:/Users/Lenovo/.gemini/antigravity-ide/brain/fb776637-b40f-47ae-bb75-130ec17a39cd/Figure_Eight_Drone_Simulation.png)

## 4. Conclusion
Through these simulations, the core principles of Guidance, Navigation, and Control (GNC) were successfully demonstrated. The PID tuning process highlighted the trade-offs between response speed, overshoot, and stability. The path-following algorithms proved robust against both random noise (wind gusts) and constant disturbances (water currents), illustrating the effectiveness of feedback-based control systems in autonomous vehicles.
