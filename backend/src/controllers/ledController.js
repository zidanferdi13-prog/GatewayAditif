/**
 * LED Controller
 * Handles LED control endpoints
 */

class LedController {
  constructor(mqttClient) {
    this.mqttClient = mqttClient;
  }

  /**
   * POST /api/led/control
   * Send LED control command
   */
  control(req, res) {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Command is required'
      });
    }
    
    const result = this.mqttClient.sendLEDCommand(command);
    res.json({
      success: result,
      message: result ? `LED command sent: ${command}` : 'Failed to send LED command'
    });
  }
}

module.exports = LedController;
