export interface DbcSignal {
  name: string;
  startBit: number;
  length: number;
  byteOrder: 'intel' | 'motorola'; // 1 = intel, 0 = motorola
  isSigned: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit: string;
  receivers: string[];
  comment?: string;
  // Multiplex support
  isMultiplexer?: boolean; // true if this is the multiplex selector
  multiplexId?: number; // specific multiplex value for this signal (-1 for all)
  multiplexerSignal?: string; // name of the multiplexer signal
}

export interface DbcMessage {
  id: number;
  name: string;
  dlc: number;
  transmitter: string;
  signals: DbcSignal[];
  comment?: string;
  hasMultiplex?: boolean; // true if message has any multiplex signals
}

export interface DbcFile {
  version: string;
  messages: DbcMessage[];
  nodes: string[];
}

export interface SignalState {
  [signalName: string]: number; // physical value
}

export interface MultiplexInfo {
  multiplexerName: string;
  multiplexValue: number;
}
