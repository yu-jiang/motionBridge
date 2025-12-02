function builtMotion = generateTwinPeakMotion(srcMotion)
    % GENERATETWINPEAKMOTION  Generate a built motion for a twin-peak primitive.
    %   builtMotion = generateTwinPeakMotion(srcMotion) takes a source motion struct
    %   and produces a built motion struct with a double-peaked, smoothed trajectory.
    %
    %   Input:
    %       srcMotion - Struct with id, name, motionRef, parameters (duration,
    %                   magnitude, direction, firstPeakTime, firstPeakValue,
    %                   secondPeakTime, secondPeakValue).
    %   Output:
    %       builtMotion - Struct with id, name, compositionDegree, color,
    %                     shortDisplayName, longDisplayName, magnitude, offset,
    %                     duration, flShape, frShape, rlShape, rrShape.

    % Extract parameters from source motion
    duration = srcMotion.parameters.duration;         % Seconds
    magnitude = srcMotion.parameters.magnitude;       % Newtons
    direction = srcMotion.parameters.direction;       % e.g., 'heave'
    firstPeakTime = srcMotion.parameters.firstPeakTime; % Time of first peak
    firstPeakValue = srcMotion.parameters.firstPeakValue; % Value of first peak (-1 to 1)
    secondPeakTime = srcMotion.parameters.secondPeakTime; % Time of second peak
    secondPeakValue = srcMotion.parameters.secondPeakValue; % Value of second peak (-1 to 1)

    % Constants
    Fs = 100;                                         % Sampling frequency (Hz)
    Ts = 1/Fs;                                        % Sampling period (0.01s)
    signalLen = round(duration * Fs);                 % Number of samples
    endTime = duration;                               % Alias for clarity
    c = 0.5;                                          % Smoothing factor

    % Validate inputs
    if duration <= 0
        error('Duration must be positive');
    end
    if firstPeakTime < 0 || firstPeakTime >= secondPeakTime || secondPeakTime > duration
        error('firstPeakTime must be >= 0 and < secondPeakTime, secondPeakTime must be <= duration');
    end
    if firstPeakValue < -1 || firstPeakValue > 1 || secondPeakValue < -1 || secondPeakValue > 1
        error('firstPeakValue and secondPeakValue must be between -1 and 1');
    end

    % Define twin-peak shape points
    xy = [0, 0;
          firstPeakTime * c, c * firstPeakValue;
          firstPeakTime, firstPeakValue;
          secondPeakTime, secondPeakValue;          
          endTime - (endTime - secondPeakTime) * c, c * secondPeakValue;
          endTime, 0];
    t = (0:Ts:duration)';
    y = interp1(xy(:, 1), xy(:, 2), t, 'pchip');     % PCHIP interpolation
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
    builtMotion.shortDisplayName = 'TwinPeak';
    builtMotion.longDisplayName = sprintf('Twin Peak (%g at %gs, %g at %gs)', ...
        firstPeakValue, firstPeakTime, secondPeakValue, secondPeakTime);
    builtMotion.magnitude = magnitude;                % Overall force scale
    builtMotion.offset = 0;                           % Default offset
    builtMotion.duration = duration;
    builtMotion.flShape = flShape;                    % [signalLen x 1], -1 to 1
    builtMotion.frShape = frShape;
    builtMotion.rlShape = rlShape;
    builtMotion.rrShape = rrShape;
end