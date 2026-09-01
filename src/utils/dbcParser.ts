import type { DbcFile, DbcMessage, DbcSignal } from '../types/dbc';

const MESSAGE_RE = /^BO_\s+(\d+)\s+(\w+)\s*:\s*(\d+)\s+(\S+)/;
const SIGNAL_RE =
  /^\s+SG_\s+(\w+)\s+([Mm])?(\d+)?\s*:\s*(\d+)\|(\d+)@([01])([+-])\s*\(([^,]+),([^)]+)\)\s*\[([^|]*)\|([^\]]*)\]\s*"([^"]*)"\s*(.*)/;
const VERSION_RE = /^VERSION\s+"([^"]*)"/;
const BU_RE = /^BU_\s*:(.*)/;

function decToHex(value: number): number {
  const mask = 0x1fffffff;

  // Aplica a máscara e converte para hex
  const idHex = (value & mask).toString(16).toUpperCase();

  return parseInt(idHex, 16);
}

export function parseDbc(content: string): DbcFile {
  const lines = content.split('\n');
  const messages: DbcMessage[] = [];
  const messageMap = new Map<number, DbcMessage>();
  let version = '';
  let nodes: string[] = [];
  let currentMessage: DbcMessage | null = null;

  for (const raw of lines) {
    const line = raw.trimEnd();

    const versionMatch = line.match(VERSION_RE);
    if (versionMatch) {
      version = versionMatch[1];
      continue;
    }

    const buMatch = line.match(BU_RE);
    if (buMatch) {
      nodes = buMatch[1].trim().split(/\s+/).filter(Boolean);
      continue;
    }

    const msgMatch = line.match(MESSAGE_RE);
    if (msgMatch) {
      currentMessage = {
        id: decToHex(parseInt(msgMatch[1], 10)),
        name: msgMatch[2],
        dlc: parseInt(msgMatch[3], 10),
        transmitter: msgMatch[4],
        signals: [],
        hasMultiplex: false,
      };
      messages.push(currentMessage);
      messageMap.set(currentMessage.id, currentMessage);
      continue;
    }

    const sigMatch = line.match(SIGNAL_RE);
    if (sigMatch && currentMessage) {
      // Vector DBC multiplex convention:
      //   'M' alone (uppercase, no number)  = this signal IS the multiplexer
      //   'm0', 'm1' (lowercase + number)   = this signal is active when mux == N
      const multiplexChar = sigMatch[2]; // 'M' or 'm'
      const multiplexNum = sigMatch[3]; // digits, or undefined

      let isMultiplexer = false;
      let multiplexId = -1;

      if (multiplexChar === 'M' && !multiplexNum) {
        // uppercase M with no number = this IS the multiplexer selector
        isMultiplexer = true;
      } else if (multiplexChar === 'm' && multiplexNum !== undefined) {
        // lowercase m + number = muxed signal for that value
        multiplexId = parseInt(multiplexNum, 10);
      }

      const signal: DbcSignal = {
        name: sigMatch[1],
        startBit: parseInt(sigMatch[4], 10),
        length: parseInt(sigMatch[5], 10),
        byteOrder: sigMatch[6] === '1' ? 'intel' : 'motorola',
        isSigned: sigMatch[7] === '-',
        factor: parseFloat(sigMatch[8]) || 1,
        offset: parseFloat(sigMatch[9]) || 0,
        min: parseFloat(sigMatch[10]) || 0,
        max: parseFloat(sigMatch[11]) || 0,
        unit: sigMatch[12],
        receivers: sigMatch[13]
          .trim()
          .split(/\s*,\s*/)
          .filter(Boolean),
        isMultiplexer,
        multiplexId: isMultiplexer ? -1 : multiplexId,
      };

      if (isMultiplexer || multiplexId !== -1) {
        currentMessage.hasMultiplex = true;
      }

      currentMessage.signals.push(signal);
      continue;
    }
  }

  // Second pass for CM_ SG_ (can appear after all message defs)
  const cmSigGlobal = /CM_\s+SG_\s+(\d+)\s+(\w+)\s+"([\s\S]*?)"\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = cmSigGlobal.exec(content)) !== null) {
    const msg = messageMap.get(parseInt(m[1], 10));
    if (msg) {
      const sig = msg.signals.find(s => s.name === m![2]);
      if (sig) sig.comment = m[3].trim();
    }
  }

  // Resolve multiplexer references
  for (const msg of messages) {
    const multiplexers = msg.signals.filter(s => s.isMultiplexer);
    for (const mux of multiplexers) {
      for (const sig of msg.signals) {
        if (sig.multiplexId !== -1 && sig.isMultiplexer !== true) {
          sig.multiplexerSignal = mux.name;
        }
      }
    }
  }

  return { version, messages, nodes };
}

export function generateSampleDbc(): string {
  return `VERSION ""

NS_ :

BS_:

BU_: ECU TCU BCM

BO_ 100 EngineData: 8 ECU
 SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|16383.75] "rpm" TCU,BCM
 SG_ EngineTemp : 16|8@1+ (0.5,-40) [-40|87.5] "degC" TCU
 SG_ ThrottlePos : 24|8@1+ (0.392157,0) [0|100] "%" TCU
 SG_ IgnitionStatus : 32|2@1+ (1,0) [0|3] "" BCM

BO_ 200 TransmissionData: 8 TCU
 SG_ GearPosition : 0|4@1+ (1,0) [0|10] "" ECU
 SG_ VehicleSpeed : 8|16@1+ (0.01,0) [0|655.35] "km/h" ECU,BCM
 SG_ TransmissionTemp : 24|8@1- (1,-40) [-40|215] "degC" ECU

BO_ 300 BrakeData: 4 BCM
 SG_ BrakePressure : 0|12@1+ (0.1,0) [0|409.5] "bar" ECU
 SG_ ABSActive : 12|1@1+ (1,0) [0|1] "" ECU
 SG_ BrakeLightStatus : 13|1@1+ (1,0) [0|1] "" ECU

BO_ 400 ChassisData: 8 BCM
 SG_ SteeringAngle : 0|16@1- (0.1,-3276.8) [-3276.8|3276.7] "deg" ECU
 SG_ LateralAccel : 16|16@1- (0.001,-32.768) [-32.768|32.767] "m/s2" ECU
 SG_ YawRate : 32|16@1- (0.01,-327.68) [-327.68|327.67] "deg/s" ECU

BO_ 500 DiagnosticData: 8 ECU
 SG_ DiagType M : 0|8@1+ (1,0) [0|3] "" BCM
 SG_ DTCCode m0 : 8|16@1+ (1,0) [0|65535] "" BCM
 SG_ DTCStatus m0 : 24|8@1+ (1,0) [0|255] "" BCM
 SG_ FreezeFrame m1 : 8|32@1+ (1,0) [0|4294967295] "" BCM
 SG_ FreezeTemp m1 : 40|16@1- (0.1,-3276.8) [-3276.8|3276.7] "degC" BCM
 SG_ LiveRPM m2 : 8|16@1+ (0.25,0) [0|16383.75] "rpm" BCM
 SG_ LiveLoad m2 : 24|8@1+ (0.392157,0) [0|100] "%" BCM
 SG_ LiveTemp m2 : 32|8@1+ (0.5,-40) [-40|87.5] "degC" BCM

`;
}
