import numpy as np
import matplotlib.pyplot as plt
import random
from matplotlib.patches import Polygon

# ==========================================
# Task 1: PID Controller Tuning
# ==========================================
def task1_pid_tuning(Kp=2.5, Ki=0.3, Kd=1.5, max_noise=5.0):
    duration = 15.0
    dt = 0.1
    steps = int(duration / dt)
    setpoint = 10.0

    altitude = 0.0
    velocity = 0.0
    error_prior = 0.0
    integral = 0.0
    history_alt = []
    history_time = [i * dt for i in range(steps)]

    for i in range(steps):
        time = i * dt
        error = setpoint - altitude
        integral += error * dt
        derivative = (error - error_prior) / dt

        control_output = (Kp * error) + (Ki * integral) + (Kd * derivative)
        noise = random.uniform(-max_noise, max_noise) if time > 6.0 else 0

        acceleration = control_output - 9.8 + noise
        velocity += acceleration * dt
        altitude += velocity * dt

        if altitude < 0:
            altitude = 0
            velocity = 0

        history_alt.append(altitude)
        error_prior = error

    plt.figure(figsize=(10, 5))
    plt.plot(history_time, [setpoint]*steps, 'r--', label="Target Setpoint", alpha=0.8)
    plt.plot(history_time, history_alt, color='#1f77b4', linewidth=2, label="Drone Altitude")
    plt.axvspan(6, 15, color='gray', alpha=0.15, label="Disturbance Zone")
    plt.title(f"PID Tuning Results (Kp={Kp}, Ki={Ki}, Kd={Kd})", fontsize=12)
    plt.xlabel("Time (s)")
    plt.ylabel("Altitude (m)")
    plt.ylim(0, max(max(history_alt) + 2, 15))
    plt.grid(True, linestyle=':', alpha=0.7)
    plt.legend(loc='lower right')
    plt.savefig('PID_Controller_Tuning_Result_Plot.png')
    plt.close()

# ==========================================
# Task 2: Boat Guidance
# ==========================================
def create_boat(x, y, theta, scale=0.8):
    boat = np.array([[1.5, 0], [-1, 0.7], [-0.5, 0], [-1, -0.7]]) * scale
    R = np.array([[np.cos(theta), -np.sin(theta)], [np.sin(theta),  np.cos(theta)]])
    rotated_boat = boat @ R.T
    rotated_boat[:,0] += x
    rotated_boat[:,1] += y
    return rotated_boat

def task2_boat_guidance(kp=1.0, kd=0.0, current_x=0.0, current_y=0.0, filename="Boat_Guidance_Plot.png"):
    dt = 0.2
    T = 40
    t = np.arange(0, T, dt)
    path_x = t
    path_y = 8 * np.sin(0.2 * t)

    x, y = -5, -10
    vx, vy = 0, 0
    traj_x, traj_y, headings = [], [], []

    for i in range(len(t)):
        dx = path_x[i] - x
        dy = path_y[i] - y
        ax = kp*dx - kd*vx + current_x
        ay = kp*dy - kd*vy + current_y

        vx += ax*dt
        vy += ay*dt
        x += vx*dt
        y += vy*dt

        traj_x.append(x)
        traj_y.append(y)
        headings.append(np.arctan2(vy, vx))

    plt.figure(figsize=(10,6))
    plt.plot(path_x, path_y, '--', linewidth=2, label='Desired Path')
    plt.plot(traj_x, traj_y, linewidth=3, label='Boat Trajectory')
    plt.scatter(traj_x[0], traj_y[0], s=100, label='Start')
    plt.scatter(traj_x[-1], traj_y[-1], s=100, label='End')

    boat_shape = create_boat(traj_x[-1], traj_y[-1], headings[-1])
    boat_patch = Polygon(boat_shape, closed=True)
    plt.gca().add_patch(boat_patch)

    if current_x != 0 or current_y != 0:
        plt.quiver(traj_x[-1], traj_y[-1], current_x, current_y, scale=5)

    plt.title(f'Boat Guidance | Gain={kp} | Damping={kd} | Disturbance ({current_x},{current_y})')
    plt.xlabel('X Position')
    plt.ylabel('Y Position')
    plt.grid(True)
    plt.legend()
    plt.xlim(min(path_x)-5, max(path_x)+5)
    plt.ylim(min(path_y)-15, max(path_y)+15)
    plt.savefig(filename)
    plt.close()

# ==========================================
# Bonus Task: Figure-Eight Drone Simulation
# ==========================================
def bonus_figure_eight_drone():
    dt = 0.1
    T = 20.0
    t = np.arange(0, T, dt)
    
    # Parametric equations for figure-eight (Lemniscate of Bernoulli)
    a = 10
    path_x = a * np.cos(t) / (1 + np.sin(t)**2)
    path_y = a * np.sin(t) * np.cos(t) / (1 + np.sin(t)**2)
    
    Kp = 2.0
    Kd = 1.0
    current_x = 0.5 # Wind disturbance
    current_y = -0.3
    
    x, y = 0.0, 0.0
    vx, vy = 0.0, 0.0
    traj_x, traj_y = [], []
    
    for i in range(len(t)):
        dx = path_x[i] - x
        dy = path_y[i] - y
        
        ax = Kp * dx - Kd * vx + current_x
        ay = Kp * dy - Kd * vy + current_y
        
        vx += ax * dt
        vy += ay * dt
        x += vx * dt
        y += vy * dt
        
        traj_x.append(x)
        traj_y.append(y)
        
    plt.figure(figsize=(8,6))
    plt.plot(path_x, path_y, 'r--', label='Desired Figure-8 Path')
    plt.plot(traj_x, traj_y, 'b-', linewidth=2, label='Drone Trajectory')
    plt.scatter(traj_x[0], traj_y[0], color='green', s=100, label='Start')
    plt.scatter(traj_x[-1], traj_y[-1], color='orange', s=100, label='End')
    plt.title(f'Figure-Eight Drone Trajectory with Wind Disturbance\nKp={Kp}, Kd={Kd}')
    plt.xlabel('X Position')
    plt.ylabel('Y Position')
    plt.legend()
    plt.grid(True)
    plt.savefig('Figure_Eight_Drone_Simulation.png')
    plt.close()

if __name__ == "__main__":
    # Task 1
    task1_pid_tuning(Kp=3.0, Ki=0.5, Kd=2.0, max_noise=5.0)
    print("Saved PID_Controller_Tuning_Result_Plot.png")
    
    # Task 2 without disturbance
    task2_boat_guidance(kp=1.0, kd=0.5, current_x=0.0, current_y=0.0, filename="Boat_Guidance_Without_Disturbance.png")
    print("Saved Boat_Guidance_Without_Disturbance.png")
    
    # Task 2 with disturbance
    task2_boat_guidance(kp=1.2, kd=0.8, current_x=0.5, current_y=0.5, filename="Boat_Guidance_With_Disturbance.png")
    print("Saved Boat_Guidance_With_Disturbance.png")
    
    # Bonus Task
    bonus_figure_eight_drone()
    print("Saved Figure_Eight_Drone_Simulation.png")
