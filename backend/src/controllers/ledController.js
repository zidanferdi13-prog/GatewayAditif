'use strict';

/* Only allow known safe LED command strings: alphanumeric + underscore, max 32 chars */
const VALID_COMMAND = /^[A-Za-z0-9_]{1,32}$/;

class LedController {
  constructor(serialClient) {
    this.serialClient = serialClient;
  }

  /** POST /api/led/control  { command: "ON" } */
  control(req, res) {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ success: false, message: 'command is required' });
    }
    if (!VALID_COMMAND.test(command)) {
      return res.status(400).json({ success: false, message: 'Invalid command format' });
    }

    const ok = this.serialClient.sendLEDCommand(command);
    res.json({
      success: ok,
      message: ok ? `LED command sent: ${command}` : 'Failed to send LED command'
    });
  }
}

module.exports = LedController;
