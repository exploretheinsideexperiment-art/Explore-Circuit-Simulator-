/**
 * Board specifications and pin layouts for ESP32, Arduino, and Raspberry Pi families
 */
import { PinDef } from '../../types';

export interface BoardSpecification {
  id: string;
  name: string;
  family: 'ESP' | 'Arduino' | 'Raspberry Pi';
  voltage: number; // 3.3 or 5.0
  flashSize: string;
  frequency: string;
  builtInLedPin: string;
  defaultLanguage: 'cpp' | 'python';
  width: number;
  height: number;
  pins: PinDef[];
  description: string;
}

export const SUPPORTED_BOARDS: Record<string, BoardSpecification> = {
  'esp32-devkit-v1': {
    id: 'esp32-devkit-v1',
    name: 'ESP32 DevKit V1',
    family: 'ESP',
    voltage: 3.3,
    flashSize: '4MB',
    frequency: '240MHz',
    builtInLedPin: '2',
    defaultLanguage: 'cpp',
    width: 140,
    height: 240,
    description: '30-pin dual-core ESP32 development board with WiFi & Bluetooth.',
    pins: [
      // Left side pins (top to bottom)
      { id: 'EN', name: 'EN', type: 'input', x: 10, y: 30, description: 'Enable/Reset' },
      { id: 'VP', name: 'VP/36', label: '36', type: 'analog', x: 10, y: 46, description: 'ADC1_CH0' },
      { id: 'VN', name: 'VN/39', label: '39', type: 'analog', x: 10, y: 62, description: 'ADC1_CH3' },
      { id: '34', name: 'D34', label: '34', type: 'analog', x: 10, y: 78, description: 'ADC1_CH6 (Input only)' },
      { id: '35', name: 'D35', label: '35', type: 'analog', x: 10, y: 94, description: 'ADC1_CH7 (Input only)' },
      { id: '32', name: 'D32', label: '32', type: 'gpio', x: 10, y: 110, description: 'GPIO32 / ADC1_CH4 / Touch9' },
      { id: '33', name: 'D33', label: '33', type: 'gpio', x: 10, y: 126, description: 'GPIO33 / ADC1_CH5 / Touch8' },
      { id: '25', name: 'D25', label: '25', type: 'gpio', x: 10, y: 142, description: 'GPIO25 / DAC1' },
      { id: '26', name: 'D26', label: '26', type: 'gpio', x: 10, y: 158, description: 'GPIO26 / DAC2' },
      { id: '27', name: 'D27', label: '27', type: 'gpio', x: 10, y: 174, description: 'GPIO27 / Touch7' },
      { id: '14', name: 'D14', label: '14', type: 'gpio', x: 10, y: 190, description: 'GPIO14 / HSPI_CLK' },
      { id: '12', name: 'D12', label: '12', type: 'gpio', x: 10, y: 206, description: 'GPIO12 / HSPI_MISO' },
      { id: '13', name: 'D13', label: '13', type: 'gpio', x: 10, y: 222, description: 'GPIO13 / HSPI_MOSI' },
      { id: 'GND_L', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 238, voltage: 0, description: 'Ground' },
      { id: 'VIN', name: 'VIN', label: 'VIN', type: 'power_vcc', x: 10, y: 254, voltage: 5.0, description: '5V Input' },

      // Right side pins (top to bottom)
      { id: '23', name: 'D23', label: '23', type: 'gpio', x: 130, y: 30, description: 'GPIO23 / VSPI_MOSI' },
      { id: '22', name: 'D22', label: '22', type: 'i2c_scl', x: 130, y: 46, description: 'GPIO22 / I2C SCL' },
      { id: 'TX', name: 'TX0/1', label: 'TX', type: 'uart_tx', x: 130, y: 62, description: 'UART0 TX' },
      { id: 'RX', name: 'RX0/3', label: 'RX', type: 'uart_rx', x: 130, y: 78, description: 'UART0 RX' },
      { id: '21', name: 'D21', label: '21', type: 'i2c_sda', x: 130, y: 94, description: 'GPIO21 / I2C SDA' },
      { id: 'GND_R', name: 'GND', label: 'GND', type: 'power_gnd', x: 130, y: 110, voltage: 0, description: 'Ground' },
      { id: '19', name: 'D19', label: '19', type: 'gpio', x: 130, y: 126, description: 'GPIO19 / VSPI_MISO' },
      { id: '18', name: 'D18', label: '18', type: 'gpio', x: 130, y: 142, description: 'GPIO18 / VSPI_CLK' },
      { id: '5', name: 'D5', label: '5', type: 'gpio', x: 130, y: 158, description: 'GPIO5 / VSPI_CS' },
      { id: '17', name: 'TX2/17', label: '17', type: 'gpio', x: 130, y: 174, description: 'GPIO17 / UART2 TX' },
      { id: '16', name: 'RX2/16', label: '16', type: 'gpio', x: 130, y: 190, description: 'GPIO16 / UART2 RX' },
      { id: '4', name: 'D4', label: '4', type: 'gpio', x: 130, y: 206, description: 'GPIO4 / ADC2_CH0' },
      { id: '0', name: 'D0', label: '0', type: 'gpio', x: 130, y: 222, description: 'GPIO0 / Boot' },
      { id: '2', name: 'D2', label: '2', type: 'gpio', x: 130, y: 238, description: 'GPIO2 / Built-in Blue LED' },
      { id: '3V3', name: '3V3', label: '3V3', type: 'power_vcc', x: 130, y: 254, voltage: 3.3, description: '3.3V Power Out' },
    ]
  },

  'arduino-uno': {
    id: 'arduino-uno',
    name: 'Arduino UNO R3',
    family: 'Arduino',
    voltage: 5.0,
    flashSize: '32KB',
    frequency: '16MHz',
    builtInLedPin: '13',
    defaultLanguage: 'cpp',
    width: 320,
    height: 180,
    description: 'Classic ATmega328P Arduino board with 14 digital I/O and 6 analog inputs.',
    pins: [
      // Top header: Digital Pins 13 down to 0, GND, AREF, SDA, SCL
      { id: 'SCL', name: 'SCL', label: 'SCL', type: 'i2c_scl', x: 60, y: 10, description: 'I2C Clock' },
      { id: 'SDA', name: 'SDA', label: 'SDA', type: 'i2c_sda', x: 74, y: 10, description: 'I2C Data' },
      { id: 'AREF', name: 'AREF', label: 'AREF', type: 'analog', x: 88, y: 10, description: 'Analog Reference' },
      { id: 'GND_TOP', name: 'GND', label: 'GND', type: 'power_gnd', x: 102, y: 10, voltage: 0, description: 'Ground' },
      { id: '13', name: 'D13', label: '13', type: 'gpio', x: 116, y: 10, description: 'Digital Pin 13 / Built-in LED' },
      { id: '12', name: 'D12', label: '12', type: 'gpio', x: 130, y: 10, description: 'Digital Pin 12 / SPI MISO' },
      { id: '11', name: 'D11', label: '~11', type: 'pwm', x: 144, y: 10, description: 'Digital Pin 11 / PWM / SPI MOSI' },
      { id: '10', name: 'D10', label: '~10', type: 'pwm', x: 158, y: 10, description: 'Digital Pin 10 / PWM / SPI SS' },
      { id: '9', name: 'D9', label: '~9', type: 'pwm', x: 172, y: 10, description: 'Digital Pin 9 / PWM' },
      { id: '8', name: 'D8', label: '8', type: 'gpio', x: 186, y: 10, description: 'Digital Pin 8' },

      { id: '7', name: 'D7', label: '7', type: 'gpio', x: 204, y: 10, description: 'Digital Pin 7' },
      { id: '6', name: 'D6', label: '~6', type: 'pwm', x: 218, y: 10, description: 'Digital Pin 6 / PWM' },
      { id: '5', name: 'D5', label: '~5', type: 'pwm', x: 232, y: 10, description: 'Digital Pin 5 / PWM' },
      { id: '4', name: 'D4', label: '4', type: 'gpio', x: 246, y: 10, description: 'Digital Pin 4' },
      { id: '3', name: 'D3', label: '~3', type: 'pwm', x: 260, y: 10, description: 'Digital Pin 3 / PWM / INT1' },
      { id: '2', name: 'D2', label: '2', type: 'gpio', x: 274, y: 10, description: 'Digital Pin 2 / INT0' },
      { id: '1', name: 'TX/1', label: 'TX', type: 'uart_tx', x: 288, y: 10, description: 'Serial TX (Pin 1)' },
      { id: '0', name: 'RX/0', label: 'RX', type: 'uart_rx', x: 302, y: 10, description: 'Serial RX (Pin 0)' },

      // Bottom left header: Power
      { id: 'IOREF', name: 'IOREF', label: 'IOREF', type: 'power_vcc', x: 92, y: 160, voltage: 5.0, description: 'IO Reference' },
      { id: 'RESET', name: 'RESET', label: 'RST', type: 'input', x: 106, y: 160, description: 'Reset' },
      { id: '3V3', name: '3.3V', label: '3.3V', type: 'power_vcc', x: 120, y: 160, voltage: 3.3, description: '3.3V Power Out' },
      { id: '5V', name: '5V', label: '5V', type: 'power_vcc', x: 134, y: 160, voltage: 5.0, description: '5V Power Out' },
      { id: 'GND_B1', name: 'GND', label: 'GND', type: 'power_gnd', x: 148, y: 160, voltage: 0, description: 'Ground' },
      { id: 'GND_B2', name: 'GND', label: 'GND', type: 'power_gnd', x: 162, y: 160, voltage: 0, description: 'Ground' },
      { id: 'VIN', name: 'VIN', label: 'VIN', type: 'power_vcc', x: 176, y: 160, voltage: 9.0, description: 'Vin Power Input (7-12V)' },

      // Bottom right header: Analog In
      { id: 'A0', name: 'A0', label: 'A0', type: 'analog', x: 204, y: 160, description: 'Analog In 0' },
      { id: 'A1', name: 'A1', label: 'A1', type: 'analog', x: 218, y: 160, description: 'Analog In 1' },
      { id: 'A2', name: 'A2', label: 'A2', type: 'analog', x: 232, y: 160, description: 'Analog In 2' },
      { id: 'A3', name: 'A3', label: 'A3', type: 'analog', x: 246, y: 160, description: 'Analog In 3' },
      { id: 'A4', name: 'A4', label: 'A4', type: 'analog', x: 260, y: 160, description: 'Analog In 4 / I2C SDA' },
      { id: 'A5', name: 'A5', label: 'A5', type: 'analog', x: 274, y: 160, description: 'Analog In 5 / I2C SCL' },
    ]
  },

  'raspberry-pi-pico': {
    id: 'raspberry-pi-pico',
    name: 'Raspberry Pi Pico',
    family: 'Raspberry Pi',
    voltage: 3.3,
    flashSize: '2MB',
    frequency: '133MHz',
    builtInLedPin: '25',
    defaultLanguage: 'python',
    width: 130,
    height: 250,
    description: 'RP2040 dual ARM Cortex-M0+ microcontroller with native MicroPython support.',
    pins: [
      // Left side pins (1 to 20)
      { id: '0', name: 'GP0', label: 'GP0', type: 'gpio', x: 10, y: 30, description: 'UART0 TX / I2C0 SDA' },
      { id: '1', name: 'GP1', label: 'GP1', type: 'gpio', x: 10, y: 42, description: 'UART0 RX / I2C0 SCL' },
      { id: 'GND_1', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 54, voltage: 0, description: 'Ground' },
      { id: '2', name: 'GP2', label: 'GP2', type: 'gpio', x: 10, y: 66, description: 'GPIO 2' },
      { id: '3', name: 'GP3', label: 'GP3', type: 'gpio', x: 10, y: 78, description: 'GPIO 3' },
      { id: '4', name: 'GP4', label: 'GP4', type: 'gpio', x: 10, y: 90, description: 'GPIO 4 / I2C0 SDA' },
      { id: '5', name: 'GP5', label: 'GP5', type: 'gpio', x: 10, y: 102, description: 'GPIO 5 / I2C0 SCL' },
      { id: 'GND_2', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 114, voltage: 0, description: 'Ground' },
      { id: '6', name: 'GP6', label: 'GP6', type: 'gpio', x: 10, y: 126, description: 'GPIO 6' },
      { id: '7', name: 'GP7', label: 'GP7', type: 'gpio', x: 10, y: 138, description: 'GPIO 7' },
      { id: '8', name: 'GP8', label: 'GP8', type: 'gpio', x: 10, y: 150, description: 'GPIO 8' },
      { id: '9', name: 'GP9', label: 'GP9', type: 'gpio', x: 10, y: 162, description: 'GPIO 9' },
      { id: 'GND_3', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 174, voltage: 0, description: 'Ground' },
      { id: '10', name: 'GP10', label: 'GP10', type: 'gpio', x: 10, y: 186, description: 'GPIO 10' },
      { id: '11', name: 'GP11', label: 'GP11', type: 'gpio', x: 10, y: 198, description: 'GPIO 11' },
      { id: '12', name: 'GP12', label: 'GP12', type: 'gpio', x: 10, y: 210, description: 'GPIO 12' },
      { id: '13', name: 'GP13', label: 'GP13', type: 'gpio', x: 10, y: 222, description: 'GPIO 13' },
      { id: 'GND_4', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 234, voltage: 0, description: 'Ground' },
      { id: '14', name: 'GP14', label: 'GP14', type: 'gpio', x: 10, y: 246, description: 'GPIO 14' },
      { id: '15', name: 'GP15', label: 'GP15', type: 'gpio', x: 10, y: 258, description: 'GPIO 15' },

      // Right side pins (21 to 40)
      { id: '16', name: 'GP16', label: 'GP16', type: 'gpio', x: 120, y: 258, description: 'GPIO 16 / SPI0 MISO' },
      { id: '17', name: 'GP17', label: 'GP17', type: 'gpio', x: 120, y: 246, description: 'GPIO 17 / SPI0 CS' },
      { id: 'GND_5', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 234, voltage: 0, description: 'Ground' },
      { id: '18', name: 'GP18', label: 'GP18', type: 'gpio', x: 120, y: 222, description: 'GPIO 18 / SPI0 SCK' },
      { id: '19', name: 'GP19', label: 'GP19', type: 'gpio', x: 120, y: 210, description: 'GPIO 19 / SPI0 MOSI' },
      { id: '20', name: 'GP20', label: 'GP20', type: 'gpio', x: 120, y: 198, description: 'GPIO 20' },
      { id: '21', name: 'GP21', label: 'GP21', type: 'gpio', x: 120, y: 186, description: 'GPIO 21' },
      { id: 'GND_6', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 174, voltage: 0, description: 'Ground' },
      { id: '22', name: 'GP22', label: 'GP22', type: 'gpio', x: 120, y: 162, description: 'GPIO 22' },
      { id: 'RUN', name: 'RUN', label: 'RUN', type: 'input', x: 120, y: 150, description: 'Run / Reset' },
      { id: '26', name: 'GP26', label: 'GP26', type: 'analog', x: 120, y: 138, description: 'ADC0 (GP26)' },
      { id: '27', name: 'GP27', label: 'GP27', type: 'analog', x: 120, y: 126, description: 'ADC1 (GP27)' },
      { id: 'GND_7', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 114, voltage: 0, description: 'Ground' },
      { id: '28', name: 'GP28', label: 'GP28', type: 'analog', x: 120, y: 102, description: 'ADC2 (GP28)' },
      { id: 'ADC_VREF', name: 'VREF', label: 'VREF', type: 'analog', x: 120, y: 90, description: 'ADC Voltage Reference' },
      { id: '3V3_OUT', name: '3V3', label: '3V3', type: 'power_vcc', x: 120, y: 78, voltage: 3.3, description: '3.3V Output' },
      { id: '3V3_EN', name: '3V3_EN', label: 'EN', type: 'input', x: 120, y: 66, description: '3.3V Enable' },
      { id: 'GND_8', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 54, voltage: 0, description: 'Ground' },
      { id: 'VSYS', name: 'VSYS', label: 'VSYS', type: 'power_vcc', x: 120, y: 42, voltage: 5.0, description: 'System Input Voltage' },
      { id: 'VBUS', name: 'VBUS', label: 'VBUS', type: 'power_vcc', x: 120, y: 30, voltage: 5.0, description: 'USB 5V Power' },
    ]
  },

  'arduino-nano': {
    id: 'arduino-nano',
    name: 'Arduino Nano',
    family: 'Arduino',
    voltage: 5.0,
    flashSize: '32KB',
    frequency: '16MHz',
    builtInLedPin: '13',
    defaultLanguage: 'cpp',
    width: 100,
    height: 200,
    description: 'Compact breadboard-friendly ATmega328P Arduino board.',
    pins: [
      { id: 'TX', name: 'TX1', label: 'TX', type: 'uart_tx', x: 10, y: 25 },
      { id: 'RX', name: 'RX0', label: 'RX', type: 'uart_rx', x: 10, y: 37 },
      { id: 'RST_1', name: 'RST', label: 'RST', type: 'input', x: 10, y: 49 },
      { id: 'GND_1', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 61, voltage: 0 },
      { id: '2', name: 'D2', label: 'D2', type: 'gpio', x: 10, y: 73 },
      { id: '3', name: 'D3', label: '~D3', type: 'pwm', x: 10, y: 85 },
      { id: '4', name: 'D4', label: 'D4', type: 'gpio', x: 10, y: 97 },
      { id: '5', name: 'D5', label: '~D5', type: 'pwm', x: 10, y: 109 },
      { id: '6', name: 'D6', label: '~D6', type: 'pwm', x: 10, y: 121 },
      { id: '7', name: 'D7', label: 'D7', type: 'gpio', x: 10, y: 133 },
      { id: '8', name: 'D8', label: 'D8', type: 'gpio', x: 10, y: 145 },
      { id: '9', name: 'D9', label: '~D9', type: 'pwm', x: 10, y: 157 },
      { id: '10', name: 'D10', label: '~D10', type: 'pwm', x: 10, y: 169 },
      { id: '11', name: 'D11', label: '~D11', type: 'pwm', x: 10, y: 181 },
      { id: '12', name: 'D12', label: 'D12', type: 'gpio', x: 10, y: 193 },

      { id: '13', name: 'D13', label: 'D13', type: 'gpio', x: 90, y: 193 },
      { id: '3V3', name: '3V3', label: '3V3', type: 'power_vcc', x: 90, y: 181, voltage: 3.3 },
      { id: 'AREF', name: 'REF', label: 'REF', type: 'analog', x: 90, y: 169 },
      { id: 'A0', name: 'A0', label: 'A0', type: 'analog', x: 90, y: 157 },
      { id: 'A1', name: 'A1', label: 'A1', type: 'analog', x: 90, y: 145 },
      { id: 'A2', name: 'A2', label: 'A2', type: 'analog', x: 90, y: 133 },
      { id: 'A3', name: 'A3', label: 'A3', type: 'analog', x: 90, y: 121 },
      { id: 'A4', name: 'A4', label: 'A4', type: 'analog', x: 90, y: 109 },
      { id: 'A5', name: 'A5', label: 'A5', type: 'analog', x: 90, y: 97 },
      { id: 'A6', name: 'A6', label: 'A6', type: 'analog', x: 90, y: 85 },
      { id: 'A7', name: 'A7', label: 'A7', type: 'analog', x: 90, y: 73 },
      { id: '5V', name: '5V', label: '5V', type: 'power_vcc', x: 90, y: 61, voltage: 5.0 },
      { id: 'RST_2', name: 'RST', label: 'RST', type: 'input', x: 90, y: 49 },
      { id: 'GND_2', name: 'GND', label: 'GND', type: 'power_gnd', x: 90, y: 37, voltage: 0 },
      { id: 'VIN', name: 'VIN', label: 'VIN', type: 'power_vcc', x: 90, y: 25, voltage: 9.0 }
    ]
  },

  'esp8266-nodemcu': {
    id: 'esp8266-nodemcu',
    name: 'ESP8266 NodeMCU',
    family: 'ESP',
    voltage: 3.3,
    flashSize: '4MB',
    frequency: '80MHz',
    builtInLedPin: '2',
    defaultLanguage: 'cpp',
    width: 130,
    height: 220,
    description: 'Popular WiFi development board based on the ESP-12E module.',
    pins: [
      { id: 'A0', name: 'A0', label: 'A0', type: 'analog', x: 10, y: 28 },
      { id: 'RSV', name: 'RSV', label: 'RSV', type: 'passive', x: 10, y: 41 },
      { id: 'RSV2', name: 'RSV', label: 'RSV', type: 'passive', x: 10, y: 54 },
      { id: 'SD3', name: 'SD3', label: 'SD3', type: 'gpio', x: 10, y: 67 },
      { id: 'SD2', name: 'SD2', label: 'SD2', type: 'gpio', x: 10, y: 80 },
      { id: 'SD1', name: 'SD1', label: 'SD1', type: 'gpio', x: 10, y: 93 },
      { id: 'CMD', name: 'CMD', label: 'CMD', type: 'gpio', x: 10, y: 106 },
      { id: 'SD0', name: 'SD0', label: 'SD0', type: 'gpio', x: 10, y: 119 },
      { id: 'CLK', name: 'CLK', label: 'CLK', type: 'gpio', x: 10, y: 132 },
      { id: 'GND_1', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 145, voltage: 0 },
      { id: '3V3_1', name: '3V3', label: '3V3', type: 'power_vcc', x: 10, y: 158, voltage: 3.3 },
      { id: 'EN', name: 'EN', label: 'EN', type: 'input', x: 10, y: 171 },
      { id: 'RST', name: 'RST', label: 'RST', type: 'input', x: 10, y: 184 },
      { id: 'GND_2', name: 'GND', label: 'GND', type: 'power_gnd', x: 10, y: 197, voltage: 0 },
      { id: 'VIN', name: 'VIN', label: 'VIN', type: 'power_vcc', x: 10, y: 210, voltage: 5.0 },

      { id: 'D0', name: 'D0/16', label: 'D0', type: 'gpio', x: 120, y: 210 },
      { id: 'D1', name: 'D1/5', label: 'D1', type: 'i2c_scl', x: 120, y: 197 },
      { id: 'D2', name: 'D2/4', label: 'D2', type: 'i2c_sda', x: 120, y: 184 },
      { id: 'D3', name: 'D3/0', label: 'D3', type: 'gpio', x: 120, y: 171 },
      { id: 'D4', name: 'D4/2', label: 'D4', type: 'gpio', x: 120, y: 158 },
      { id: '3V3_2', name: '3V3', label: '3V3', type: 'power_vcc', x: 120, y: 145, voltage: 3.3 },
      { id: 'GND_3', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 132, voltage: 0 },
      { id: 'D5', name: 'D5/14', label: 'D5', type: 'gpio', x: 120, y: 119 },
      { id: 'D6', name: 'D6/12', label: 'D6', type: 'gpio', x: 120, y: 106 },
      { id: 'D7', name: 'D7/13', label: 'D7', type: 'gpio', x: 120, y: 93 },
      { id: 'D8', name: 'D8/15', label: 'D8', type: 'gpio', x: 120, y: 80 },
      { id: 'RX', name: 'RX/3', label: 'RX', type: 'uart_rx', x: 120, y: 67 },
      { id: 'TX', name: 'TX/1', label: 'TX', type: 'uart_tx', x: 120, y: 54 },
      { id: 'GND_4', name: 'GND', label: 'GND', type: 'power_gnd', x: 120, y: 41, voltage: 0 },
      { id: '3V3_3', name: '3V3', label: '3V3', type: 'power_vcc', x: 120, y: 28, voltage: 3.3 }
    ]
  }
};
