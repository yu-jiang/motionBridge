function duration = helperGetduration(builtMotion, Ts)
    % HELPERGETDURATION  Calculate the duration of a built motion.
    %   duration = helperGetduration(builtMotion, Ts) takes a built motion struct
    %   and the sampling period Ts, and returns the total duration in seconds.
    %
    %   Inputs:
    %       builtMotion - Struct containing motion sequences (e.g., flShape).
    %       Ts - Sampling period in seconds.
    %   Output:
    %       duration - Total duration of the motion in seconds.

    % Get the number of samples from the flShape array
    numSamples = length(builtMotion.flShape);
    
    % Calculate duration as number of samples multiplied by sampling period
    duration = numSamples * Ts;
end