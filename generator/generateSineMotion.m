function builtMotion = generateSineMotion(srcMotion)
    % Sampling frequency
    Fs = 100;
    Ts = 1/Fs;
    duration = srcMotion.parameters.duration;
    magnitude = srcMotion.parameters.magnitude;
    frequency = srcMotion.parameters.frequency;
    direction = srcMotion.parameters.direction;
    
    signalLen = round(duration * Fs);
    t = (0:Ts:duration-Ts)';
    
    % Generate sine wave
    y = sin(2 * pi * frequency * t);
    y = y * ones(1, 4); % Replicate for 4 actuators
    
    % Apply direction
    flShape = y(:, 1);
    frShape = y(:, 2);
    rlShape = y(:, 3);
    rrShape = y(:, 4);
    switch lower(direction)
        case 'heave'
            % All actuators same
        case 'pitch'
            rlShape = -rlShape;
            rrShape = -rrShape;
        case 'roll'
            frShape = -frShape;
            rrShape = -rrShape;
        case {'fl', 'fr', 'rl', 'rr'}
            if ~strcmp(direction, 'fl'), flShape = zeros(signalLen, 1); end
            if ~strcmp(direction, 'fr'), frShape = zeros(signalLen, 1); end
            if ~strcmp(direction, 'rl'), rlShape = zeros(signalLen, 1); end
            if ~strcmp(direction, 'rr'), rrShape = zeros(signalLen, 1); end
        otherwise
            error('Invalid direction: %s', direction);
    end
    
    % Construct built motion
    builtMotion = struct();
    builtMotion.id = srcMotion.id;
    builtMotion.name = srcMotion.name;
    builtMotion.compositionDegree = 0;
    builtMotion.color = helperGenerateRandomColor();
    builtMotion.shortDisplayName = 'Sine';
    builtMotion.longDisplayName = sprintf('Sine Wave (%g Hz)', frequency);
    builtMotion.magnitude = magnitude;
    builtMotion.offset = 0;
    builtMotion.duration = duration;
    builtMotion.flShape = flShape;
    builtMotion.frShape = frShape;
    builtMotion.rlShape = rlShape;
    builtMotion.rrShape = rrShape;
end