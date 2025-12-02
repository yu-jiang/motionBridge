function builtMotion = generateImpulseMotion(srcMotion)
    % GENERATEIMPULSEMOTION  Generate a built motion for an impulse primitive.
    %   builtMotion = generateImpulseMotion(srcMotion) takes a source motion struct
    %   and produces a built motion struct with a brief force spike at the start.
    %
    %   Input:
    %       srcMotion - Struct with id, name, motionRef, parameters (duration, direction).
    %   Output:
    %       builtMotion - Struct with id, name, compositionDegree, color, 
    %                     shortDisplayName, longDisplayName, magnitude, offset,
    %                     duration, flShape, frShape, rlShape, rrShape.

    % Extract parameters from source motion
    duration = srcMotion.parameters.duration;         % Seconds
    direction = srcMotion.parameters.direction;       % e.g., 'heave'
    magnitude = 300;                                  % Fixed magnitude of 300N

    % Constants
    Fs = 100;                                         % Sampling frequency (Hz)
    Ts = 1/Fs;                                        % Sampling period (0.01s)
    signalLen = round(duration * Fs);                 % Number of samples

    % Validate inputs
    if duration <= 0
        error('Duration must be positive');
    end

    % Generate impulse sequence: spike at t=0, then zero
    y = zeros(signalLen, 1);
    y(1) = 1;                                         % Single-sample impulse at start (normalized to 1)
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
    builtMotion.shortDisplayName = 'Impulse';
    builtMotion.longDisplayName = 'Impulse (300N)';
    builtMotion.magnitude = magnitude;                % Fixed at 300N
    builtMotion.offset = 0;                           % Default offset
    builtMotion.duration = duration;
    builtMotion.flShape = flShape;                    % [signalLen x 1], -1 to 1
    builtMotion.frShape = frShape;
    builtMotion.rlShape = rlShape;
    builtMotion.rrShape = rrShape;
end