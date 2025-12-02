function builtMotion = generateCompositeMotion(srcComposition)
    % Sampling frequency
    Fs = 100;

    % Step 1: Calculate composite magnitude and evaluate duration
    compositeMagnitude = 1; % Initialize as 1 for multiplication
    maxEndTime = 0;
    maxDegree = 0;
    
    for i = 1:length(srcComposition.composition.motions)
        motion = srcComposition.composition.motions(i);
        motionFile = ['build/motions/', motion.motionRef, '.json'];
        builtMotionTemp = jsondecode(fileread(motionFile));
        
        % Get magnitude (use override if present)
        if isfield(motion, 'magnitudeOverride')
            mag = motion.magnitudeOverride;
        else
            mag = builtMotionTemp.magnitude;
        end
        
        % Calculate end time for duration
        motionDuration = builtMotionTemp.duration;
        endTime = motion.startTime + motionDuration;
        maxEndTime = max(maxEndTime, endTime);
        
        % Update composite magnitude and degree
        if strcmp(srcComposition.composition.operation, 'multiplication')
            compositeMagnitude = compositeMagnitude * mag;
        else % Addition
            compositeMagnitude = max(compositeMagnitude, abs(mag));
        end
        
        maxDegree = max(maxDegree, builtMotionTemp.compositionDegree);
    end
    
    % Set duration and compositionDegree
    duration = maxEndTime;
    totalSamples = round(duration * Fs);
    builtMotion = struct();
    builtMotion.compositionDegree = maxDegree + 1;
    
    % Initialize composite shapes (ones for multiplication, zeros for addition)
    if strcmp(srcComposition.composition.operation, 'multiplication')
        flComposite = ones(totalSamples, 1);
        frComposite = ones(totalSamples, 1);
        rlComposite = ones(totalSamples, 1);
        rrComposite = ones(totalSamples, 1);
    else
        flComposite = zeros(totalSamples, 1);
        frComposite = zeros(totalSamples, 1);
        rlComposite = zeros(totalSamples, 1);
        rrComposite = zeros(totalSamples, 1);
    end
    
    % Step 2: Process each motion
    for i = 1:length(srcComposition.composition.motions)
        motion = srcComposition.composition.motions(i);
        motionFile = ['build/motions/', motion.motionRef, '.json'];
        builtMotionTemp = jsondecode(fileread(motionFile));
        
        % Load shapes
        flSeq = builtMotionTemp.flShape;
        frSeq = builtMotionTemp.frShape;
        rlSeq = builtMotionTemp.rlShape;
        rrSeq = builtMotionTemp.rrShape;
        
        % Get magnitude and compute scaling factor
        if isfield(motion, 'magnitudeOverride')
            mag = motion.magnitudeOverride;
        else
            mag = builtMotionTemp.magnitude;
        end

        if strcmp(srcComposition.composition.operation, 'addition')
            scale = mag / compositeMagnitude;
        else
            scale = 1;
        end
        
        % Shift sequence by startTime
        startSample = round(motion.startTime * Fs) + 1;
        seqLength = length(flSeq);
        shiftedLength = startSample - 1 + seqLength;
        
        % Scale and shift shapes
        flSeqScaled = flSeq * scale;
        frSeqScaled = frSeq * scale;
        rlSeqScaled = rlSeq * scale;
        rrSeqScaled = rrSeq * scale;
        
        % padding
        if strcmp(srcComposition.composition.operation, 'multiplication')
            flSeqShifted = [ones(startSample - 1, 1); flSeqScaled];
            frSeqShifted = [ones(startSample - 1, 1); frSeqScaled];
            rlSeqShifted = [ones(startSample - 1, 1); rlSeqScaled];
            rrSeqShifted = [ones(startSample - 1, 1); rrSeqScaled];
        else
            flSeqShifted = [zeros(startSample - 1, 1); flSeqScaled];
            frSeqShifted = [zeros(startSample - 1, 1); frSeqScaled];
            rlSeqShifted = [zeros(startSample - 1, 1); rlSeqScaled];
            rrSeqShifted = [zeros(startSample - 1, 1); rrSeqScaled];
        end
        
        % Adjust length to match totalSamples
        if shiftedLength > totalSamples
            flSeqShifted = flSeqShifted(1:totalSamples);
            frSeqShifted = frSeqShifted(1:totalSamples);
            rlSeqShifted = rlSeqShifted(1:totalSamples);
            rrSeqShifted = rrSeqShifted(1:totalSamples);
        else
            padding = totalSamples - length(flSeqShifted);
            if strcmp(srcComposition.composition.operation, 'multiplication')
                flSeqShifted = [flSeqShifted; ones(padding, 1)];
                frSeqShifted = [frSeqShifted; ones(padding, 1)];
                rlSeqShifted = [rlSeqShifted; ones(padding, 1)];
                rrSeqShifted = [rrSeqShifted; ones(padding, 1)];
            else
                flSeqShifted = [flSeqShifted; zeros(padding, 1)];
                frSeqShifted = [frSeqShifted; zeros(padding, 1)];
                rlSeqShifted = [rlSeqShifted; zeros(padding, 1)];
                rrSeqShifted = [rrSeqShifted; zeros(padding, 1)];
            end
        end
        
        % Combine based on operation
        if i == 1
            % Initialize with first motion
            flComposite = flSeqShifted;
            frComposite = frSeqShifted;
            rlComposite = rlSeqShifted;
            rrComposite = rrSeqShifted;
        else
            if strcmp(srcComposition.composition.operation, 'multiplication')
                flComposite = flComposite .* flSeqShifted;
                frComposite = frComposite .* frSeqShifted;
                rlComposite = rlComposite .* rlSeqShifted;
                rrComposite = rrComposite .* rrSeqShifted;
            else % Addition
                flComposite = flComposite + flSeqShifted;
                frComposite = frComposite + frSeqShifted;
                rlComposite = rlComposite + rlSeqShifted;
                rrComposite = rrComposite + rrSeqShifted;
            end
        end
    end
    
    % Step 3: Normalize composite shapes to [-1, 1]
    maxShape = max(max(abs([flComposite frComposite rlComposite rrComposite])));
    if maxShape > 1
        flComposite = flComposite / maxShape;
        frComposite = frComposite / maxShape;
        rlComposite = rlComposite / maxShape;
        rrComposite = rrComposite / maxShape;
        compositeMagnitude = compositeMagnitude * maxShape;
    end

    % Step 4: Construct built motion
    builtMotion.id = srcComposition.id;
    builtMotion.name = srcComposition.name;
    builtMotion.color = helperGenerateRandomColor(); % Random RGB color
    builtMotion.shortDisplayName = 'Composite Motion';
    builtMotion.longDisplayName = ['Composite of ', srcComposition.name];
    builtMotion.magnitude = compositeMagnitude;
    builtMotion.duration = duration;
    builtMotion.offset = 0;
    builtMotion.flShape = flComposite;
    builtMotion.frShape = frComposite;
    builtMotion.rlShape = rlComposite;
    builtMotion.rrShape = rrComposite;
end