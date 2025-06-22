import numpy as np
import scipy.integrate as sc

class Star:
    def __init__(self,mass,initial_position_x,initial_position_y,initial_velocity_x,initial_velocity_y):
        self.mass = mass
        self.initial_position_x = initial_position_x
        self.initial_position_y = initial_position_y
        self.initial_velocity_x = initial_velocity_x
        self.initial_velocity_y = initial_velocity_y

    def getMass(self):
        return self.mass
    
    def getInitialPosition(self):
        return [self.initial_position_x,self.initial_position_y]
    
    def getInitialVelocity(self):
        return [self.initial_velocity_x,self.initial_velocity_y]
    
    def getPosition(self, time):
        return self.trajectory[time]


class StarSystem():
    def __init__(self,stars,time_span):
        self.stars = stars
        self.time_span = time_span
        self.solver = EquationSolver()
        self.zero_initial_momentum() #Sets the frame of reference on the centre of mass of the system, makes visualizations readable 

    def zero_initial_momentum(self):
        M = sum(s.mass for s in self.stars)
        vx_cm = sum(s.mass * s.initial_velocity_x for s in self.stars) / M
        vy_cm = sum(s.mass * s.initial_velocity_y for s in self.stars) / M

        for s in self.stars:
            s.initial_velocity_x -= vx_cm
            s.initial_velocity_y -= vy_cm

    def getStars(self):
        return self.stars
    
    def getTimeSpan(self):
        return self.time_span

    def getMasses(self):
        return [star.getMass() for star in self.stars]
    
    def getInitialPositions(self):
        return [coord for star in self.stars for coord in star.getInitialPosition()]
    
    def getInitialVelocities(self):
        return [coord for star in self.stars for coord in star.getInitialVelocity()]
    
    def getInitialState(self):
        return self.getInitialPositions() + self.getInitialVelocities()

    def derivative_function_n_body_problem(self, Y, masses):
        dYdt = []
        L = len(Y)
        for i in range(L//2):
            dYdt.append(Y[i+L//2])
        for i in range(0, L//2, 2):
            x_temp = 0
            y_temp = 0
            for j in range(0, L//2, 2):
                if j != i and masses[j//2] != 0:
                    dx = Y[j] - Y[i]
                    dy = Y[j+1] - Y[i+1]
                    r3 = (dx*dx + dy*dy)**(-1.5)
                    x_temp += masses[j//2] * dx * r3
                    y_temp += masses[j//2] * dy * r3
            dYdt.append(x_temp)
            dYdt.append(y_temp)
        return dYdt
    
    def getTrajectories(self, method="solve_ivp"):
        states, times = self.solver.solve_system(
        method, self.getInitialState(), self.getTimeSpan(),
        lambda t, Y: self.derivative_function_n_body_problem(Y, self.getMasses())
    )
        n = len(self.stars)
        for k, star in enumerate(self.stars):
            star.trajectory = states[:, [2*k, 2*k+1]]  
        return states, times

class EquationSolver:

    def solve_midpoint(self, initial_state, time_span, derivative_function,
                       step_size=0.01):
        t0, tf = time_span
        times, states = [t0], [np.asarray(initial_state, dtype=float)]

        t = t0
        y = states[0].copy()
        while t < tf:
            h = min(step_size, tf - t)
            k1 = np.asarray(derivative_function(t,          y))
            k2 = np.asarray(derivative_function(t + 0.5*h,  y + 0.5*h*k1))
            y  = y + h * k2
            t += h
            times.append(t)
            states.append(y.copy())

        return np.asarray(states), np.asarray(times)

    def solve_system(self, method, initial_state, time_span, derivative_function,
                     step_size=0.01):
        if method == "Midpoint":
            return self.solve_midpoint(initial_state, time_span,
                                       derivative_function, step_size)

        elif method == "solve_ivp":
            t_eval = np.arange(time_span[0], time_span[1] + step_size*0.5,
                               step_size)
            res = sc.solve_ivp(derivative_function, time_span, initial_state,
                               t_eval=t_eval, rtol=1e-9, atol=1e-12)
            return res.y.T, res.t

        else:
            raise ValueError()
