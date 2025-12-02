    function color = helperGenerateRandomColor()
        % GENERATERANDOMCOLOR  Generate a random hex color.
        rgb = randi([0, 255], [1, 3]);    % Random RGB values
        color = sprintf('#%02X%02X%02X', rgb(1), rgb(2), rgb(3));  % e.g., '#D67615'
    end