function builtMotion = generateWhiteNoiseMotion(srcMotion)
    % Extract parameters from srcMotion
    params = srcMotion.parameters;
    duration = params.duration;         % Duration in seconds
    magnitude = params.magnitude;       % Not used directly in shape scaling
    direction = params.direction;       % Direction: 'full', 'fl', 'fr', 'rl', 'rr'
    lowCutoff = params.lowCutoff;       % Low cutoff frequency (Hz)
    highCutoff = params.highCutoff;     % High cutoff frequency (Hz)
    seed = params.seed;                 % Random seed for reproducibility

    % Sampling parameters
    Fs = 100;                           % Sample rate (Hz)
    Ts = 1 / Fs;                        % Sample period (s)
    N = round(duration * Fs);           % Number of samples

    % Set random seed for reproducibility
    rng(seed);

    % Generate white noise (unfiltered, range [-1, 1])
    noise = 2 * rand(N, 1) - 1;

    % Design band-pass filter (high-pass then low-pass)
    hpFilter = LPhpf(lowCutoff);        % High-pass filter
    lpFilter = LPlpf(highCutoff);       % Low-pass filter

    % Apply filters sequentially
    filteredNoise = apply_filter(noise, hpFilter, Ts);
    filteredNoise = apply_filter(filteredNoise, lpFilter, Ts);

    % Normalize to [-1, 1]
    maxAbs = max(abs(filteredNoise));
    if maxAbs > 0
        filteredNoise = filteredNoise / maxAbs;
    end

    % Initialize all actuator shapes to zero
    builtMotion.flShape = zeros(N, 1);
    builtMotion.frShape = zeros(N, 1);
    builtMotion.rlShape = zeros(N, 1);
    builtMotion.rrShape = zeros(N, 1);

    % Assign noise to shapes based on direction
    switch lower(direction)
        case {'all', 'full'}
            builtMotion.flShape = filteredNoise;
            builtMotion.frShape = filteredNoise;
            builtMotion.rlShape = filteredNoise;
            builtMotion.rrShape = filteredNoise;
        case 'fl'
            builtMotion.flShape = filteredNoise;
        case 'fr'
            builtMotion.frShape = filteredNoise;
        case 'rl'
            builtMotion.rlShape = filteredNoise;
        case 'rr'
            builtMotion.rrShape = filteredNoise;
        otherwise
            error('Invalid direction: %s', direction);
    end

    builtMotion.duration = helperGetduration(builtMotion, Ts);

    % Set additional output fields
    builtMotion.id = srcMotion.id;
    builtMotion.offset = 0;  % White noise has no offset
    builtMotion.color = helperGenerateRandomColor();  % Use shared utility
    builtMotion.shortDisplayName = 'White Noise';
    builtMotion.longDisplayName = sprintf('Band-Pass Filtered Noise (%.1f-%.1f Hz)', ...
        lowCutoff, highCutoff);
    builtMotion.magnitude = magnitude;
    builtMotion.compositionDegree = 0;
end

% Local functions for filter design and application
function sys = LPhpf(fn)
    % LPHPF  Simplified 2nd-order high-pass filter with zeta=1
    wn = 2 * pi * fn;
    sys = tf([1 0 0], [1 2*wn wn^2]);  % 2nd order, zeta=1
end

function sys = LPlpf(fn)
    % LPLPF  Simplified 2nd-order low-pass filter with zeta=1
    wn = 2 * pi * fn;
    sys = tf(wn^2, [1 2*wn wn^2]);     % 2nd order, zeta=1
end

function y = apply_filter(u, sys, Ts)
    % APPLY_FILTER  Apply continuous filter to discrete data using Tustin method
    sysd = c2d(sys, Ts, 'tustin');
    [b, a] = tfdata(sysd, 'v');
    y = filter(b, a, u);
end