import type { DbcMessage, DbcSignal, SignalState } from '../types/dbc';

/** Convert physical value to raw integer */
function physicalToRaw(signal: DbcSignal, physical: number): bigint {
  const raw = Math.round((physical - signal.offset) / signal.factor);
  const maxRaw = signal.isSigned
    ? (1 << (signal.length - 1)) - 1
    : (1 << signal.length) - 1;
  const minRaw = signal.isSigned ? -(1 << (signal.length - 1)) : 0;
  const clamped = Math.max(minRaw, Math.min(maxRaw, raw));

  if (signal.isSigned && clamped < 0) {
    // Two's complement
    return BigInt(clamped + (1 << signal.length));
  }
  return BigInt(clamped);
}

/** Convert raw integer to physical value */
export function rawToPhysical(signal: DbcSignal, raw: bigint): number {
  let signed = Number(raw);
  if (signal.isSigned) {
    const msb = BigInt(1) << BigInt(signal.length - 1);
    if (raw >= msb) {
      signed = Number(raw) - (1 << signal.length);
    }
  }
  return signed * signal.factor + signal.offset;
}

function encodeIntel(
  data: Uint8Array,
  startBit: number,
  length: number,
  raw: bigint,
): void {
  for (let i = 0; i < length; i++) {
    const bitPos = startBit + i;
    const byteIdx = Math.floor(bitPos / 8);
    const bitInByte = bitPos % 8;
    if (byteIdx < data.length) {
      const bitVal = Number((raw >> BigInt(i)) & BigInt(1));
      data[byteIdx] =
        (data[byteIdx] & ~(1 << bitInByte)) | (bitVal << bitInByte);
    }
  }
}

function encodeMotorola(
  data: Uint8Array,
  startBit: number,
  length: number,
  raw: bigint,
): void {
  let bit = startBit;
  for (let i = 0; i < length; i++) {
    const byteIdx = Math.floor(bit / 8);
    const bitInByte = bit % 8;
    if (byteIdx < data.length) {
      const bitVal = Number((raw >> BigInt(length - 1 - i)) & BigInt(1));
      data[byteIdx] =
        (data[byteIdx] & ~(1 << bitInByte)) | (bitVal << bitInByte);
    }
    if (bit % 8 === 0) {
      bit += 15;
    } else {
      bit -= 1;
    }
  }
}

function decodeIntel(
  data: Uint8Array,
  startBit: number,
  length: number,
): bigint {
  let raw = BigInt(0);
  for (let i = 0; i < length; i++) {
    const bitPos = startBit + i;
    const byteIdx = Math.floor(bitPos / 8);
    const bitInByte = bitPos % 8;
    if (byteIdx < data.length) {
      raw |= BigInt((data[byteIdx] >> bitInByte) & 1) << BigInt(i);
    }
  }
  return raw;
}

function decodeMotorola(
  data: Uint8Array,
  startBit: number,
  length: number,
): bigint {
  let raw = BigInt(0);
  let bit = startBit;
  for (let i = 0; i < length; i++) {
    const byteIdx = Math.floor(bit / 8);
    const bitInByte = bit % 8;
    if (byteIdx < data.length) {
      raw |= BigInt((data[byteIdx] >> bitInByte) & 1) << BigInt(length - 1 - i);
    }
    if (bit % 8 === 0) {
      bit += 15;
    } else {
      bit -= 1;
    }
  }
  return raw;
}

/** Get signals visible for a given multiplex value */
export function getVisibleSignals(
  message: DbcMessage,
  multiplexValue: number | null,
): DbcSignal[] {
  return message.signals.filter(sig => {
    // Always include multiplexer signals
    if (sig.isMultiplexer) return true;

    // If no multiplex in message, include all
    if (!message.hasMultiplex) return true;

    // If signal has no multiplex ID, it's always visible
    if (sig.multiplexId === -1 && !sig.isMultiplexer) return true;

    // If signal has specific multiplex ID, only show if it matches current value
    if (sig.multiplexId !== -1) {
      return multiplexValue === sig.multiplexId;
    }

    return true;
  });
}

/** Encode all visible signal physical values into a CAN payload */
export function encodePayload(
  message: DbcMessage,
  state: SignalState,
  multiplexValue: number | null = null,
): Uint8Array {
  const data = new Uint8Array(message.dlc);
  const visibleSignals = getVisibleSignals(message, multiplexValue);

  for (const signal of visibleSignals) {
    const physical = state[signal.name] ?? signal.min;
    const raw = physicalToRaw(signal, physical);

    if (signal.byteOrder === 'intel') {
      encodeIntel(data, signal.startBit, signal.length, raw);
    } else {
      encodeMotorola(data, signal.startBit, signal.length, raw);
    }
  }

  return data;
}

/** Decode a CAN payload into physical signal values */
export function decodePayload(
  message: DbcMessage,
  data: Uint8Array,
): SignalState {
  const state: SignalState = {};

  for (const signal of message.signals) {
    let raw: bigint;
    if (signal.byteOrder === 'intel') {
      raw = decodeIntel(data, signal.startBit, signal.length);
    } else {
      raw = decodeMotorola(data, signal.startBit, signal.length);
    }
    state[signal.name] = rawToPhysical(signal, raw);
  }

  return state;
}

/** Format bytes as hex string */
export function toHexString(data: Uint8Array): string {
  return Array.from(data)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/** Format CAN ID as hex */
export function formatCanId(id: number): string {
  const isExtended = id > 0x7ff;
  return `0x${id
    .toString(16)
    .toUpperCase()
    .padStart(isExtended ? 8 : 3, '0')}`;
}

/** Get default signal state (all at min or 0) */
export function getDefaultState(message: DbcMessage): SignalState {
  const state: SignalState = {};
  for (const signal of message.signals) {
    state[signal.name] = signal.min || 0;
  }
  return state;
}

/** Get all available multiplex values for a message */
export function getMultiplexValues(message: DbcMessage): number[] {
  if (!message.hasMultiplex) return [];

  const values = new Set<number>();
  for (const sig of message.signals) {
    if (sig.multiplexId !== undefined && sig.multiplexId !== -1) {
      values.add(sig.multiplexId);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

/** Get the multiplexer signal in a message */
export function getMultiplexerSignal(message: DbcMessage): DbcSignal | null {
  return message.signals.find(s => s.isMultiplexer) || null;
}
