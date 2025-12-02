export default function GamepadAdaptor() {
  return (
    <div className="flex-col">
      <h2>Gamepad Output Setting</h2>
      <h3>Requirements</h3>
      <ul>
        <li>Windows only.</li>
        <li>This outupt does not work with game track.</li>
        <li>Gamepad driver (Output Target) is up and running.</li>
      </ul>
      <span>
        Run <strong> npm run gamepad </strong> in terminal to start Gamepad
        Driver.
      </span>
      <h3>Actuator Mapping</h3>
      <table className="bordered-table">
        <thead>
          <tr>
            <th>CM Actuators</th>
            <th>Gamepad Actuator</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>FL</td>
            <td>Left Rumble (Big)</td>
          </tr>
          <tr>
            <td>FR</td>
            <td>Right Rumble (Small)</td>
          </tr>
          <tr>
            <td>RL</td>
            <td>Left Trigger (Big)</td>
          </tr>
          <tr>
            <td>RR</td>
            <td>Right Trigger (Small)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
