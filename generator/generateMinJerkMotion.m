function builtMotion = generateMinJerkMotion(srcMotion)
    % GENERATEMINJERKMOTION  Generate a built motion for a minimum jerk primitive.
    %   builtMotion = generateMinJerkMotion(srcMotion) takes a source motion struct
    %   and produces a built motion struct with a minimum jerk trajectory from
    %   startValue to endValue.
    %
    %   Input:
    %       srcMotion - Struct with id, name, motionRef, parameters (duration,
    %                   magnitude, direction, startValue, endValue).
    %   Output:
    %       builtMotion - Struct with id, name, compositionDegree, color,
    %                     shortDisplayName, longDisplayName, magnitude, offset,
    %                     duration, flShape, frShape, rlShape, rrShape.

    % Extract parameters from source motion
    duration = srcMotion.parameters.duration;         % Seconds
    magnitude = srcMotion.parameters.magnitude;       % Newtons
    direction = srcMotion.parameters.direction;       % e.g., 'heave'
    startValue = srcMotion.parameters.startValue;     % Starting value (-1 to 1)
    endValue = srcMotion.parameters.endValue;         % Ending value (-1 to 1)

    % Constants
    Fs = 100;                                         % Sampling frequency (Hz)
    Ts = 1/Fs;                                        % Sampling period (0.01s)
    signalLen = round(duration * Fs);                 % Number of samples

    % Validate inputs
    if duration <= 0
        error('Duration must be positive');
    end
    if startValue < -1 || startValue > 1 || endValue < -1 || endValue > 1
        error('startValue and endValue must be between -1 and 1');
    end

    % Generate minimum jerk trajectory from startValue to endValue
    t = (0:Ts:duration-Ts)' / duration;              % Normalized time [0, 1]
    tau = 10*t.^3 - 15*t.^4 + 6*t.^5;                % Min jerk polynomial (0 to 1)
    y = startValue + (endValue - startValue) * tau;   % Scale from startValue to endValue
    y = y * ones(1, 4);                              % Replicate for 4 actuators

    % Apply direction to adjust actuator sequences
    flShape = y(:, 1);
    frShape = y(:, 2);
    rlShape = y(:, 3);
    rrShape = y(:, 4);
    switch lower(direction)
        case 'heave'
            % All actuators same
        case 'pitch'
            rlShape = -rlShape;                       % Rear opposite
            rrShape = -rrShape;
        case 'roll'
            frShape = -frShape;                       % Right side opposite
            rrShape = -rrShape;
        case 'fl'
            frShape = zeros(signalLen, 1);            % Only FL active
            rlShape = zeros(signalLen, 1);
            rrShape = zeros(signalLen, 1);
        case 'fr'
            flShape = zeros(signalLen, 1);            % Only FR active
            rlShape = zeros(signalLen, 1);
            rrShape = zeros(signalLen, 1);
        case 'rl'
            flShape = zeros(signalLen, 1);            % Only RL active
            frShape = zeros(signalLen, 1);
            rrShape = zeros(signalLen, 1);
        case 'rr'
            flShape = zeros(signalLen, 1);            % Only RR active
            frShape = zeros(signalLen, 1);
            rlShape = zeros(signalLen, 1);
        otherwise
            error('Invalid direction: %s', direction);
    end

    % Construct built motion struct
    builtMotion = struct();
    builtMotion.id = srcMotion.id;
    builtMotion.name = srcMotion.name;
    builtMotion.compositionDegree = 0;                % Primitive motion
    builtMotion.color = helperGenerateRandomColor();  % Random hex color
    builtMotion.shortDisplayName = 'MinJerk';
    builtMotion.longDisplayName = sprintf('Minimum Jerk Curve (%g to %g)', startValue, endValue);
    builtMotion.magnitude = magnitude;                % Overall force scale
    builtMotion.offset = 0;                           % Default offset
    builtMotion.duration = duration;
    builtMotion.flShape = flShape;                    % [signalLen x 1], startValue to endValue
    builtMotion.frShape = frShape;
    builtMotion.rlShape = rlShape;
    builtMotion.rrShape = rrShape;
end